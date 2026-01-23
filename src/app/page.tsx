'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Muse } from "@/components/layout/Muse";
import ScriptEditor from "@/components/editor/ScriptEditor";
import { ProjectWizard } from "@/components/ui/ProjectWizard";
import { supabase } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";
import { ingestStoryBible } from "@/lib/ai/rag";

export default function Home() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [project, setProject] = useState({
    id: 'default',
    title: 'Echoes',
    content: `
        <h3 class="scene-heading">INT. NEURAL LINK - DAY</h3>
        <p class="action">The digital void hums with potential. A cursor blinks in the darkness, waiting for a command.</p>
        <p class="character">SYSTEM (V.O.)</p>
        <p class="dialogue">Welcome back, Writer. Our consciousness is synced.</p>
    `,
  });

  const router = useRouter();

  // Basic check for session on client
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Redundancy for middleware
        router.push('/login');
      }
    });
  }, [router]);

  const handleCreateProject = async (data: any) => {
    // 1. Update local state
    const newId = Math.random().toString(36).substring(7);
    setProject({
      id: newId,
      title: data.title,
      content: `<h3 class="scene-heading">FADE IN:</h3><h3 class="scene-heading">INT. ${data.title.toUpperCase()} - DAY</h3>`,
    });

    // 2. Ingest to RAG (Story Bible)
    try {
      await ingestStoryBible(newId, `Title: ${data.title}\nGenre: ${data.genre}\nLogline: ${data.logline}\nCharacters: ${data.characters}`);
      console.log("RAG Ingestion Successful");
    } catch (e) {
      console.error("RAG Ingestion Failed (Check API Keys):", e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-purple-500/30">
      {/* Left Sidebar */}
      <Sidebar onNewProject={() => setIsWizardOpen(true)} />

      {/* Center Canvas */}
      <main className="flex-1 flex flex-col h-full relative bg-[#0a0a0a] overflow-hidden">
        {/* Subtle ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.05),transparent)] pointer-events-none" />

        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center text-sm">
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-gray-500 group-hover:text-gray-300 transition-colors">Workspace</span>
              <span className="text-gray-700">/</span>
              <span className="text-white font-bold tracking-tight">{project.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
              <span className="text-gray-400">Sync Active</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <button className="text-xs text-gray-400 hover:text-white transition-colors capitalize">
              Draft 1.0 (Auto-Save)
            </button>
          </div>
        </header>

        {/* Editor Scroll Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111] py-12">
          <ScriptEditor
            key={project.id}
            initialContent={project.content}
            onUpdate={(html) => setProject({ ...project, content: html })}
          />
        </div>
      </main>

      {/* Right Sidebar: Muse */}
      <Muse />

      {/* Wizard Modal */}
      <ProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleCreateProject}
      />
    </div>
  );
}
