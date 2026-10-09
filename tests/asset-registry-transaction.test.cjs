'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  cp = require('node:child_process');
const T = require('../scripts/asset-registry-transaction.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-transaction-')),
  files = ['approval.json', 'manifest.json'].map((n) => path.join(root, n)),
  initial = files.map((_, i) => Buffer.from(JSON.stringify({ value: i })));
const reset = () => files.forEach((f, i) => fs.writeFileSync(f, initial[i]));
(async () => {
  try {
    reset();
    const stale = T.snapshot(files);
    await T.commit({
      root,
      id: 'sprites',
      state: stale,
      values: [{ value: 3 }, { value: 4 }],
      verify: async () => true,
    });
    await assert.rejects(
      T.commit({ root, id: 'sprites', state: stale, values: [{}, {}], verify: async () => true }),
      /changed during preflight/,
    );
    assert.equal(JSON.parse(fs.readFileSync(files[0])).value, 3);
    const state = T.snapshot(files);
    let finish;
    const waiting = new Promise((r) => (finish = r));
    const first = T.commit({
      root,
      id: 'sprites',
      state,
      values: [{ value: 5 }, { value: 6 }],
      verify: () => waiting,
    });
    await assert.rejects(
      T.commit({ root, id: 'sprites', state, values: [{}, {}], verify: async () => true }),
      /active|busy/,
    );
    assert.throws(() => T.recover({ root, id: 'sprites', files }), /active publisher/);
    finish(true);
    await first;
    const verified = T.snapshot(files);
    await assert.rejects(
      T.commit({
        root,
        id: 'sprites',
        state: verified,
        values: [{}, {}],
        verify: async () => {
          throw Error('injected validation failure');
        },
      }),
      /injected/,
    );
    files.forEach((f, i) => assert(fs.readFileSync(f).equals(verified.bytes[i])));
    reset();
    const modulePath = path.resolve(__dirname, '../scripts/asset-registry-transaction.cjs');
    // Kill the process after the first registry rename: finally/catch cannot repair it.
    const killed = cp.spawnSync(
      process.execPath,
      [
        '-e',
        `
  const fs=require('node:fs'),T=require(process.argv[1]),root=process.argv[2],files=JSON.parse(process.argv[3]);
  const rename=fs.renameSync;fs.renameSync=(from,to)=>{rename(from,to);if(to===files[0])process.kill(process.pid,'SIGKILL');};
  T.commit({root,id:'sprites',state:T.snapshot(files),values:[{value:7},{value:8}],verify:async()=>true});
 `,
        modulePath,
        root,
        JSON.stringify(files),
      ],
      { encoding: 'utf8' },
    );
    assert.equal(killed.signal, 'SIGKILL');
    assert.equal(JSON.parse(fs.readFileSync(files[0])).value, 7);
    assert(fs.readFileSync(files[1]).equals(initial[1]));
    assert.throws(() => T.assertClean(root, 'sprites'), /Interrupted/);
    fs.writeFileSync(files[1], JSON.stringify({ userEdit: true }));
    assert.throws(() => T.recover({ root, id: 'sprites', files }), /refuses overwrite/);
    fs.writeFileSync(files[1], initial[1]);
    assert(T.recover({ root, id: 'sprites', files }).recovered);
    files.forEach((f, i) => assert(fs.readFileSync(f).equals(initial[i])));
    assert.equal(T.recover({ root, id: 'sprites', files }).recovered, false);
    // A partial staging copy never reaches its immutable target name.
    const source = path.join(root, 'source.bin'),
      target = path.join(root, 'assets', 'target.bin');
    fs.writeFileSync(source, Buffer.from('retained original'));
    await assert.rejects(
      T.commit({
        root,
        id: 'materials',
        state: T.snapshot(files),
        values: [{}, {}],
        copies: [{ source, target, expectedHash: '0'.repeat(64) }],
        verify: async () => true,
      }),
      /Resource changed/,
    );
    assert(!fs.existsSync(target));
    files.forEach((f, i) => assert(fs.readFileSync(f).equals(initial[i])));
    console.log(
      'PASS registry CAS, exclusive publication, validation rollback, hard-kill pair recovery, unrelated-edit retention and atomic immutable copies',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
