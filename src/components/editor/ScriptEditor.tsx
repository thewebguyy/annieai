'use client';

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ScreenplayExtensions } from './extensions';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Bold, Italic, Loader2, Wand2 } from 'lucide-react';

interface ScriptEditorProps {
    initialContent?: string;
    onUpdate?: (content: string) => void;
    isGhostWriting?: boolean;
}

const ScriptEditor = ({ initialContent = '', onUpdate, isGhostWriting = false }: ScriptEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // We use custom sceneHeading
                paragraph: false, // We use action as default block? Or keep paragraph but styled? 
                // Actually, Tiptap needs a default block. Let's use StarterKit and just prepend ours.
            }),
            ...ScreenplayExtensions
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-invert focus:outline-none max-w-none min-h-[calc(100vh-200px)]',
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate?.(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="relative group w-full max-w-4xl mx-auto my-8">
            {/* Floating Toolbar for fast access */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex gap-1 p-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg text-white shadow-xl">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn("p-2 hover:bg-white/10 rounded", editor.isActive('bold') && 'text-purple-400')}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn("p-2 hover:bg-white/10 rounded", editor.isActive('italic') && 'text-purple-400')}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        onClick={() => {
                            // Stub for AI rewrite
                            alert("Trigger AI Rewrite (Context Menu)");
                        }}
                        className="p-2 hover:bg-white/10 rounded text-purple-400"
                    >
                        <Wand2 size={16} />
                    </button>
                </BubbleMenu>
            )}

            {/* Main Editor Surface */}
            <div className="bg-[#1a1a1a] border border-white/5 shadow-2xl min-h-[800px] p-8 md:p-16 rounded-sm relative overflow-hidden">
                {/* Paper texture overlay could go here */}

                {isGhostWriting && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-purple-400 text-sm animate-pulse">
                        <Loader2 className="animate-spin" size={14} />
                        <span>AI Ghost Writer Active...</span>
                    </div>
                )}

                <EditorContent editor={editor} />
            </div>

            <div className="text-center text-xs text-muted-foreground mt-4">
                Screenplay Format Standard (Courier Prime 12pt)
            </div>
        </div>
    );
};

export default ScriptEditor;
