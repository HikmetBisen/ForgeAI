import { Cpu } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="shrink-0 flex items-center justify-between px-5 py-3 bg-forge-surface border-b border-forge-line relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {/* Icon mark — rotated square with CPU inside */}
        <div className="relative w-7 h-7 flex items-center justify-center">
          <div className="absolute inset-0 border border-forge-blue rotate-45 opacity-50" />
          <Cpu size={13} className="text-forge-blue relative z-10" />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-forge-text font-semibold tracking-[0.25em] text-sm">FORGE</span>
          <span className="text-forge-blue font-semibold tracking-[0.25em] text-sm">AI</span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-forge-line mx-1" />
        <span className="hidden sm:block text-forge-dim text-[10px] tracking-[0.2em]">
          ENGINEERING INTELLIGENCE PLATFORM
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-[10px] text-forge-dim tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" />
        SYSTEM ONLINE
      </div>
    </nav>
  )
}
