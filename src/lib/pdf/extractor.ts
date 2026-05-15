import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/campfire/pdf.worker.min.mjs'

interface TextItem {
  str: string
  transform: number[]
}

export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by Y coordinate (rounded to nearest 2px to handle sub-pixel differences)
    const lineMap = new Map<number, Array<{ x: number; str: string }>>()
    for (const item of content.items) {
      const ti = item as TextItem
      if (!ti.str.trim()) continue
      const y = Math.round(ti.transform[5] / 2) * 2
      const x = Math.round(ti.transform[4])
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, str: ti.str })
    }

    // Sort lines top-to-bottom (PDF y-axis is bottom-up, so descending y = top-to-bottom)
    const sortedY = [...lineMap.keys()].sort((a, b) => b - a)
    const pageLines = sortedY.map((y) => {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x)
      return items.map((i) => i.str).join(' ')
    })
    pages.push(pageLines.join('\n'))
  }

  return pages.join('\n\n')
}
