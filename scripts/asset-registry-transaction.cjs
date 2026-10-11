'use strict';
// Developer-only registry transactions. Recover an interrupted pair before further edits.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const paths = (root, id) => {
  if (!/^[a-z-]+$/.test(id)) throw Error('Invalid transaction identity');
  const dir = path.join(root, '_asset-transactions', id);
  return { dir, lock: path.join(dir, 'lock.json'), journal: path.join(dir, 'pending.json') };
};
function atomic(file, bytes) {
  const temp = file + '.transaction-' + crypto.randomBytes(8).toString('hex');
  try {
    fs.writeFileSync(temp, bytes, { flag: 'wx' });
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}
function snapshot(files) {
  const bytes = files.map((f) => fs.readFileSync(f));
  return { files, bytes, data: bytes.map((b) => JSON.parse(b)), hashes: bytes.map(hash) };
}
function assertClean(root, id) {
  const p = paths(root, id);
  if (
    fs.existsSync(p.journal) &&
    fs.existsSync(p.lock) &&
    alive(JSON.parse(fs.readFileSync(p.lock)))
  )
    throw Error('Asset registry transaction is active; retry after publication completes');
  if (fs.existsSync(p.journal))
    throw Error(
      'Interrupted ' +
        id +
        ' transaction; run ' +
        (id === 'sprites' ? 'sprite' : 'material') +
        ':recover before editing or publishing',
    );
}
function processIdentity(pid = 'self') {
  try {
    const stat = fs.readFileSync('/proc/' + pid + '/stat', 'utf8');
    const close = stat.lastIndexOf(')');
    return {
      pid: Number(stat.slice(0, stat.indexOf(' '))),
      started: stat.slice(close + 2).split(' ')[19],
    };
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}
function alive(owner) {
  const { pid, started } = owner;
  if (!Number.isInteger(pid) || pid <= 0) throw Error('Cannot verify transaction lock owner');
  if (process.platform === 'linux' && fs.existsSync('/proc/self/stat')) {
    const current = processIdentity(pid);
    return !!current && (!started || current.started === started);
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e.code === 'ESRCH') return false;
    throw e;
  }
}
function lock(p, recovery = false) {
  fs.mkdirSync(p.dir, { recursive: true });
  if (fs.realpathSync(p.dir) !== p.dir) throw Error('Transaction directory must not be symlinked');
  if (fs.existsSync(p.lock)) {
    const owner = JSON.parse(fs.readFileSync(p.lock));
    if (alive(owner)) throw Error('Asset registry is busy; active publisher owns the lock');
    if (!recovery && fs.existsSync(p.journal))
      throw Error('Interrupted transaction requires recovery');
    fs.unlinkSync(p.lock);
  }
  const fd = fs.openSync(p.lock, 'wx');
  try {
    fs.writeFileSync(
      fd,
      JSON.stringify(
        process.platform === 'linux'
          ? processIdentity() || { pid: process.pid }
          : { pid: process.pid },
      ),
    );
  } finally {
    fs.closeSync(fd);
  }
  return () => fs.rmSync(p.lock, { force: true });
}
function copyImmutable(item, created) {
  const { source, target, expectedHash } = item,
    parent = path.dirname(target);
  fs.mkdirSync(parent, { recursive: true });
  if (fs.realpathSync(parent) !== parent) throw Error('Asset directory must not be symlinked');
  if (!fs.existsSync(target)) {
    const stage = target + '.copy-' + crypto.randomBytes(8).toString('hex');
    try {
      fs.copyFileSync(source, stage, fs.constants.COPYFILE_EXCL);
      if (hash(fs.readFileSync(stage)) !== expectedHash)
        throw Error('Resource changed during publication');
      fs.linkSync(stage, target);
      created.push(target);
    } finally {
      fs.rmSync(stage, { force: true });
    }
  }
  if (hash(fs.readFileSync(target)) !== expectedHash)
    throw Error('Immutable resource hash collision');
}
async function commit({ root, id, state, values, copies = [], verify }) {
  const p = paths(root, id);
  assertClean(root, id);
  const release = lock(p),
    created = [];
  let journalWritten = false;
  try {
    if (state.files.length !== values.length) throw Error('Registry transaction arity mismatch');
    if (state.files.some((file, i) => hash(fs.readFileSync(file)) !== state.hashes[i]))
      throw Error('Registry changed during preflight; retry with current revision');
    const next = values.map((v) => Buffer.from(JSON.stringify(v, null, 2) + '\n'));
    const journal = {
      version: 1,
      files: state.files.map((file, i) => {
        const relative = path.relative(root, file);
        if (relative.startsWith('..') || path.isAbsolute(relative))
          throw Error('Registry file escapes project');
        return {
          file: relative,
          old: state.bytes[i].toString('base64'),
          next: next[i].toString('base64'),
        };
      }),
    };
    atomic(p.journal, Buffer.from(JSON.stringify(journal)));
    journalWritten = true;
    for (const item of copies) copyImmutable(item, created);
    state.files.forEach((file, i) => atomic(file, next[i]));
    const result = await verify();
    fs.unlinkSync(p.journal);
    journalWritten = false;
    return result;
  } catch (error) {
    if (journalWritten) {
      state.files.forEach((file, i) => atomic(file, state.bytes[i]));
      created.forEach((file) => fs.rmSync(file, { force: true }));
      fs.unlinkSync(p.journal);
    }
    throw error;
  } finally {
    release();
  }
}
function recover({ root, id, files }) {
  const p = paths(root, id);
  if (!fs.existsSync(p.journal)) {
    if (fs.existsSync(p.lock)) {
      const release = lock(p, true);
      release();
    }
    return { recovered: false };
  }
  const release = lock(p, true);
  try {
    const journal = JSON.parse(fs.readFileSync(p.journal));
    if (
      journal.version !== 1 ||
      journal.files.length !== files.length ||
      journal.files.some((item, i) => path.resolve(root, item.file) !== files[i])
    )
      throw Error('Recovery journal identity mismatch');
    for (const item of journal.files) {
      const actual = hash(fs.readFileSync(path.resolve(root, item.file)));
      if (
        ![hash(Buffer.from(item.old, 'base64')), hash(Buffer.from(item.next, 'base64'))].includes(
          actual,
        )
      )
        throw Error('Registry changed outside interrupted transaction; recovery refuses overwrite');
    }
    journal.files.forEach((item) =>
      atomic(path.resolve(root, item.file), Buffer.from(item.old, 'base64')),
    );
    fs.unlinkSync(p.journal);
    return {
      recovered: true,
      action: 'restored prior registry pair; immutable resources retained',
    };
  } finally {
    release();
  }
}
module.exports = { snapshot, assertClean, commit, recover };
