'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Muse } from "@/components/layout/Muse";
import ScriptEditor from "@/components/editor/ScriptEditor";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Sidebar: Library & Navigation */}
      <Sidebar />

      {/* Center Canvas: Script Editor */}
      <main className="flex-1 flex flex-col h-full relative bg-[#151515]">
        {/* Minimal Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/50 backdrop-blur z-10 shrink-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="hover:text-white cursor-pointer transition-colors">Library</span>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Project: Echoes</span>
            <span className="ml-4 text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">Draft 1.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Saved
            </div>
            <button className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition-colors">Export</button>
          </div>
        </header>

        {/* Editor Scroll Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ScriptEditor
            initialContent={`
                    <h3 class="scene-heading">INT. NEURAL LINK - DAY</h3>
                    <p class="action">The digital void hums with potential. A cursor blinks in the darkness, waiting for a command.</p>
                    <p class="character">SYSTEM (V.O.)</p>
                    <p class="dialogue">Welcome to Annie. I am ready to begin.</p>
                    <p class="action">The cursor pulses, a heartbeat in the code.</p>
                `}
          />
          <div className="h-32"></div> {/* Bottom padding */}
        </div>
      </main>

      {/* Right Sidebar: Muse AI */}
      <Muse />
    </div>
  );
}
