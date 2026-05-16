import { Octokit } from '@octokit/rest'
import type { RepoContext, RepoFile, RepoValidation } from '@/types'

/**
 * Priority file extensions to fetch first for better context
 */
const PRIORITY_EXTENSIONS = [
  '.py', '.js', '.ts', '.go', '.java', '.rs', '.rb', '.php',
  '.cfg', '.toml', '.yaml', '.yml', '.json'
]

/**
 * Priority filenames to always include
 */
const PRIORITY_FILENAMES = [
  'requirements.txt', 'package.json', 'Makefile', 'Dockerfile',
  'go.mod', 'Cargo.toml', 'Gemfile', 'composer.json'
]

/**
 * Maximum file size to fetch (5KB - extreme reduction for Groq free tier)
 */
const MAX_FILE_SIZE = 5 * 1024

/**
 * Maximum number of files to fetch (20 files for Groq 12k token limit)
 * At ~4 chars/token and 500 chars per file, 20 files ≈ 10KB ≈ ~2.5k tokens
 * Leaves 9.5k tokens for system prompts and response
 */
const MAX_FILES = 20

/**
 * Batch size for parallel file fetching
 */
const BATCH_SIZE = 20

/**
 * Lazily construct the Octokit client.
 *
 * IMPORTANT: this must NOT run at module load. server.ts calls dotenv.config()
 * in its top-level body, but ES module imports are evaluated *before* that
 * body runs — so reading process.env.GITHUB_TOKEN at import time yields
 * undefined, every GitHub call goes out unauthenticated, and the 60 req/hour
 * limit is hit almost immediately. Constructing on first call (which only
 * happens after the server is up and env is loaded) reads the real token.
 */
let _octokit: Octokit | null = null

function getOctokit(): Octokit {
  if (!_octokit) {
    const auth = process.env.GITHUB_TOKEN
    if (!auth) {
      console.warn(
        "[github] GITHUB_TOKEN is not set — using unauthenticated API (60 requests/hour). Set GITHUB_TOKEN for 5000/hour."
      )
    }
    _octokit = new Octokit({ auth })
  }
  return _octokit
}

/**
 * Parse a GitHub repository URL into owner and repo components
 * 
 * @param url - GitHub repository URL (e.g., "https://github.com/django/django")
 * @returns Object containing owner and repo
 * @throws Error if URL is not a valid GitHub repository URL
 * 
 * @example
 * parseRepoUrl("https://github.com/django/django")
 * // Returns: { owner: "django", repo: "django" }
 */
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  // Remove trailing slash if present
  const cleanUrl = url.trim().replace(/\/$/, '')
  
  // Match GitHub URL patterns
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
    /^github\.com\/([^\/]+)\/([^\/]+)$/,
    /^([^\/]+)\/([^\/]+)$/
  ]
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern)
    if (match) {
      const owner = match[1]
      const repo = match[2].replace(/\.git$/, '') // Remove .git suffix if present
      
      if (!owner || !repo) {
        throw new Error('Invalid GitHub URL: missing owner or repository name')
      }
      
      return { owner, repo }
    }
  }
  
  throw new Error(
    'Invalid GitHub URL format. Expected format: https://github.com/owner/repo'
  )
}

/**
 * Detect the primary programming language based on file extensions
 * 
 * @param files - Array of repository files
 * @returns The most common file extension (language)
 * 
 * @example
 * detectPrimaryLanguage([
 *   { path: "main.py", content: "..." },
 *   { path: "utils.py", content: "..." },
 *   { path: "config.json", content: "..." }
 * ])
 * // Returns: "Python"
 */
export function detectPrimaryLanguage(files: RepoFile[]): string {
  const extensionCounts: Record<string, number> = {}
  
  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase()
    if (ext) {
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1
    }
  }
  
  // Find the most common extension
  let maxCount = 0
  let primaryExt = 'Unknown'
  
  for (const [ext, count] of Object.entries(extensionCounts)) {
    if (count > maxCount) {
      maxCount = count
      primaryExt = ext
    }
  }
  
  // Map extensions to language names
  const languageMap: Record<string, string> = {
    'py': 'Python',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'go': 'Go',
    'java': 'Java',
    'rs': 'Rust',
    'rb': 'Ruby',
    'php': 'PHP',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'clj': 'Clojure',
    'ex': 'Elixir',
    'erl': 'Erlang'
  }
  
  return languageMap[primaryExt] || primaryExt.toUpperCase()
}

/**
 * Check if a file should be prioritized for fetching
 */
