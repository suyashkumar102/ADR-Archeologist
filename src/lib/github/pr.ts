import { Octokit } from "@octokit/rest"
import type { ADRPackage } from "@/types"
import { parseRepoUrl } from "./fetcher"
import { toMADR, toFilename, buildIndex } from "@/lib/export/madr"

const BRANCH_NAME = "adr-archaeologist/add-adrs"
const PR_TITLE = "docs: add reconstructed ADRs via ADR Archaeologist"

function buildPRBody(pkg: ADRPackage): string {
  return `## ADR Archaeologist — Reconstructed Architecture Decision Records

This pull request adds **${pkg.adrs.length} Architecture Decision Records** to \`/docs/adr/\`, reconstructed from the codebase by [ADR Archaeologist](https://github.com/adr-archaeologist).

These ADRs were not written by hand — they were inferred from code patterns, dependencies, commit history, and structure using IBM Bob's full-repository context analysis.

### Decisions recovered

${pkg.adrs.map((a) => `- **${a.id}**: ${a.title} (\`${a.status}\`, confidence: ${Math.round(a.confidence * 100)}%)`).join("\n")}

### How to review

Each ADR in \`/docs/adr/\` follows the [MADR format](https://adr.github.io/madr/). Review the context, decision, and consequences sections. If the inferred rationale is incorrect, update the ADR directly — it is now a living document.

---
*Generated at ${pkg.generatedAt} · Pipeline: ${pkg.pipelineStats.stage1DurationMs + pkg.pipelineStats.stage2DurationMs + pkg.pipelineStats.stage3DurationMs + pkg.pipelineStats.stage4DurationMs}ms total*`
}

export async function createPR(pkg: ADRPackage, token: string): Promise<string> {
  const octokit = new Octokit({ auth: token })
  const { owner: originalOwner, repo } = parseRepoUrl(pkg.repoUrl)

  // 1. Determine working owner (fork if needed)
  const { data: authUser } = await octokit.users.getAuthenticated()
  let workingOwner = originalOwner

  if (authUser.login.toLowerCase() !== originalOwner.toLowerCase()) {
    // Fork the repo
    await octokit.repos.createFork({ owner: originalOwner, repo })
    // Wait for fork to be ready
    await new Promise((r) => setTimeout(r, 3000))
    workingOwner = authUser.login
  }

  // 2. Get default branch SHA
  const { data: repoData } = await octokit.repos.get({ owner: workingOwner, repo })
  const defaultBranch = repoData.default_branch

  const { data: branchData } = await octokit.repos.getBranch({
    owner: workingOwner,
    repo,
    branch: defaultBranch,
  })
  const baseSha = branchData.commit.sha

  // 3. Create new branch
  try {
    await octokit.git.createRef({
      owner: workingOwner,
      repo,
      ref: `refs/heads/${BRANCH_NAME}`,
      sha: baseSha,
    })
  } catch (err: unknown) {
    // Branch may already exist — delete and recreate
    if ((err as { status?: number }).status === 422) {
      await octokit.git.deleteRef({
        owner: workingOwner,
        repo,
        ref: `heads/${BRANCH_NAME}`,
      })
      await octokit.git.createRef({
        owner: workingOwner,
        repo,
        ref: `refs/heads/${BRANCH_NAME}`,
        sha: baseSha,
      })
    } else {
      throw err
    }
  }

  // 4. Create blobs for each ADR file + README
  const files: Array<{ path: string; content: string }> = [
    ...pkg.adrs.map((adr) => ({
      path: `docs/adr/${toFilename(adr)}`,
      content: toMADR(adr),
    })),
    {
      path: "docs/adr/README.md",
      content: buildIndex(pkg),
    },
  ]

  const blobs = await Promise.all(
    files.map(async (f) => {
      const { data } = await octokit.git.createBlob({
        owner: workingOwner,
        repo,
        content: Buffer.from(f.content).toString("base64"),
        encoding: "base64",
      })
      return { path: f.path, sha: data.sha }
    })
  )

  // 5. Create tree
  const { data: treeData } = await octokit.git.createTree({
    owner: workingOwner,
    repo,
    base_tree: baseSha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  })

  // 6. Create commit
  const { data: commitData } = await octokit.git.createCommit({
    owner: workingOwner,
    repo,
    message: `docs: add ${pkg.adrs.length} reconstructed ADRs via ADR Archaeologist`,
    tree: treeData.sha,
    parents: [baseSha],
  })

  // 7. Update branch ref
  await octokit.git.updateRef({
    owner: workingOwner,
    repo,
    ref: `heads/${BRANCH_NAME}`,
    sha: commitData.sha,
  })

  // 8. Open PR (against original repo if forked)
  const head = workingOwner !== originalOwner
    ? `${workingOwner}:${BRANCH_NAME}`
    : BRANCH_NAME

  const { data: pr } = await octokit.pulls.create({
    owner: originalOwner,
    repo,
    title: PR_TITLE,
    body: buildPRBody(pkg),
    head,
    base: defaultBranch,
  })

  return pr.html_url
}
