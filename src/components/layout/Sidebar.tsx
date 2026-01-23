import { cn } from "@/lib/utils";
import { Book, FileText, FolderOpen, Plus, Settings, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";

interface SidebarProps {
    onNewProject?: () => void;
}

export function Sidebar({ onNewProject }: SidebarProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-screen p-6 text-sm z-30">
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                    <span className="text-white font-black text-xl tracking-tighter italic">A</span>
                </div>
                <div>
                    <div className="font-black text-white leading-none tracking-tight">ANNIE AI</div>
                    <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase mt-0.5 opacity-70">NEURAL CORE</div>
                </div>
            </div>

            <div className="space-y-8 flex-1">
                <div>
                    <h3 className="text-[10px] font-black text-gray-600 mb-4 px-2 uppercase tracking-[0.2em]">Project Hub</h3>
                    <div className="space-y-1">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.03] rounded-xl text-gray-400 hover:text-white transition-all group">
                            <FolderOpen size={16} className="group-hover:text-purple-400 transition-colors" />
                            Archives
                        </button>
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 bg-white/[0.05] border border-white/5 rounded-xl text-white font-medium shadow-inner">
                            <FileText size={16} className="text-purple-400" />
                            Active Link
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-black text-gray-600 mb-4 px-2 uppercase tracking-[0.2em]">Story Intel</h3>
                    <div className="space-y-1">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.03] rounded-xl text-gray-400 hover:text-white transition-all group">
                            <Book size={16} className="group-hover:text-purple-400 transition-colors" />
                            Story Bible
                        </button>
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.03] rounded-xl text-gray-400 hover:text-white transition-all group">
                            <Users size={16} className="group-hover:text-purple-400 transition-colors" />
                            Personas
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                <button
                    onClick={onNewProject}
                    className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                    <Plus size={18} /> New Creation
                </button>
                <button
                    onClick={handleSignOut}
                    className="w-full text-gray-500 hover:text-red-400 text-xs py-2 flex items-center justify-center gap-2 transition-colors"
                >
                    <LogOut size={14} /> Termination Session
                </button>
            </div>
        </div>
    );
}
