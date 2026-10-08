'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  cp = require('node:child_process');
const { publishedFiles, limits } = require('./audio-assets.cjs');
function addRegistration(root, manifest, id, file, options = {}, probe) {
  if (!/^[a-z0-9][a-z0-9:_-]*$/.test(id)) throw Error('Invalid sound identity');
  const source = './' + file.replace(/^\.\//, '');
  if (!/^\.\/assets\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(source))
    throw Error('Place the recording under assets/audio first');
  const disk = path.join(root, source.slice(2));
  if (!fs.statSync(disk).isFile() || fs.statSync(disk).size > limits.perFile)
    throw Error('Recording exceeds file budget');
  if (
    !fs.realpathSync(disk).startsWith(fs.realpathSync(path.join(root, 'assets/audio')) + path.sep)
  )
    throw Error('Recording escapes audio folder');
  const duration = probe
    ? probe(disk)
    : Number(
        JSON.parse(
          cp.execFileSync(
            'ffprobe',
            ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', disk],
            { encoding: 'utf8', maxBuffer: 1024 * 1024 },
          ),
        ).format.duration,
      );
  const previous = manifest.assets[id] || {},
    entry = {
      ...previous,
      kind: options.kind || previous.kind || 'effect',
      src: source,
      duration,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(disk)).digest('hex'),
      credits: {
        author: options.author || previous.credits?.author,
        license: options.license || previous.credits?.license,
      },
    };
  delete entry.managedBy;
  delete entry.variants;
  entry.creationMethod = 'imported-recording';
  if (options.title !== undefined) entry.title = options.title;
  if (options.bpm !== undefined) entry.bpm = Number(options.bpm);
  if (options['loop-start'] !== undefined || options['loop-end'] !== undefined) {
    if (options['loop-start'] === undefined || options['loop-end'] === undefined)
      throw Error('Supply both loop bounds');
    entry.loop = { start: Number(options['loop-start']), end: Number(options['loop-end']) };
  }
  if (options['no-loop']) delete entry.loop;
  manifest.assets[id] = entry;
}
function register(root, id, file, options = {}, probe) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'assets/audio/manifest.json'), 'utf8'),
  );
  addRegistration(root, manifest, id, file, options, probe);
  publishedFiles(root, manifest); // Refuse invalid changes before replacing the catalog.
  return manifest;
}
function registerBatch(root, entries, probe) {
  if (
    !Array.isArray(entries) ||
    !entries.length ||
    new Set(entries.map((e) => e.id)).size !== entries.length
  )
    throw Error('Invalid registration batch');
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'assets/audio/manifest.json'), 'utf8'),
  );
  for (const { id, file, ...options } of entries)
    addRegistration(root, manifest, id, file, options, probe);
  publishedFiles(root, manifest);
  return manifest;
}
function bind(root, key, id, options = {}) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'assets/audio/manifest.json'), 'utf8'),
  );
  if (!Object.hasOwn(manifest.director?.events || {}, key))
    throw Error('Unknown event; use a key from director.events');
  const binding = { asset: id, when: options.when ? JSON.parse(options.when) : {} };
  for (const field of ['gain', 'pan', 'minGap', 'priority'])
    if (options[field] !== undefined) binding[field] = Number(options[field]);
  if (options.bus !== undefined) binding.bus = options.bus;
  const matchKey = (when) =>
    JSON.stringify(Object.entries(when || {}).sort(([a], [b]) => a.localeCompare(b)));
  manifest.director.events[key] = [
    binding,
    ...manifest.director.events[key].filter((b) => matchKey(b.when) !== matchKey(binding.when)),
  ];
  publishedFiles(root, manifest);
  return manifest;
}
function main(argv = process.argv.slice(2), root = path.resolve(__dirname, '..')) {
  const [command, ...args] = argv,
    values = [],
    options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (key === 'no-loop') options[key] = true;
      else {
        if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error('Missing value for --' + key);
        options[key] = args[++i];
      }
    } else values.push(args[i]);
  }
  const allowed =
    command === 'register'
      ? ['kind', 'author', 'license', 'title', 'bpm', 'loop-start', 'loop-end', 'no-loop']
      : ['when', 'gain', 'pan', 'minGap', 'priority', 'bus'];
  if (Object.keys(options).some((key) => !allowed.includes(key))) throw Error('Unknown option');
  if (command === 'check') {
    const files = publishedFiles(root),
      bytes = files
        .slice(1)
        .reduce((sum, file) => sum + fs.statSync(path.join(root, file)).size, 0);
    console.log(
      JSON.stringify(
        {
          files: files.length - 1,
          encodedMiB: +(bytes / 1024 ** 2).toFixed(2),
          remainingMiB: +((limits.total - bytes) / 1024 ** 2).toFixed(2),
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'batch' && (values.length !== 1 || Object.keys(options).length))
    throw Error('Use batch <registrations.json>');
  if (command !== 'batch' && (!['register', 'bind'].includes(command) || values.length !== 2))
    throw Error(
      'Use register <id> <assets/audio/file>, batch <registrations.json> or bind <event> <id>',
    );
  const manifest =
    command === 'batch'
      ? registerBatch(root, JSON.parse(fs.readFileSync(path.resolve(root, values[0]), 'utf8')))
      : command === 'register'
        ? register(root, ...values, options)
        : bind(root, ...values, options);
  const target = path.join(root, 'assets/audio/manifest.json'),
    staged = target + '.tmp';
  try {
    fs.writeFileSync(staged, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(staged, target);
  } finally {
    if (fs.existsSync(staged)) fs.unlinkSync(staged);
  }
  console.log('Updated ' + values[0] + '; run npm run build and release checks.');
}
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { register, registerBatch, bind, main };
