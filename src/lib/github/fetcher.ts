import { Octokit } from "@octokit/rest"
import type { RepoContext } from "@/types"

const BATCH_SIZE = 20
const MAX_TOKENS_PER_CHUNK = 80_000
const CHARS_PER_TOKEN = 4

// ─── Ignore patterns ────────────────────────────────────────────────────────

const IGNORED_DIRS = [
  "node_modules/", "dist/", "build/", ".next/", ".git/",
  "coverage/", "__pycache__/", ".pytest_cache/", "venv/", ".venv/",
]

const IGNORED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".map", ".min.js", ".min.css",
  ".zip", ".tar", ".gz", ".pdf", ".lock",
]

const IGNORED_FILES = [
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "poetry.lock", "Pipfile.lock", "composer.lock",
]

export function isIgnored(path: string): boolean {
  if (IGNORED_FILES.includes(path.split("/").pop() ?? "")) return true
  if (IGNORED_DIRS.some((d) => path.includes(d))) return true
  if (IGNORED_EXTENSIONS.some((ext) => path.endsWith(ext))) return true
  return false
}

// ─── Parse GitHub URL ────────────────────────────────────────────────────────

export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`Invalid GitHub URL: ${repoUrl}`)
  return { owner: match[1], repo: match[2] }
}

// ─── Concurrency limiter ─────────────────────────────────────────────────────

async function batchedMap<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

// ─── Chunk file contents for Bob context window ──────────────────────────────

export function batchIntoChunks(
  files: Array<{ path: string; content: string }>,
  maxTokens = MAX_TOKENS_PER_CHUNK
): string[] {
  const chunks: string[] = []
  let current = ""

  for (const file of files) {
    const block = `\n=== FILE: ${file.path} ===\n${file.content}\n`
    const blockTokens = block.length / CHARS_PER_TOKEN

    if (current.length / CHARS_PER_TOKEN + blockTokens > maxTokens && current.length > 0) {
      chunks.push(current.trim())
      current = ""
    }
    current += block
  }

  if (current.trim().length > 0) chunks.push(current.trim())
  return chunks
}

// ─── Fetch commit history ────────────────────────────────────────────────────

export async function fetchCommitHistory(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePaths: string[]
): Promise<Record<string, string>> {
  const history: Record<string, string> = {}

  await batchedMap(filePaths, BATCH_SIZE, async (path) => {
    try {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        path,
        per_page: 10,
      })
      if (data.length > 0) {
        const earliest = data[data.length - 1]
        history[path] = earliest.commit.author?.date ?? ""
      }
    } catch {
      // Non-fatal — some files may have no commit history
    }
  })

  return history
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function fetchRepo(
  repoUrl: string,
  pathFilter?: string
): Promise<RepoContext> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const { owner, repo } = parseRepoUrl(repoUrl)

  // 1. Get full file tree in one call (Git Trees API)
  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: "HEAD",
    recursive: "1",
  })

  if (treeData.truncated) {
    console.warn(`[fetcher] Tree truncated for ${owner}/${repo} — some files may be missing`)
  }

  // 2. Filter to text blobs only
  const filteredFiles = (treeData.tree ?? []).filter(
    (f) =>
      f.type === "blob" &&
      f.path &&
      !isIgnored(f.path) &&
      (!pathFilter || f.path.startsWith(pathFilter))
  )

  const filePaths = filteredFiles.map((f) => f.path!)

  // 3. Fetch file contents in parallel batches
  const fileContents = await batchedMap(
    filteredFiles,
    BATCH_SIZE,
    async (file) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path!,
        })
        if ("content" in data && typeof data.content === "string") {
          const content = Buffer.from(data.content, "base64").toString("utf-8")
          return { path: file.path!, content }
        }
      } catch {
        // Non-fatal — skip unreadable files
      }
      return null
    }
  )

  const validFiles = fileContents.filter(
    (f): f is { path: string; content: string } => f !== null
  )

  // 4. Batch into context chunks
  const chunks = batchIntoChunks(validFiles)

  // 5. Fetch commit history for all included files
  const commitHistory = await fetchCommitHistory(octokit, owner, repo, filePaths)

  return {
    chunks,
    commitHistory,
    fileList: filePaths,
    repoUrl,
    owner,
    repo,
  }
}
