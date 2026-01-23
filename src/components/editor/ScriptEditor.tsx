'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { ScreenplayExtensions } from './extensions';
import { cn } from '@/lib/utils';
import { Bold, Italic, Loader2, Wand2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';

interface ScriptEditorProps {
    initialContent?: string;
    onUpdate?: (content: string) => void;
    isGhostWriting?: boolean;
}

const ScriptEditor = ({ initialContent = '', onUpdate, isGhostWriting = false }: ScriptEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                paragraph: {
                    HTMLAttributes: {
                        class: 'action',
                    }
                },
            }),
            BubbleMenuExtension,
            FloatingMenuExtension,
            ...ScreenplayExtensions,
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-invert focus:outline-none max-w-none min-h-[calc(100vh-200px)] courier-prime',
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate?.(editor.getHTML());
        },
    });

    const exportToPDF = () => {
        if (!editor) return;
        const doc = new jsPDF({
            unit: 'pt',
            format: 'letter',
        });

        const content = editor.getText();
        doc.setFont("courier", "normal");
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 500);
        doc.text(splitText, 50, 50);
        doc.save("script-annie-ai.pdf");
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="relative group w-full max-w-4xl mx-auto my-8">
            {/* Editor Controls */}
            <div className="absolute -top-12 right-0 flex gap-2">
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs text-gray-300 transition-colors"
                >
                    <FileDown size={14} /> Export to PDF
                </button>
            </div>

            {/* Floating Toolbar */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="flex gap-1 p-1 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg text-white shadow-2xl">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={cn("p-2 hover:bg-white/10 rounded transition-colors", editor.isActive('bold') && 'text-purple-400')}
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={cn("p-2 hover:bg-white/10 rounded transition-colors", editor.isActive('italic') && 'text-purple-400')}
                        >
                            <Italic size={16} />
                        </button>
                        <div className="w-px h-4 bg-white/10 self-center mx-1" />
                        <button
                            onClick={() => alert("AI Contextual Revision Launching...")}
                            className="p-2 hover:bg-purple-900/40 rounded text-purple-400 flex items-center gap-2 pr-3"
                        >
                            <Wand2 size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Rewrite</span>
                        </button>
                    </div>
                </BubbleMenu>
            )}

            {/* Main Editor Surface */}
            <div className="bg-white text-black shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[1056px] w-[816px] mx-auto p-[1in] font-courier relative">
                <div className="absolute top-8 right-8 text-xs text-gray-400 opacity-50 font-courier">1.</div>

                {isGhostWriting && (
                    <div className="absolute top-4 left-[1in] flex items-center gap-2 text-purple-600 text-[10px] font-bold tracking-widest uppercase">
                        <Loader2 className="animate-spin" size={12} />
                        <span>Annie is thinking...</span>
                    </div>
                )}

                <EditorContent editor={editor} />
            </div>

            <div className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-[0.2em] opacity-30">
                Standard Screenplay Format • 12pt Courier Prime
            </div>
        </div>
    );
};

export default ScriptEditor;
