'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');

// Reuse only an exact-tree certificate produced by successful full PR checks.
// Every uncertainty falls back to the existing complete main validation.
async function reusableValidation({ event, ref, repository, tree, api, readCertificate }) {
  const no = { reuse: false };
  if (
    event !== 'push' ||
    ref !== 'refs/heads/main' ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository || '') ||
    !/^[0-9a-f]{40}$/.test(tree || '')
  )
    return no;
  try {
    const name = 'validated-tree-' + tree;
    const artifacts = await api(`/repos/${repository}/actions/artifacts?name=${name}&per_page=30`);
    if (
      !Number.isInteger(artifacts.total_count) ||
      !Array.isArray(artifacts.artifacts) ||
      artifacts.total_count !== artifacts.artifacts.length ||
      artifacts.total_count > 30
    )
      return no;
    const candidates = artifacts.artifacts.filter(
      (item) => item?.name === name && item.expired === false,
    );
    if (candidates.length !== 1) return no;
    const artifact = candidates[0];
    if (!Number.isSafeInteger(artifact.id) || artifact.id <= 0) return no;
    const id = artifact.workflow_run?.id;
    if (!Number.isSafeInteger(id) || id <= 0) return no;
    const run = await api(`/repos/${repository}/actions/runs/${id}`);
    if (
      run.id !== id ||
      run.status !== 'completed' ||
      run.conclusion !== 'success' ||
      run.event !== 'pull_request' ||
      !/^[0-9a-f]{40}$/.test(run.head_sha || '') ||
      run.path !== '.github/workflows/pages.yml' ||
      run.repository?.full_name !== repository ||
      run.head_repository?.full_name !== repository ||
      !Number.isSafeInteger(run.repository?.id) ||
      run.repository.id <= 0 ||
      run.head_repository?.id !== run.repository.id
    )
      return no;
    // Bind evidence to GitHub's recorded PR source, not merely an artifact claim.
    // A branch missing newer base changes safely takes the full-validation path.
    const head = await api(`/repos/${repository}/git/commits/${run.head_sha}`);
    if (head.sha !== run.head_sha || head.tree?.sha !== tree) return no;
    const result = await api(
      `/repos/${repository}/actions/runs/${id}/jobs?filter=latest&per_page=100`,
    );
    if (
      !Number.isInteger(result.total_count) ||
      !Array.isArray(result.jobs) ||
      result.total_count !== result.jobs.length ||
      result.total_count > 100
    )
      return no;
    for (const name of ['pr-check', 'phone-webkit', 'certify-pr']) {
      const matches = result.jobs.filter((job) => job?.name === name);
      if (
        matches.length !== 1 ||
        matches[0].status !== 'completed' ||
        matches[0].conclusion !== 'success'
      )
        return no;
    }
    const certificate = await readCertificate(artifact);
    if (
      certificate?.version !== 1 ||
      certificate.tree !== tree ||
      !/^[0-9a-f]{40}$/.test(certificate.commit || '') ||
      certificate.run_id !== id ||
      certificate.full !== true
    )
      return no;
    const commit = await api(`/repos/${repository}/git/commits/${certificate.commit}`);
    if (commit.sha !== certificate.commit || commit.tree?.sha !== tree) return no;
    return { reuse: true, run_id: String(id) };
  } catch {
    return no;
  }
}

// Parse only a tiny JSON member in memory; never extract archive paths or execute contents.
function readZipCertificate(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > 1024 * 1024) throw Error('Oversized archive');
  const source = `
import io, sys, zipfile
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as archive:
    entries = archive.infolist()
    if len(entries) != 1 or entries[0].filename != 'certificate.json':
        raise ValueError('Unexpected archive members')
    if entries[0].file_size > 16384:
        raise ValueError('Oversized certificate')
    with archive.open(entries[0]) as member:
        content = member.read(16385)
    if len(content) > 16384:
        raise ValueError('Oversized certificate')
    sys.stdout.buffer.write(content)
`;
  return JSON.parse(
    cp.execFileSync('python3', ['-c', source], {
      input: bytes,
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 16384,
      stdio: ['pipe', 'pipe', 'pipe'],
    }),
  );
}

async function downloadCertificate({ repository, token, artifact, request = fetch }) {
  if (!Number.isSafeInteger(artifact.id) || artifact.id <= 0) throw Error('Invalid artifact');
  const signal = AbortSignal.timeout(10000);
  const response = await request(
    `https://api.github.com/repos/${repository}/actions/artifacts/${artifact.id}/zip`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'manual',
      signal,
    },
  );
  if (response.status !== 302) throw Error('Missing artifact redirect');
  const location = new URL(response.headers.get('location'));
  if (location.protocol !== 'https:' || location.username || location.password)
    throw Error('Unsafe artifact redirect');
  // GitHub's signed storage URL receives no GitHub credential, including on redirects.
  const archive = await request(location.href, { redirect: 'error', signal });
  if (!archive.ok || !archive.body) throw Error('Artifact unavailable');
  const limit = 1024 * 1024;
  if (Number(archive.headers.get('content-length')) > limit) throw Error('Oversized archive');
  const chunks = [];
  let size = 0;
  for await (const chunk of archive.body) {
    size += chunk.length;
    if (size > limit) throw Error('Oversized archive');
    chunks.push(Buffer.from(chunk));
  }
  return readZipCertificate(Buffer.concat(chunks, size));
}

async function main() {
  let result = { reuse: false };
  try {
    if (process.env.GITHUB_TOKEN) {
      result = await reusableValidation({
        event: process.env.GITHUB_EVENT_NAME,
        ref: process.env.GITHUB_REF,
        repository: process.env.GITHUB_REPOSITORY,
        tree: cp.execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim(),
        readCertificate: (artifact) =>
          downloadCertificate({
            repository: process.env.GITHUB_REPOSITORY,
            token: process.env.GITHUB_TOKEN,
            artifact,
          }),
        api: async (route) => {
          const response = await fetch('https://api.github.com' + route, {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok || /rel="next"/.test(response.headers.get('link') || ''))
            throw Error('Unusable API response');
          return response.json();
        },
      });
    }
  } catch {
    // API, git and environment failures never waive validation.
  }
  const output =
    'reuse=' + result.reuse + '\n' + (result.reuse ? 'run_id=' + result.run_id + '\n' : '');
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
  process.stdout.write(output);
}
if (require.main === module)
  main().catch(() => {
    process.exitCode = 1;
  });
module.exports = { reusableValidation, readZipCertificate, downloadCertificate };
