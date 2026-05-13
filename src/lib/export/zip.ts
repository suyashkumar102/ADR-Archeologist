import JSZip from "jszip"
import type { ADRPackage } from "@/types"
import { toMADR, toFilename, buildIndex } from "./madr"

export async function buildZip(pkg: ADRPackage): Promise<Blob> {
  const zip = new JSZip()
  const folder = zip.folder("docs/adr")!

  for (const adr of pkg.adrs) {
    folder.file(toFilename(adr), toMADR(adr))
  }

  folder.file("README.md", buildIndex(pkg))

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" })
}

export async function downloadZip(pkg: ADRPackage): Promise<void> {
  const blob = await buildZip(pkg)
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `adr-archaeologist-${pkg.repoName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Revoke after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
