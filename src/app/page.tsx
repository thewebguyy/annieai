// Architectural Layer: Component / Page
// Dependencies: src/components/layout/Sidebar.tsx, src/components/layout/Muse.tsx, src/components/editor/ScriptEditor.tsx, src/components/ui/ProjectWizard.tsx, src/components/ui/CompliancePanel.tsx, src/stores/projectStore.ts, src/stores/editorStore.ts, src/lib/ui/toast.ts, src/lib/db/supabaseClient.ts, next/navigation

"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Muse } from "@/components/layout/Muse";
import ScriptEditor from "@/components/editor/ScriptEditor";
import { ProjectWizard, type ProjectWizardData } from "@/components/ui/ProjectWizard";
import { CompliancePanel } from "@/components/ui/CompliancePanel";
import { supabase } from "@/lib/db/supabaseClient";
import { useRouter } from "next/navigation";
import { useProjectStore, type Project } from "@/stores/projectStore";
import { useEditorStore } from "@/stores/editorStore";
import { toast } from "@/lib/ui/toast";

export const dynamic = "force-dynamic";

export default function Home() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const router = useRouter();

  // Zustand State Store Selectors
  const { activeProject, lastSavedAt, addProject, setActiveProject } = useProjectStore();
  const { wordCount, sceneCount, isDirty, activeView, setActiveView } = useEditorStore();

  // Client Session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      }
    });
  }, [router]);

  const handleCreateProject = async (data: ProjectWizardData) => {
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          genre: data.genre,
          logline: data.logline,
          characters: data.characters,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to initialize screenplay.");
      }

      const json = await res.json();
      if (json.data) {
        const newProj = json.data as Project;
        addProject(newProj);
        setActiveProject(newProj);
        setActiveView("editor");
        toast.success(`Screenplay "${newProj.title}" successfully initialized!`);
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Initialization failed.");
    }
  };

  const handleExportFountain = async () => {
    if (!activeProject) return;
    try {
      const res = await fetch(`/api/v1/projects/${activeProject.id}/export`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeProject.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "screenplay"}.fountain`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Screenplay exported to Fountain format!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export screenplay.");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-purple-500/30 font-sans">
      {/* Left Sidebar */}
      <Sidebar onNewProject={() => setIsWizardOpen(true)} />

      {/* Center Canvas */}
      <main className="flex-1 flex flex-col h-full relative bg-[#0a0a0a] overflow-hidden">
        {/* Ambient radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.04),transparent)] pointer-events-none" />

        {/* Global Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md z-20 shrink-0 select-none">
          <div className="flex items-center text-sm gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-gray-500 group-hover:text-gray-300 transition-colors">Workspace</span>
              <span className="text-gray-700">/</span>
              <span className="text-white font-bold tracking-tight">
                {activeProject?.title || "Select Screenplay"}
              </span>
            </div>
            
            {/* Realtime stats badge */}
            {activeProject && activeView === "editor" && (
              <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 border-l border-white/10 pl-4 mt-0.5">
                <span>Words: <strong className="text-gray-300">{wordCount}</strong></span>
                <span className="opacity-30">|</span>
                <span>Scenes: <strong className="text-gray-300">{sceneCount}</strong></span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {activeProject && (
              <button
                onClick={handleExportFountain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-700/90 text-white border border-purple-500/20 rounded-lg text-xs font-mono transition-colors shadow-[0_0_12px_rgba(147,51,234,0.1)]"
              >
                Export Fountain
              </button>
            )}

            {/* Interactive Autosave Indicators */}
            {activeProject && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase font-mono">
                  {isDirty ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse" />
                      <span className="text-yellow-500/80">Saving...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      <span className="text-gray-400">Sync Active</span>
                    </>
                  )}
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[10px] font-mono text-gray-500">
                  {isDirty ? "Saving Draft..." : `Draft Saved ${lastSavedAt ? `at ${lastSavedAt}` : ""}`}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Content Area Switch */}
        {activeView === "editor" ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111] py-8">
            {activeProject ? (
              <ScriptEditor key={activeProject.id} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs">
                Select or initialize a screenplay to start writing.
              </div>
            )}
          </div>
        ) : (
          <CompliancePanel />
        )}
      </main>

      {/* Right Sidebar: Muse Chat */}
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
