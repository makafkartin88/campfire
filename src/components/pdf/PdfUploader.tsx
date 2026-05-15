import { useRef, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { extractTextFromPdf } from '../../lib/pdf/extractor'
import { detectChordsInText } from '../../lib/pdf/chord-detector'

interface Props {
  onExtracted: (content: string, filename: string) => void
}

export function PdfUploader({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function processFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Prosím nahraj PDF soubor.')
      return
    }
    setProcessing(true)
    setError(null)
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const rawText = await extractTextFromPdf(buf)
      const withChords = detectChordsInText(rawText)
      const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
      onExtracted(withChords, title)
    } catch (e) {
      setError('Nepodařilo se extrahovat text z PDF.')
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-fire-500 bg-fire-950/20' : 'border-stone-700 hover:border-stone-600'}
        `}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
        {processing ? (
          <div className="text-stone-400 text-sm">Zpracovávám PDF…</div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
            <FileText size={16} className="text-fire-400" />
            {fileName}
            <button
              onClick={(e) => { e.stopPropagation(); setFileName(null) }}
              className="text-stone-600 hover:text-stone-400"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-stone-500">
            <Upload size={20} />
            <span className="text-sm">Přetáhni PDF nebo klikni pro výběr</span>
            <span className="text-xs text-stone-600">Funguje jen pro textová PDF (ne skeny)</span>
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
