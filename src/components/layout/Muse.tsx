'use client';

import { useChat } from 'ai/react';
import { cn } from "@/lib/utils";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { useState } from 'react';

export function Muse() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
    });

    const [activeModel, setActiveModel] = useState<'Auto' | 'Claude' | 'GPT' | 'Grok' | 'Gemini'>('Auto');

    return (
        <div className="w-[350px] border-l border-white/10 bg-[#0a0a0a] flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 backdrop-blur">
                <div className="flex items-center gap-2 font-medium">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 font-bold">MUSE AI</span>
                </div>

                <select
                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value as any)}
                >
                    <option value="Auto">Auto (Orchestrator)</option>
                    <option value="Claude">Claude (Dialogue)</option>
                    <option value="GPT">GPT (Logic)</option>
                    <option value="Gemini">Gemini (Lore)</option>
                    <option value="Grok">Grok (Wit)</option>
                </select>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-20 text-sm">
                        <p>Hello, Writer.</p>
                        <p className="mt-2 text-xs opacity-50">I am connected to Claude, GPT-5, Grok, and Gemini.</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={cn("flex flex-col gap-1 max-w-[90%]", m.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            m.role === 'user'
                                ? "bg-purple-600 text-white rounded-br-none"
                                : "bg-white/10 text-gray-200 rounded-bl-none border border-white/5"
                        )}>
                            {m.content}
                        </div>
                        {m.role === 'assistant' && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Bot size={10} /> {activeModel === 'Auto' ? 'Orchestrator' : activeModel}
                            </span>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 items-center text-xs text-muted-foreground p-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75" />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150" />
                        Thinking...
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ask Muse..."
                        value={input}
                        onChange={handleInputChange}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input}
                        className="absolute right-2 top-2 p-1.5 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                    >
                        <Send size={14} />
                    </button>
                </form>
                <div className="flex justify-between items-center mt-2 px-1">
                    <button className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1">
                        <Mic size={10} /> Voice Input
                    </button>
                    <div className="text-[10px] text-gray-600">
                        124 Credits Remaining
                    </div>
                </div>
            </div>
        </div>
    );
}
