import { cn } from "@/lib/utils";
import { Book, FileText, FolderOpen, Plus, Settings, Users } from "lucide-react";

export function Sidebar() {
    return (
        <div className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col h-screen p-4 text-sm">
            <div className="flex items-center gap-2 mb-8 px-2 font-bold text-lg tracking-wider">
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">A</div>
                ANNIE AI
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wide">Library</h3>
                    <div className="space-y-1">
                        <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-white/5 rounded-md text-gray-300 hover:text-white transition-colors">
                            <FolderOpen size={16} />
                            Recent Projects
                        </button>
                        <button className="flex items-center gap-3 w-full px-2 py-2 bg-white/5 rounded-md text-white font-medium">
                            <FileText size={16} />
                            Project: "Echoes"
                        </button>
                        <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-white/5 rounded-md text-gray-300 hover:text-white transition-colors">
                            <Book size={16} />
                            Story Bible
                        </button>
                        <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-white/5 rounded-md text-gray-300 hover:text-white transition-colors">
                            <Users size={16} />
                            Characters
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wide">Tools</h3>
                    <div className="space-y-1">
                        <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-white/5 rounded-md text-gray-300 hover:text-white transition-colors">
                            <Settings size={16} />
                            Settings
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-auto px-2">
                <button className="w-full bg-white text-black py-2 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> New Project
                </button>
            </div>
        </div>
    );
}
