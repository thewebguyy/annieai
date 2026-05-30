// Architectural Layer: Component
// Dependencies: lucide-react, src/stores/projectStore.ts, src/stores/editorStore.ts, src/lib/db/supabaseClient.ts, next/navigation

"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Book, FileText, Plus, Users, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/db/supabaseClient";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/projectStore";
import { useEditorStore } from "@/stores/editorStore";

interface SidebarProps {
  onNewProject?: () => void;
}

export function Sidebar({ onNewProject }: SidebarProps) {
  const router = useRouter();
  const { projects, activeProject, setProjects, setActiveProject } = useProjectStore();
  const { activeView, setActiveView } = useEditorStore();

  // Load projects from database on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/v1/projects");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setProjects(json.data);
            // Default to first project if none active
            if (json.data.length > 0 && !activeProject) {
              setActiveProject(json.data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user projects:", err);
      }
    }
    loadProjects();
  }, [setProjects, setActiveProject, activeProject]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-screen p-6 text-sm z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
          <span className="text-white font-black text-xl tracking-tighter italic">A</span>
        </div>
        <div>
          <div className="font-black text-white leading-none tracking-tight">ANNIE AI</div>
          <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase mt-0.5 opacity-70">
            NEURAL CORE
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        {/* Projects List */}
        <div>
          <h3 className="text-[10px] font-black text-gray-600 mb-4 px-2 uppercase tracking-[0.2em]">
            Active Screenplays
          </h3>
          <div className="space-y-1">
            {projects.map((proj) => {
              const isActive = activeProject?.id === proj.id && activeView === "editor";
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setActiveView("editor");
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left text-xs",
                    isActive
                      ? "bg-white/[0.05] border border-white/5 text-white font-medium shadow-inner"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <FileText
                    size={14}
                    className={cn(isActive ? "text-purple-400" : "text-gray-500")}
                  />
                  <span className="truncate">{proj.title}</span>
                </button>
              );
            })}
            {projects.length === 0 && (
              <p className="text-[11px] text-gray-600 italic px-3 py-2">No screenplays loaded</p>
            )}
          </div>
        </div>

        {/* WGA Compliance Dashboard */}
        <div>
          <h3 className="text-[10px] font-black text-gray-600 mb-4 px-2 uppercase tracking-[0.2em]">
            WGA Guardrails
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setActiveView("compliance")}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left text-xs",
                activeView === "compliance"
                  ? "bg-white/[0.05] border border-white/5 text-white font-medium shadow-inner"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              <ShieldCheck
                size={14}
                className={cn(activeView === "compliance" ? "text-purple-400" : "text-gray-500")}
              />
              <span>Guild Compliance</span>
            </button>
          </div>
        </div>

        {/* Legacy / Story Bible Info */}
        <div>
          <h3 className="text-[10px] font-black text-gray-600 mb-4 px-2 uppercase tracking-[0.2em]">
            Story Intel
          </h3>
          <div className="space-y-1">
            <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.03] rounded-xl text-gray-400 hover:text-white transition-all group text-xs text-left">
              <Book size={14} className="group-hover:text-purple-400 transition-colors" />
              <span>Story Bible</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.03] rounded-xl text-gray-400 hover:text-white transition-all group text-xs text-left">
              <Users size={14} className="group-hover:text-purple-400 transition-colors" />
              <span>Personas (Coming)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
        <button
          onClick={onNewProject}
          className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl text-xs"
        >
          <Plus size={16} /> New Creation
        </button>
        <button
          onClick={handleSignOut}
          className="w-full text-gray-500 hover:text-red-400 text-xs py-2 flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={12} /> Termination Session
        </button>
      </div>
    </div>
  );
}
