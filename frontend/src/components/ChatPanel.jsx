import { useState, useRef, useEffect } from 'react'
import { Send, Cpu, AlertCircle } from 'lucide-react'

const GUIDED = [
  'What is the primary load this structure handles?',
  'What material is being used?',
  'What is the required safety factor?',
]

// Engineering corner marks
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

function UserMessage({ content }) {
  return (
    <div className="flex flex-col items-end gap-1 animate-fade-up">
      <span className="text-[9px] text-forge-dim tracking-[0.2em] mr-1">ENGINEER</span>
      <div className="max-w-[88%] bg-forge-usr-bg border border-[#253545] px-4 py-2.5 text-forge-text text-[11px] leading-relaxed">
        <span className="text-forge-blue select-none mr-2">&gt;</span>{content}
      </div>
    </div>
  )
}

function AiMessage({ content }) {
  return (
    <div className="flex flex-col gap-1 animate-fade-up">
      <div className="flex items-center gap-1.5">
        <Cpu size={10} className="text-forge-blue" />
        <span className="text-[9px] text-forge-blue tracking-[0.2em]">FORGE AI</span>
      </div>
      <div className="max-w-[92%] bg-forge-ai-bg border border-[#1a3347] px-4 py-3 text-forge-text text-[11px] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}

function ErrorMessage({ content }) {
  return (
    <div className="flex flex-col gap-1 animate-fade-up">
      <div className="flex items-center gap-1.5">
        <AlertCircle size={10} className="text-forge-red" />
        <span className="text-[9px] text-forge-red tracking-[0.2em]">ERROR</span>
      </div>
      <div className="max-w-[92%] bg-[#1f0f0f] border border-[#3d1515] px-4 py-3 text-forge-red text-[11px] leading-relaxed">
        {content}
      </div>
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex flex-col gap-1 animate-fade-up">
      <div className="flex items-center gap-1.5">
        <Cpu size={10} className="text-forge-blue animate-pulse" />
        <span className="text-[9px] text-forge-blue tracking-[0.2em]">FORGE AI</span>
      </div>
      <div className="bg-forge-ai-bg border border-[#1a3347] px-4 py-3 inline-flex items-center gap-2.5">
        <span className="text-[10px] text-forge-dim tracking-widest">analyzing</span>
        <div className="flex gap-1">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  )
}

export default function ChatPanel({ messages, isQuerying, hasFile, onQuery }) {
  const [input, setInput]   = useState('')
  const bottomRef           = useRef(null)
  const textareaRef         = useRef(null)
  const userCount           = messages.filter(m => m.role === 'user').length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isQuerying])

  const send = () => {
    const q = input.trim()
    if (!q || isQuerying) return
    onQuery(q)
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const handleChip = (q) => {
    setInput(q)
    textareaRef.current?.focus()
  }

  return (
    <div className="relative flex flex-col w-1/2 bg-forge-surface overflow-hidden">
      <Corners />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-forge-line z-10">
        <span className="text-[10px] text-forge-dim tracking-[0.2em]">ANALYSIS INTERFACE</span>
        <span className="text-[10px] text-forge-dim tracking-widest">
          {userCount > 0 ? `${userCount} QUER${userCount === 1 ? 'Y' : 'IES'}` : 'AWAITING INPUT'}
        </span>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto forge-scroll px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
            <div className="relative w-12 h-12 flex items-center justify-center opacity-20">
              <div className="absolute inset-0 border border-forge-blue rotate-45" />
              <Cpu size={18} className="text-forge-blue" />
            </div>
            <div className="text-center opacity-30">
              <p className="text-forge-dim text-[10px] tracking-[0.2em] mb-1">SYSTEM READY</p>
              <p className="text-forge-dim text-[9px] tracking-wider">Upload a file or ask a question to begin</p>
            </div>
          </div>
        )}

        {messages.map(msg =>
          msg.role === 'user'  ? <UserMessage  key={msg.id} content={msg.content} /> :
          msg.role === 'ai'    ? <AiMessage    key={msg.id} content={msg.content} /> :
                                 <ErrorMessage key={msg.id} content={msg.content} />
        )}

        {isQuerying && <LoadingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Guided question chips */}
      {hasFile && (
        <div className="shrink-0 px-4 pt-3 pb-2 border-t border-forge-line flex flex-wrap gap-2 animate-slide-up">
          {GUIDED.map((q, i) => (
            <button
              key={i}
              onClick={() => handleChip(q)}
              disabled={isQuerying}
              className="text-[10px] text-forge-dim border border-forge-line px-3 py-1.5 tracking-wide text-left
                         hover:border-forge-blue hover:text-forge-blue-lt hover:bg-[rgba(46,117,182,0.08)]
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <span className="text-forge-blue mr-1.5 font-semibold">[{String(i + 1).padStart(2, '0')}]</span>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="shrink-0 px-4 py-3 border-t border-forge-line">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1 border border-forge-line focus-within:border-forge-blue bg-[#0c1520] transition-colors duration-150">
            <span className="absolute left-3 top-[11px] text-forge-blue text-[11px] select-none pointer-events-none">&gt;</span>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter engineering query..."
              disabled={isQuerying}
              rows={2}
              style={{ maxHeight: '110px' }}
              className="w-full bg-transparent text-forge-text text-[11px] pl-7 pr-3 py-2.5 resize-none outline-none
                         placeholder-forge-dim tracking-wide leading-relaxed forge-scroll"
            />
          </div>

          <button
            onClick={send}
            disabled={!input.trim() || isQuerying}
            className="shrink-0 w-[38px] h-[38px] flex items-center justify-center border border-forge-line
                       hover:border-forge-blue hover:bg-[rgba(46,117,182,0.12)]
                       disabled:opacity-25 disabled:cursor-not-allowed transition-all group"
          >
            <Send size={13} className="text-forge-dim group-hover:text-forge-blue transition-colors" />
          </button>
        </div>

        <p className="text-[9px] text-forge-dim mt-1.5 tracking-wider select-none">
          ENTER to send · SHIFT+ENTER for new line
        </p>
      </div>
    </div>
  )
}
