'use client';

import { useState } from 'react';
import { supabase } from '@/lib/db/supabaseClient';
import { toast } from '@/lib/ui/toast';
import { Command, Github, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success('Check your email for the magic link!');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="bg-[#0a0a0a] relative hidden lg:flex flex-col justify-between p-12 border-r border-white/10">
                <div className="z-10">
                    <div className="flex items-center gap-2 font-bold text-xl mb-4">
                        <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">A</div>
                        ANNIE AI
                    </div>
                    <h1 className="text-4xl font-light text-white leading-tight">
                        One Workspace.<br />
                        <span className="text-purple-400 font-medium">Multiple Minds.</span>
                    </h1>
                </div>

                <div className="z-10 space-y-8">
                    <div className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-xl max-w-md">
                        <p className="italic text-gray-300 mb-4">&ldquo;The task-based routing is a game changer. Claude handles my dialogue, GPT checks my plot holes. It&apos;s like a writers&apos; room in my pocket.&rdquo;</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-500"></div>
                            <div>
                                <div className="text-sm font-bold text-white">Sarah Jenkins</div>
                                <div className="text-xs text-gray-400">Showrunner, HBO</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ambient background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900 rounded-full blur-[128px]"></div>
                </div>
            </div>

            {/* Right: Auth Form */}
            <div className="bg-black flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                        <p className="text-sm text-gray-400 mt-2">Enter your email to sign in to your workspace.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-300 uppercase">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                placeholder="writer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Command className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            {loading ? 'Sending Magic Link...' : 'Sign In with Email'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <button disabled className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                        <Github size={16} /> Google (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}
