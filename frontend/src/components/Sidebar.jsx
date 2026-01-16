"use client";

import { Search, History, Settings, LogOut, EyeOff } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'scanner', label: 'Tarayıcı', icon: Search },
        { id: 'history', label: 'Geçmiş', icon: History },
        { id: 'settings', label: 'Ayarlar', icon: Settings },
    ];

    return (
        <div className="w-64 bg-black border-r border-zinc-900 flex flex-col h-screen fixed left-0 top-0 z-50 font-mono">
            {/* Üst Bilgi */}
            <div className="p-6 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                    <EyeOff size={20} className="text-white" strokeWidth={2} />
                    <span className="text-sm font-bold text-white tracking-widest">galileoff.</span>
                </div>
            </div>

            {/* Navigasyon */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-l-2 ${activeTab === item.id
                            ? 'bg-zinc-900 text-white border-white'
                            : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950'
                            }`}
                    >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Alt Bilgi */}
            <div className="p-4 border-t border-zinc-900">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors text-xs font-medium uppercase tracking-wider"
                >
                    <LogOut size={16} />
                    <span>ÇIKIŞ</span>
                </button>
            </div>
        </div>
    );
}
