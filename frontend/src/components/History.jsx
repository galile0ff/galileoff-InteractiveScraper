"use client";

import { useState, useEffect } from 'react';
import { History, FileText, Calendar, X, MessageSquare, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState(null);
    const [details, setDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/history');
                setHistory(res.data);
            } catch (error) {
                console.error("Geçmiş verileri alınamadı", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const openDetails = async (siteId) => {
        setSelectedSite(siteId);
        setDetailLoading(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/history/${siteId}`);
            setDetails(res.data);
        } catch (error) {
            console.error("Detaylar alınamadı", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetails = () => {
        setSelectedSite(null);
        setDetails(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto pt-10 font-mono relative">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <History className="text-blue-500" size={28} />
                        TARAMA GEÇMİŞİ
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest pl-10">
                        ARŞİV KAYITLARI: <span className="text-white">{history ? history.length : 0}</span>
                    </p>
                </div>
            </div>

            {/* Tablo */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-xl"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-zinc-400 uppercase tracking-wider">
                            <th className="py-4 px-6 font-medium">HEDEF URL</th>
                            <th className="py-4 px-6 font-medium">TARİH</th>
                            <th className="py-4 px-6 font-medium">ETİKET</th>
                            <th className="py-4 px-6 font-medium">VERİ</th>
                            <th className="py-4 px-6 font-medium text-right">DURUM</th>
                            <th className="py-4 px-6 font-medium text-right">İŞLEM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-zinc-400">Yükleniyor...</td></tr>
                        ) : history && history.length > 0 ? (
                            history.map((item) => (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6 text-xs text-zinc-300 font-mono group-hover:text-white transition-colors max-w-[200px] sm:max-w-[300px]">
                                        <div className="flex items-center gap-2 w-full">
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.is_forum ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            <span className="truncate block" title={item.url}>
                                                {item.url}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-xs text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} />
                                            {new Date(item.last_scan).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {item.source === 'watchlist' && (
                                                <span className="text-[10px] px-2 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 uppercase tracking-wide font-bold flex items-center gap-1">
                                                    <Clock size={10} /> WATCHLIST
                                                </span>
                                            )}
                                            {item.category ? (
                                                <span className="text-[10px] px-2 py-1 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 uppercase tracking-wide font-bold">
                                                    [{item.category}]
                                                </span>
                                            ) : (
                                                <span className={`text-[11px] px-2 py-1 border ${item.is_forum ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                                                    'border-blue-500/20 text-blue-500 bg-blue-500/5'
                                                    }`}>
                                                    {item.is_forum ? 'FORUM' : 'WEB'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-xs text-zinc-400">
                                        <div className="flex gap-3">
                                            <span className="flex items-center gap-1"><span className="text-white font-bold">{item.total_threads}</span> Thread</span>
                                            <span className="flex items-center gap-1"><span className="text-white font-bold">{item.total_posts}</span> Post</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className="text-xs font-bold text-emerald-500">
                                            TAMAMLANDI
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDetails(item.id);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20 scale-100 active:scale-95">
                                            <FileText size={16} />
                                            İNCELE
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="p-12 text-center text-zinc-400 text-sm">Kayıt bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </motion.div>

            {/* Detay Modalı */}
            <AnimatePresence>
                {selectedSite && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDetails}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel w-full max-w-4xl max-h-[85vh] overflow-hidden relative z-10 rounded-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText size={18} className="text-blue-500" />
                                        İçerik Detayları
                                    </h2>
                                    {details && <p className="text-xs text-zinc-400 font-mono mt-1">{details.url}</p>}
                                </div>
                                <button onClick={closeDetails} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} className="text-zinc-400" />
                                </button>
                            </div>

                            {/* Modal İçerik */}
                            <div className="flex-1 overflow-y-auto p-0">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : details && details.threads ? (
                                    <div className="divide-y divide-zinc-800">
                                        {details.threads.map((thread) => (
                                            <div key={thread.id} className="p-6 hover:bg-zinc-900/50 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-md font-bold text-emerald-400 mb-1 flex items-center gap-2">
                                                        {thread.title}
                                                        {thread.category && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 uppercase tracking-wide">
                                                                {thread.category}
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <span className="text-xs text-zinc-400 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
                                                        {thread.date}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4 font-mono">
                                                    <User size={12} /> <span className="text-zinc-300">{thread.author || "Bilinmiyor"}</span>
                                                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                    <a href={thread.link} target="_blank" rel="noreferrer" className="hover:text-blue-400 hover:underline transition-colors truncate max-w-[300px]">
                                                        {thread.link}
                                                    </a>
                                                </div>

                                                <div className="bg-zinc-950/80 border border-zinc-800/50 p-4 rounded text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-4 font-sans shadow-inner">
                                                    {thread.content || <span className="text-zinc-600 italic">İçerik önizlemesi yok.</span>}
                                                </div>

                                                {/* İletiler */}
                                                {thread.posts && thread.posts.length > 0 && (
                                                    <div className="ml-4 pl-4 border-l-2 border-zinc-800 space-y-4 mt-4">
                                                        <h4 className="text-xs uppercase font-bold text-zinc-400 flex items-center gap-2 mb-2">
                                                            <MessageSquare size={12} /> Yanıtlar ({thread.posts.length})
                                                        </h4>
                                                        {thread.posts.map((post) => (
                                                            <div key={post.id} className="bg-zinc-900/40 p-3 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800/30">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                                                                            {post.author ? post.author.substring(0, 2).toUpperCase() : "??"}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-blue-300">{post.author || "Anonim"}</span>
                                                                    </div>
                                                                    <span className="text-xs text-zinc-600 font-mono">{post.date}</span>
                                                                </div>
                                                                <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-zinc-400">
                                        Bu taramada kaydedilmiş içerik bulunamadı.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