function isPriorityFile(path: string): boolean {
  const filename = path.split('/').pop() || ''
  
  // Check priority filenames
  if (PRIORITY_FILENAMES.includes(filename)) {
    return true
  }
  
  // Check priority extensions
  return PRIORITY_EXTENSIONS.some(ext => path.endsWith(ext))
}

/**
 * Fetch file content from GitHub in parallel batches
 */
async function fetchFilesInBatches(
  owner: string,
  repo: string,
  paths: string[]
): Promise<RepoFile[]> {
  const files: RepoFile[] = []
  
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE)
    
    const batchResults = await Promise.allSettled(
      batch.map(async (path) => {
        try {
          const { data } = await getOctokit().repos.getContent({
            owner,
            repo,
            path
          })
          
          // Ensure it's a file (not a directory)
          if ('content' in data && data.type === 'file') {
            // Decode base64 content to UTF-8
            const content = Buffer.from(data.content, 'base64').toString('utf-8')
            return { path, content }
          }
          
          return null
        } catch (error) {
          // Skip files that can't be fetched (e.g., too large, binary)
          return null
        }
      })
    )
    
    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        files.push(result.value)
      }
    }
  }
  
  return files
}

/**
 * Validate a GitHub repository and check if it's accessible
 * 
 * @param url - GitHub repository URL
 * @returns Validation result with repository metadata
 * 
 * @example
 * await validateRepo("https://github.com/django/django")
 * // Returns: { valid: true, fileCount: 1234, language: "Python" }
 */
export async function validateRepo(url: string): Promise<RepoValidation> {
  try {
    const { owner, repo } = parseRepoUrl(url)
    
    // Fetch repository metadata
    const { data: repoData } = await getOctokit().repos.get({
      owner,
      repo
    })
    
    // Check if repository is private
    if (repoData.private) {
      return {
        valid: false,
        error: 'Repository is private. Please provide a public repository URL.'
      }
    }
    
    // Get file tree to count files
    const { data: treeData } = await getOctokit().git.getTree({
      owner,
      repo,
      tree_sha: repoData.default_branch,
      recursive: '1'
    })
    
    const fileCount = treeData.tree.filter(item => item.type === 'blob').length
    const language = repoData.language || 'Unknown'
    
    return {
      valid: true,
      fileCount,
      language
    }
  } catch (error: any) {
    if (error.status === 404) {
      return {
        valid: false,
        error: 'Repository not found. Please check the URL and try again.'
      }
    }
    
    if (error.status === 403) {
      return {
        valid: false,
        error: 'GitHub API rate limit exceeded. Please try again later or provide a GitHub token.'
      }
    }
    
    return {
      valid: false,
      error: `Failed to validate repository: ${error.message}`
    }
  }
}

/**
 * Fetch repository context including file tree and content
 * 
 * @param repoUrl - GitHub repository URL
 * @param pathFilter - Optional path prefix to filter files (e.g., "src/")
 * @returns Repository context with files and metadata
 * 
 * @example
 * const context = await fetchRepoContext("https://github.com/django/django", "django/")
 * // Returns: { owner: "django", repo: "django", files: [...], fileCount: 250, primaryLanguage: "Python" }
 */
export async function fetchRepoContext(
  repoUrl: string,
  pathFilter?: string
): Promise<RepoContext> {
  const { owner, repo } = parseRepoUrl(repoUrl)
  
  // Fetch repository metadata
  const { data: repoData } = await getOctokit().repos.get({
    owner,
    repo
  })
  
  // Fetch full file tree recursively
  const { data: treeData } = await getOctokit().git.getTree({
    owner,
    repo,
    tree_sha: repoData.default_branch,
    recursive: '1'
  })
  
  // Filter to blob type only and apply size/path filters
  let filePaths = treeData.tree
    .filter(item => {
      if (item.type !== 'blob') return false
      if (item.size && item.size > MAX_FILE_SIZE) return false
      if (pathFilter && !item.path?.startsWith(pathFilter)) return false
      return true
    })
    .map(item => item.path!)
  
  // Sort files: priority files first, then others
  const priorityFiles = filePaths.filter(isPriorityFile)
  const otherFiles = filePaths.filter(path => !isPriorityFile(path))
  
  // Limit to MAX_FILES total
  const selectedPaths = [
    ...priorityFiles,
    ...otherFiles.slice(0, MAX_FILES - priorityFiles.length)
  ].slice(0, MAX_FILES)
  
  // Fetch file contents in parallel batches
  const files = await fetchFilesInBatches(owner, repo, selectedPaths)
  
  // Detect primary language
  const primaryLanguage = detectPrimaryLanguage(files)
  
  return {
    owner,
    repo,
    files,
    fileCount: files.length,
    primaryLanguage
  }
}

