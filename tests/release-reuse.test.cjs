'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const {
  reusableValidation,
  readZipCertificate,
  downloadCertificate,
} = require('../.github/scripts/reuse-validation.cjs');
const tree = 'a'.repeat(40);
const commit = 'b'.repeat(40);
const head = 'c'.repeat(40);
const repository = 'owner/game';
const fixture = () => ({
  artifacts: {
    total_count: 1,
    artifacts: [
      { id: 7, name: 'validated-tree-' + tree, expired: false, workflow_run: { id: 42 } },
    ],
  },
  run: {
    id: 42,
    head_sha: head,
    status: 'completed',
    conclusion: 'success',
    event: 'pull_request',
    path: '.github/workflows/pages.yml',
    repository: { full_name: repository, id: 8 },
    head_repository: { full_name: repository, id: 8 },
  },
  certificate: { version: 1, full: true, tree, commit, run_id: 42 },
  commit: { sha: commit, tree: { sha: tree } },
  head: { sha: head, tree: { sha: tree } },
  jobs: {
    total_count: 3,
    jobs: ['pr-check', 'phone-webkit', 'certify-pr'].map((name) => ({
      name,
      status: 'completed',
      conclusion: 'success',
    })),
  },
});
async function check(data = fixture(), overrides = {}) {
  return reusableValidation({
    event: 'push',
    ref: 'refs/heads/main',
    repository,
    tree,
    api: async (route) =>
      route.includes('/artifacts?')
        ? data.artifacts
        : route.includes('/jobs?')
          ? data.jobs
          : route === `/repos/${repository}/git/commits/${head}`
            ? data.head
            : route.includes('/git/commits/')
              ? data.commit
              : data.run,
    readCertificate: async () => data.certificate,
    ...overrides,
  });
}
(async () => {
  assert.deepEqual(await check(), { reuse: true, run_id: '42' });
  for (const overrides of [
    { event: 'workflow_dispatch' },
    { event: 'pull_request' },
    { ref: 'refs/heads/other' },
    { tree: 'bad' },
    { repository: '../bad' },
    {
      api: async () => {
        throw Error('API unavailable');
      },
    },
    {
      readCertificate: async () => {
        throw Error('Download unavailable');
      },
    },
    { readCertificate: undefined },
    { api: async () => null },
    { api: async () => ({}) },
  ])
    assert.deepEqual(await check(fixture(), overrides), { reuse: false });
  // A failure specifically while fetching GitHub's recorded head never waives testing.
  const failingHead = fixture();
  assert.deepEqual(
    await check(failingHead, {
      api: async (route) => {
        if (route === `/repos/${repository}/git/commits/${head}`) throw Error('Head unavailable');
        return route.includes('/artifacts?') ? failingHead.artifacts : failingHead.run;
      },
    }),
    { reuse: false },
  );
  const mutations = [
    (d) => {
      d.run.head_sha = '../bad';
    },
    (d) => {
      delete d.run.head_sha;
    },
    (d) => {
      d.head.sha = 'd'.repeat(40);
    },
    (d) => {
      d.head.tree.sha = 'd'.repeat(40);
    },
    (d) => {
      d.head = null;
    },
    (d) => {
      delete d.head.tree;
    },
    (d) => {
      d.artifacts.artifacts[0].id = '7';
    },
    (d) => {
      d.artifacts.artifacts[0].id = -7;
    },
    (d) => {
      d.run.repository.id = '8';
    },
    (d) => {
      d.run.repository.id = 0;
      d.run.head_repository.id = 0;
    },
    (d) => {
      d.run.head_repository.id = 9;
    },
    (d) => {
      d.run.head_repository.id = '8';
    },
    (d) => {
      d.certificate = null;
    },
    (d) => {
      d.certificate.version = '1';
    },
    (d) => {
      d.certificate.full = false;
    },
    (d) => {
      d.certificate.full = 'true';
    },
    (d) => {
      d.certificate.tree = 'c'.repeat(40);
    },
    (d) => {
      d.certificate.commit = '../bad';
    },
    (d) => {
      d.certificate.run_id = 43;
    },
    (d) => {
      d.certificate.run_id = '42';
    },
    (d) => {
      delete d.certificate.commit;
    },
    (d) => {
      d.commit.sha = 'c'.repeat(40);
    },
    (d) => {
      d.commit.tree.sha = 'c'.repeat(40);
    },
    (d) => {
      d.artifacts = { total_count: 0, artifacts: [] };
    },
    (d) => {
      d.artifacts.artifacts[0].expired = true;
    },
    (d) => {
      d.artifacts.artifacts[0].name = 'validated-tree-' + 'b'.repeat(40);
    },
    (d) => {
      d.artifacts.artifacts[0].name = 'untrusted-certificate';
    },
    (d) => {
      d.artifacts.artifacts[0].workflow_run.id = '42';
    },
    (d) => {
      d.artifacts.total_count = 31;
    },
    (d) => {
      d.artifacts.artifacts.push(d.artifacts.artifacts[0]);
      d.artifacts.total_count++;
    },
    (d) => {
      d.run.id = 43;
    },
    (d) => {
      d.run.path = '.github/workflows/other.yml';
    },
    (d) => {
      d.run.repository.full_name = 'other/game';
    },
    (d) => {
      d.run.head_repository.full_name = 'fork/game';
    },
    (d) => {
      d.run.event = 'push';
    },
    (d) => {
      d.run.status = 'in_progress';
    },
    (d) => {
      d.run.conclusion = 'failure';
    },
    (d) => {
      d.jobs.total_count = 101;
    },
    (d) => {
      d.jobs.jobs.pop();
      d.jobs.total_count--;
    },
    (d) => {
      d.jobs.jobs.push(d.jobs.jobs[0]);
      d.jobs.total_count++;
    },
  ];
  for (const name of ['pr-check', 'phone-webkit', 'certify-pr']) {
    for (const conclusion of ['failure', 'skipped', 'cancelled', null]) {
      mutations.push((d) => {
        d.jobs.jobs.find((j) => j.name === name).conclusion = conclusion;
      });
    }
    mutations.push((d) => {
      d.jobs.jobs.find((j) => j.name === name).status = 'in_progress';
    });
  }
  for (const mutate of mutations) {
    const data = fixture();
    mutate(data);
    assert.deepEqual(await check(data), { reuse: false }, mutate.toString());
  }
  // Real ZIP parser fixtures exercise corruption, path/membership and size limits.
  const zip = (entries) =>
    cp.execFileSync(
      'python3',
      [
        '-c',
        `
import io, json, sys, warnings, zipfile
warnings.filterwarnings('ignore', message='Duplicate name:')
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, value in json.load(sys.stdin):
        archive.writestr(name, value)
sys.stdout.buffer.write(buffer.getvalue())
`,
      ],
      { input: JSON.stringify(entries) },
    );
  const certificate = fixture().certificate;
  const valid = zip([['certificate.json', JSON.stringify(certificate)]]);
  assert.deepEqual(readZipCertificate(valid), certificate);
  for (const bytes of [
    Buffer.from('corrupt'),
    valid.subarray(0, valid.length - 10),
    zip([
      ['certificate.json', '{}'],
      ['extra.json', '{}'],
    ]),
    zip([['../certificate.json', '{}']]),
    zip([
      ['certificate.json', '{}'],
      ['certificate.json', '{}'],
    ]),
    zip([['certificate.json', 'x'.repeat(16385)]]),
    zip([['certificate.json', 'invalid json']]),
    Buffer.alloc(1024 * 1024 + 1),
  ])
    assert.throws(() => readZipCertificate(bytes));

  // The token is only sent to GitHub; signed storage downloads cannot redirect it.
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? new Response(null, {
          status: 302,
          headers: { location: 'https://storage.example/certificate.zip?signature=ok' },
        })
      : new Response(valid);
  };
  assert.deepEqual(
    await downloadCertificate({ repository, token: 'test-token', artifact: { id: 7 }, request }),
    certificate,
  );
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/game/actions/artifacts/7/zip');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.equal(calls[0].options.redirect, 'manual');
  assert.equal(calls[1].options.headers, undefined);
  assert.equal(calls[1].options.redirect, 'error');
  for (const location of [
    'http://storage.example/cert.zip',
    'https://user:pass@storage.example/cert.zip',
    '/relative',
    '',
  ]) {
    await assert.rejects(
      downloadCertificate({
        repository,
        token: 'test',
        artifact: { id: 7 },
        request: async () => new Response(null, { status: 302, headers: { location } }),
      }),
    );
  }
  for (const response of [
    new Response(null, { status: 404 }),
    new Response(Buffer.alloc(1024 * 1024 + 1)),
    new Response(valid, { headers: { 'content-length': String(1024 * 1024 + 1) } }),
  ]) {
    let count = 0;
    await assert.rejects(
      downloadCertificate({
        repository,
        token: 'test',
        artifact: { id: 7 },
        request: async () =>
          ++count === 1
            ? new Response(null, {
                status: 302,
                headers: { location: 'https://storage.example/cert.zip' },
              })
            : response,
      }),
    );
  }
  console.log(
    'PASS release reuse: exact tree and successful same-repo full PR certification; all ambiguous, failed, skipped, foreign and unavailable evidence fails closed',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
