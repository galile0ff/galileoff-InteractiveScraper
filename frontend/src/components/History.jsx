"use client";

import { useState } from 'react';
import { History, Search, FileText, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
    // Mock Data (Gerçek backend verisi buraya gelecek)
    const [history, setHistory] = useState([
        { id: '1', url: 'http://examplev3onion.onion', date: '2023-10-25 14:30', status: 'COMPLETED', type: 'FORUM', threads: 124, posts: 4500 },
        { id: '2', url: 'http://darkmarket.onion', date: '2023-10-24 09:15', status: 'FAILED', type: 'MARKET', threads: 0, posts: 0 },
        { id: '3', url: 'http://hackersplace.onion', date: '2023-10-23 21:00', status: 'COMPLETED', type: 'FORUM', threads: 56, posts: 120 },
    ]);

    return (
        <div className="w-full max-w-5xl mx-auto pt-10 font-mono">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <History className="text-blue-500" size={28} />
                        TARAMA GEÇMİŞİ
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest pl-10">
                        ARŞİV KAYITLARI: <span className="text-white">{history.length}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                        <Filter size={16} />
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Kayıtlarda ara..."
                            className="bg-zinc-900/30 border border-zinc-800 text-white text-xs py-2 pl-8 pr-4 w-[200px] focus:outline-none focus:border-blue-500/50"
                        />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-600" />
                    </div>
                </div>
            </div>

            {/* Tablo */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-zinc-800 bg-zinc-900/20 overflow-hidden"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                            <th className="py-4 px-6 font-medium">HEDEF URL</th>
                            <th className="py-4 px-6 font-medium">TARİH</th>
                            <th className="py-4 px-6 font-medium">TÜR</th>
                            <th className="py-4 px-6 font-medium">VERİ</th>
                            <th className="py-4 px-6 font-medium text-right">DURUM</th>
                            <th className="py-4 px-6 font-medium text-right">İŞLEM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => (
                            <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                                <td className="py-4 px-6 text-xs text-zinc-300 font-mono group-hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {item.url}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-[11px] text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        {item.date}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`text-[9px] px-2 py-1 border ${item.type === 'FORUM' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                                            'border-zinc-700 text-zinc-400 bg-zinc-800/50'
                                        }`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-[11px] text-zinc-400">
                                    {item.status === 'COMPLETED' ? (
                                        <div className="flex gap-3">
                                            <span className="flex items-center gap-1"><span className="text-white font-bold">{item.threads}</span> Thread</span>
                                            <span className="flex items-center gap-1"><span className="text-white font-bold">{item.posts}</span> Post</span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600">-</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <span className={`text-[10px] font-bold ${item.status === 'COMPLETED' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all">
                                        <ArrowUpRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {history.length === 0 && (
                    <div className="p-12 text-center text-zinc-500 text-sm">
                        Kayıt bulunamadı.
                    </div>
                )}
            </motion.div>
        </div>
    );
}
