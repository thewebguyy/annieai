// Architectural Layer: Component
// Dependencies: @tiptap/react, StarterKit, ScreenplayExtensions, src/stores/projectStore.ts, src/stores/editorStore.ts, src/lib/ui/toast.ts, src/components/editor/EditorSerializer.ts, src/components/ui/VersionHistoryDrawer.tsx

"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ScreenplayExtensions } from "./extensions";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Bold, Italic, Loader2, Wand2, History } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useEditorStore, type ScreenplayNodeType } from "@/stores/editorStore";
import { EditorSerializer } from "./EditorSerializer";
import { toast } from "@/lib/ui/toast";
import { VersionHistoryDrawer, type SceneVersion } from "../ui/VersionHistoryDrawer";

interface ScriptEditorProps {
  isGhostWriting?: boolean;
}

export default function ScriptEditor({ isGhostWriting = false }: ScriptEditorProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { setLastSavedAt } = useProjectStore();
  const { isDirty, setStats, setActiveNodeType, setIsDirty } = useEditorStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
      }),
      ...ScreenplayExtensions,
    ],
    editorProps: {
      attributes: {
        class: "prose prose-invert focus:outline-none max-w-none min-h-[calc(100vh-200px)] font-mono",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      // Calculate derived statistics
      const json = activeEditor.getJSON();
      let wordCount = 0;
      let sceneCount = 0;

      if (json.content) {
        json.content.forEach((node) => {
          if (node.type === "sceneHeading") {
            sceneCount++;
          }
          if (node.content) {
            node.content.forEach((inlineNode) => {
              if (inlineNode.text) {
                const words = inlineNode.text.trim().split(/\s+/).filter(Boolean);
                wordCount += words.length;
              }
            });
          }
        });
      }

      setStats(wordCount, sceneCount);
      setIsDirty(true);

      // Track active block type at cursor selection
      const { selection } = activeEditor.state;
      const { $from } = selection;
      const parentNode = $from.node($from.depth);
      let activeNodeType: ScreenplayNodeType | null = null;

      if (parentNode.type.name === "sceneHeading") activeNodeType = "scene_heading";
      else if (parentNode.type.name === "action") activeNodeType = "action";
      else if (parentNode.type.name === "character") activeNodeType = "character";
      else if (parentNode.type.name === "dialogue") activeNodeType = "dialogue";
      else if (parentNode.type.name === "parenthetical") activeNodeType = "parenthetical";

      setActiveNodeType(activeNodeType);
    },
  });

  // Load project scenes
  useEffect(() => {
    if (!activeProject || !editor) return;

    let active = true;

    async function loadScenes() {
      try {
        const res = await fetch(`/api/v1/projects/${activeProject!.id}/scenes`);
        if (!res.ok) throw new Error("Failed to load script scenes.");

        const json = await res.json();
        if (active) {
          if (json.data && json.data.length > 0) {
            const tiptapJson = EditorSerializer.deserialize(json.data);
            editor!.commands.setContent(tiptapJson);
          } else {
            // Setup base screenplay scaffolding
            editor!.commands.setContent({
              type: "doc",
              content: [
                {
                  type: "sceneHeading",
                  content: [{ type: "text", text: "INT. SCREENPLAY CANVAS - DAY" }],
                },
                {
                  type: "action",
                  content: [{ type: "text", text: "FADE IN: A writer sits in front of a keyboard." }],
                },
              ],
            });
          }
          setIsDirty(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load project script.");
      }
    }

    loadScenes();

    return () => {
      active = false;
    };
  }, [activeProject, editor, setIsDirty]);

  // Debounced Autosave (2 seconds)
  useEffect(() => {
    if (!isDirty || !activeProject || !editor) return;

    const timer = setTimeout(async () => {
      try {
        const json = editor.getJSON();
        const serialized = EditorSerializer.serialize(json, activeProject.id);

        const res = await fetch(`/api/v1/projects/${activeProject.id}/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenes: serialized }),
        });

        if (res.ok) {
          setIsDirty(false);
          setLastSavedAt(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Autosave failed:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDirty, activeProject, editor, setLastSavedAt, setIsDirty]);

  // Handle restoring a scene version history element
  const handleRestoreVersion = (version: SceneVersion) => {
    if (!editor || !activeProject) return;
    
    try {
      // Restore content block
      // To keep it simple and clean, we replace the whole text or modify the selected block
      // The PRD says: "capture the scene ID, the content before the AI edit, and the model"
      // We can insert/replace the editor block using editor commands.
      // Let's set the full editor content or replace the matching scene ID node.
      // Since a scene version represents a single scene block's historic content,
      // let's insert it at selection or replace the whole content if needed.
      // Let's replace the whole document for simplicity or append it:
      // Let's prompt user and set the node content directly:
      editor.commands.insertContent(version.content);
      toast.success(`Restored draft edited by ${version.model || "AI"}`);
      setIsDirty(true);
    } catch {
      toast.error("Failed to restore scene draft.");
    }
  };

  if (!editor || !activeProject) {
    return null;
  }

  return (
    <div className="relative group w-full max-w-4xl mx-auto px-4 my-8">
      {/* Floating Toolbar */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="flex gap-1 p-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg text-white shadow-xl"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-2 hover:bg-white/10 rounded", editor.isActive("bold") && "text-purple-400")}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-2 hover:bg-white/10 rounded", editor.isActive("italic") && "text-purple-400")}
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => toast.info("Orchestrator menu triggered (Feature coming in V2).")}
          className="p-2 hover:bg-white/10 rounded text-purple-400"
        >
          <Wand2 size={16} />
        </button>
      </BubbleMenu>

      {/* Editor Frame Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
          Screenplay Canvas (Courier Prime)
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs transition-colors"
        >
          <History size={12} />
          Revision History
        </button>
      </div>

      {/* Main Editor Surface */}
      <div className="bg-[#1a1a1a] border border-white/5 shadow-2xl min-h-[750px] p-8 md:p-16 rounded-sm relative overflow-hidden">
        {isGhostWriting && (
          <div className="absolute top-4 right-4 flex items-center gap-2 text-purple-400 text-xs animate-pulse">
            <Loader2 className="animate-spin" size={12} />
            <span>AI Ghost Writer Active...</span>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      {/* Drawer */}
      <VersionHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        projectId={activeProject.id}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}