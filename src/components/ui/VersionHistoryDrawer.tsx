// Architectural Layer: Component
// Dependencies: lucide-react, framer-motion, date-fns, src/lib/ui/toast.ts

"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { motion } from "framer-motion";
import { X, History, RotateCcw, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/lib/ui/toast";

export interface SceneVersion {
  id: string;
  scene_id: string;
  content: string;
  saved_at: string;
  author: "human" | "ai";
  model: string | null;
  scenes: {
    project_id: string;
    type: string;
    order_index: number;
  };
}

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onRestore: (version: SceneVersion) => void;
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  projectId,
  onRestore,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/versions`);
      if (!res.ok) {
        throw new Error("Failed to load history list.");
      }
      const json = await res.json();
      if (json.data) {
        setVersions(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load scene versions.");
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      startTransition(() => {
        fetchHistory();
      });
    }
  }, [isOpen, projectId, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-[#0c0c0c] border-l border-white/10 h-full relative z-10 flex flex-col p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-2 font-medium">
            <History size={16} className="text-purple-400" />
            <span className="text-sm font-bold text-white tracking-tight">AI Version History</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 bg-black/10 rounded">
          {isPending ? (
            <div className="h-[200px] flex items-center justify-center text-xs font-mono text-purple-400 animate-pulse">
              LOADING REVISION LOGS...
            </div>
          ) : versions.length > 0 ? (
            versions.map((ver) => (
              <div
                key={ver.id}
                className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3 hover:border-white/10 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-tight">
                      {ver.model || "AI Model"}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-1 font-mono">
                      Scene Block #{ver.scenes.order_index + 1} ({ver.scenes.type.replace("_", " ")})
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {formatDistanceToNow(new Date(ver.saved_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="bg-black/50 border border-white/5 p-2 rounded text-[11px] font-mono text-gray-400 max-h-24 overflow-hidden truncate leading-relaxed">
                  {ver.content || "Empty scene snippet"}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      onRestore(ver);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-200 text-black text-[10px] font-bold rounded-lg transition-all"
                  >
                    <RotateCcw size={10} />
                    Restore Node
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-xs font-mono text-gray-500">
              <AlertTriangle size={24} className="mb-2 opacity-35" />
              No scene versions logged. AI generated content will automatically save here.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
