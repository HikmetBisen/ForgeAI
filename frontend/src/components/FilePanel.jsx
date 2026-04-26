import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, Upload, FileText, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

// Engineering drawing corner marks
function Corners() {
  return (
    <>
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-forge-blue opacity-50 z-10 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-forge-blue opacity-50 z-10 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-forge-blue opacity-50 z-10 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-forge-blue opacity-50 z-10 pointer-events-none" />
    </>
  )
}

export default function FilePanel({ file, fileUrl, fileType, isUploading, uploadError, onFileDrop, onClear }) {
  const [numPages, setNumPages]   = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  const onDrop = useCallback((accepted) => {
    setPageNumber(1)
    setNumPages(null)
    onFileDrop(accepted)
  }, [onFileDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: !!file,
    noDrag: !!file,
  })

  return (
    <div className="relative flex flex-col w-1/2 bg-forge-surface overflow-hidden">
      <Corners />

      {/* Panel header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-forge-line bg-forge-surface z-10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={12} className="text-forge-blue shrink-0" />
          {file ? (
            <span className="text-[11px] text-forge-text truncate tracking-wide">{file.name}</span>
          ) : (
            <span className="text-[10px] text-forge-dim tracking-[0.2em]">FILE VIEWER</span>
          )}
        </div>

        {file && !isUploading && (
          <div className="flex items-center gap-3 shrink-0 ml-2">
            {fileType && (
              <span className={`text-[9px] px-2 py-0.5 border tracking-widest font-semibold ${
                fileType === 'pdf'
                  ? 'border-forge-blue text-forge-blue bg-[rgba(46,117,182,0.1)]'
                  : 'border-forge-cyan text-forge-cyan bg-[rgba(0,180,216,0.1)]'
              }`}>
                {fileType.toUpperCase()}
              </span>
            )}
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-[10px] text-forge-dim hover:text-forge-red transition-colors tracking-wider"
            >
              <X size={11} />
              CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">

        {/* — Empty: dropzone — */}
        {!file && (
          <div
            {...getRootProps()}
            className={`h-full flex items-center justify-center cursor-pointer transition-all duration-200 m-5 border-2 border-dashed ${
              isDragActive
                ? 'dz-active border-forge-blue'
                : 'border-forge-line hover:border-forge-blue hover:bg-[rgba(46,117,182,0.03)]'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-5 px-8 text-center select-none">
              <div className={`relative w-16 h-16 flex items-center justify-center transition-transform duration-200 ${isDragActive ? 'scale-110' : ''}`}>
                <div className="absolute inset-0 border border-forge-blue opacity-20 rotate-45" />
                <div className="absolute inset-3 border border-forge-blue opacity-10 rotate-45" />
                <Upload size={22} className={`transition-colors ${isDragActive ? 'text-forge-blue' : 'text-forge-dim'}`} />
              </div>
              <div>
                <p className="text-forge-text text-xs tracking-[0.2em] mb-2">
                  {isDragActive ? 'RELEASE TO ANALYZE' : 'DROP FILE TO ANALYZE'}
                </p>
                <p className="text-forge-dim text-[10px] tracking-widest">
                  PDF · PNG · JPG · JPEG — MAX 10 MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* — Uploading — */}
        {isUploading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-fade-up">
            <Loader2 size={22} className="text-forge-blue animate-spin" />
            <p className="text-[10px] text-forge-dim tracking-[0.2em]">PROCESSING FILE</p>
            <div className="flex gap-1.5">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {/* — Upload error — */}
        {!isUploading && uploadError && (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-8 animate-fade-up">
            <AlertCircle size={22} className="text-forge-red" />
            <p className="text-forge-red text-[11px] text-center leading-relaxed tracking-wide">{uploadError}</p>
            <button
              onClick={onClear}
              className="text-[10px] text-forge-dim hover:text-forge-text border border-forge-line hover:border-forge-blue px-4 py-2 tracking-widest transition-all mt-1"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* — PDF viewer — */}
        {!isUploading && !uploadError && fileType === 'pdf' && fileUrl && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto forge-scroll flex justify-center p-4">
              <Document
                file={fileUrl}
                onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1) }}
                loading={
                  <div className="flex items-center gap-2 mt-16 text-forge-dim text-[11px] tracking-wider">
                    <Loader2 size={13} className="animate-spin" /> RENDERING PDF
                  </div>
                }
                error={
                  <div className="flex items-center gap-2 mt-16 text-forge-red text-[11px]">
                    <AlertCircle size={13} /> Failed to render PDF
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(window.innerWidth * 0.44, 540)}
                  renderTextLayer
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {numPages > 1 && (
              <div className="shrink-0 flex items-center justify-center gap-4 py-2 border-t border-forge-line">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => p - 1)}
                  className="p-1.5 border border-forge-line hover:border-forge-blue text-forge-dim hover:text-forge-text disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[10px] text-forge-dim tracking-widest">
                  {pageNumber} / {numPages}
                </span>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(p => p + 1)}
                  className="p-1.5 border border-forge-line hover:border-forge-blue text-forge-dim hover:text-forge-text disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* — Image viewer — */}
        {!isUploading && !uploadError && fileType === 'image' && fileUrl && (
          <div className="h-full overflow-auto forge-scroll flex items-center justify-center p-6">
            <img
              src={fileUrl}
              alt={file?.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

      </div>
    </div>
  )
}
