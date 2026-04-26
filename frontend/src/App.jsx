import { useState, useCallback } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'
import FilePanel from './components/FilePanel'
import ChatPanel from './components/ChatPanel'

const API = 'http://localhost:8000'

export default function App() {
  // File state
  const [file, setFile]               = useState(null)
  const [fileUrl, setFileUrl]         = useState(null)
  const [fileType, setFileType]       = useState(null)   // 'pdf' | 'image'
  const [fileContext, setFileContext] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Chat state
  const [messages, setMessages]   = useState([])
  const [isQuerying, setIsQuerying] = useState(false)

  const handleFileDrop = useCallback(async (acceptedFiles) => {
    const dropped = acceptedFiles[0]
    if (!dropped) return

    // Revoke previous object URL to avoid memory leaks
    if (fileUrl) URL.revokeObjectURL(fileUrl)

    setFile(dropped)
    setFileUrl(URL.createObjectURL(dropped))
    setFileContext('')
    setUploadError(null)
    setIsUploading(true)

    const form = new FormData()
    form.append('file', dropped)

    try {
      const { data } = await axios.post(`${API}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFileType(data.file_type)
      setFileContext(data.content)
    } catch (err) {
      setUploadError(
        err.response?.data?.detail ?? 'Upload failed — is the backend running on port 8000?'
      )
    } finally {
      setIsUploading(false)
    }
  }, [fileUrl])

  const handleClearFile = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    setFile(null)
    setFileUrl(null)
    setFileType(null)
    setFileContext('')
    setUploadError(null)
  }, [fileUrl])

  const handleQuery = useCallback(async (query) => {
    if (!query.trim() || isQuerying) return

    setMessages(prev => [...prev, { role: 'user', content: query, id: Date.now() }])
    setIsQuerying(true)

    try {
      const { data } = await axios.post(`${API}/query`, {
        query,
        file_context: fileContext,
      })
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: data.response, id: Date.now() + 1 },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'error',
          content: err.response?.data?.detail ?? 'Query failed — is the backend running on port 8000?',
          id: Date.now() + 1,
        },
      ])
    } finally {
      setIsQuerying(false)
    }
  }, [fileContext, isQuerying])

  return (
    <div className="flex flex-col h-screen bg-forge-bg font-mono overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <FilePanel
          file={file}
          fileUrl={fileUrl}
          fileType={fileType}
          isUploading={isUploading}
          uploadError={uploadError}
          onFileDrop={handleFileDrop}
          onClear={handleClearFile}
        />
        {/* Divider */}
        <div className="w-px bg-forge-line shrink-0" />
        <ChatPanel
          messages={messages}
          isQuerying={isQuerying}
          hasFile={!!file && !isUploading && !uploadError}
          onQuery={handleQuery}
        />
      </div>
    </div>
  )
}
