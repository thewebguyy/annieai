'use client';

import { useChat } from 'ai/react';
import { cn } from "@/lib/utils";
import { Bot, Mic, Send, Sparkles, BrainCircuit, History } from "lucide-react";
import { useState } from 'react';

export function Muse() {
    const [currentModel, setCurrentModel] = useState<string>('Auto');
    const [lastReasoning, setLastReasoning] = useState<string>('');

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        onResponse: (response: Response) => {
            const model = response.headers.get('x-annie-model');
            const reasoning = response.headers.get('x-annie-reasoning');
            if (model) setCurrentModel(model.toUpperCase());
            if (reasoning) setLastReasoning(decodeURIComponent(reasoning));
        }
    } as any) as any;

    const [selectedModel, setSelectedModel] = useState<'Auto' | 'Claude' | 'GPT' | 'Grok' | 'Gemini'>('Auto');

    return (
        <div className="w-[350px] border-l border-white/10 bg-[#0a0a0a] flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 backdrop-blur">
                <div className="flex items-center gap-2 font-medium">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 font-bold tracking-tight">MUSE AI</span>
                </div>

                <select
                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                >
                    <option value="Auto">Auto-Route</option>
                    <option value="Claude">Claude</option>
                    <option value="GPT">GPT-5</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Grok">Grok</option>
                </select>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-20 text-sm space-y-4">
                        <BrainCircuit className="mx-auto text-purple-500 opacity-50" size={32} />
                        <div>
                            <p className="font-medium text-white">Neural Hub Active</p>
                            <p className="text-xs opacity-50 mt-1">Cross-model intelligence ready for script analysis.</p>
                        </div>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={cn("flex flex-col gap-1 max-w-[90%]", m.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            m.role === 'user'
                                ? "bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20"
                                : "bg-white/5 text-gray-200 rounded-bl-none border border-white/5"
                        )}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 items-center text-[10px] text-purple-400 font-medium p-2 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                        ORCHESTRATING {selectedModel === 'Auto' ? 'BEST MODEL' : selectedModel.toUpperCase()}...
                    </div>
                )}
            </div>

            {/* Footer / Attribution */}
            {(currentModel !== 'Auto' || lastReasoning) && !isLoading && (
                <div className="px-4 py-2 bg-white/5 border-t border-white/5 text-[10px]">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Bot size={10} className="text-purple-400" />
                        <span className="text-gray-300 font-bold">{currentModel}</span>
                        <span className="opacity-50">|</span>
                        <span className="truncate italic">"{lastReasoning}"</span>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600 shadow-inner"
                        placeholder="Ask Muse for scene revisions..."
                        value={input}
                        onChange={handleInputChange}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input}
                        className="absolute right-2 top-2 p-1.5 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors disabled:opacity-30 shadow-lg shadow-purple-900/40"
                    >
                        <Send size={14} />
                    </button>
                </form>
                <div className="flex justify-between items-center mt-3 px-1">
                    <div className="flex gap-3">
                        <button className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-1">
                            <History size={10} /> History
                        </button>
                        <button className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-1">
                            <Mic size={10} /> Voice
                        </button>
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium tracking-tighter">
                        CREDITS: 124 <span className="opacity-30">/ 500</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
