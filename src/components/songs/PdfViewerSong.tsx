interface Props {
  driveFileId: string
  title: string
}

export function PdfViewerSong({ driveFileId, title }: Props) {
  // Google Drive embedded preview — works for publicly shared files without auth
  const previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-stone-100">{title}</h1>
        <a
          href={`https://drive.google.com/file/d/${driveFileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-500 hover:text-fire-400 transition-colors mt-1 inline-block"
        >
          Otevřít v Google Drive ↗
        </a>
      </div>
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-stone-800">
        <iframe
          src={previewUrl}
          title={title}
          className="w-full h-full"
          style={{ minHeight: 'calc(100vh - 180px)' }}
          allow="autoplay"
        />
      </div>
    </div>
  )
}
