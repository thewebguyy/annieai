'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, BookOpen, UserCircle, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectWizardData {
  title: string;
  genre: string;
  logline: string;
  characters: string;
}

interface ProjectWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (projectData: ProjectWizardData) => void;
}

export function ProjectWizard({ isOpen, onClose, onComplete }: ProjectWizardProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        title: '',
        genre: '',
        logline: '',
        characters: '',
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = () => {
        onComplete(data);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-900/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold leading-none">New Creative Link</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Project Initialization Utility</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-8 min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-purple-400 mb-6">
                                    <Terminal size={14} />
                                    <span className="text-xs font-mono uppercase">Identity Data</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Project Title</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Untitled Masterpiece..."
                                        value={data.title}
                                        onChange={e => setData({ ...data, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Genre Spectrum</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                        value={data.genre}
                                        onChange={e => setData({ ...data, genre: e.target.value })}
                                    >
                                        <option value="">Select Genre...</option>
                                        <option value="sci-fi">Sci-Fi (Neon Noir)</option>
                                        <option value="thriller">Psychological Thriller</option>
                                        <option value="drama">Contemporary Drama</option>
                                        <option value="comedy">Dark Comedy</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-purple-400 mb-6">
                                    <BookOpen size={14} />
                                    <span className="text-xs font-mono uppercase">Narrative Core</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">The Logline (The Hook)</label>
                                    <textarea
                                        autoFocus
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition-colors h-32 resize-none"
                                        placeholder="In a world where..."
                                        value={data.logline}
                                        onChange={e => setData({ ...data, logline: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-purple-400 mb-6">
                                    <UserCircle size={14} />
                                    <span className="text-xs font-mono uppercase">Dramatis Personae</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Main Characters (Brief Bios)</label>
                                    <textarea
                                        autoFocus
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition-colors h-32 resize-none"
                                        placeholder="Protagonist: Elara, 32. A data thief with a conscience..."
                                        value={data.characters}
                                        onChange={e => setData({ ...data, characters: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-between gap-4 bg-black/40">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("w-8 h-1 rounded-full transition-all", step === i ? "bg-purple-500" : "bg-white/10")} />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Previous
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                className="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-500 transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                                <Wand2 size={14} /> Initialize Project
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

