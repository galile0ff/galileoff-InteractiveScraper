"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertTriangle, Terminal, Shield, Database, ArrowRight, ScanEye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Scanner({ onScanComplete, onChangeTab }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [torStatus, setTorStatus] = useState('KONTROL EDİLİYOR...');

    useEffect(() => {
        const checkTor = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/stats/general');
                if (res.data.system_status && res.data.system_status.tor_status) {
                    setTorStatus(res.data.system_status.tor_status);
                } else {
                    setTorStatus('BİLİNMİYOR');
                }
            } catch (err) {
                console.error("Tor status check failed", err);
                setTorStatus('BAĞLANTI YOK');
            }
        };
        checkTor();
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const randomUA = localStorage.getItem('settings_randomUA') === 'true';
            const res = await axios.post('http://localhost:8080/api/scan', { url, random_ua: randomUA });

            if (res.data.saved) {
                const category = res.data.data.threads && res.data.data.threads.length > 0 ? res.data.data.threads[0].category : 'Belirsiz';
                let successMsg = `Hedef başarıyla analiz edildi [${category}] ve veritabanına işlendi.`;
                if (randomUA && res.data.data.user_agent) {
                    successMsg += ` (UA: ${res.data.data.user_agent})`;
                }
                setSuccess(successMsg);
                onScanComplete(res.data.data);
                setUrl(''); // Inputu temizle
            } else {
                setError(res.data.message || "İlgili veri bulunamadı.");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Bağlantı reddedildi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto pt-10 font-mono">
            {/* Başlık ve Durum */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <Terminal className="text-emerald-500" size={28} />
                        HEDEF ANALİZ TERMİNALİ
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest pl-10">
                        TOR AĞI BAĞLANTISI: <span className={torStatus === 'AKTİF' ? "text-emerald-500" : "text-red-500 animate-pulse"}>{torStatus}</span>
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel relative overflow-hidden"
            >
                {/* Dekoratif Çizgiler */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-zinc-900" />

                {/* Terminal Başlığı */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                        <span className="text-[14px] text-zinc-400 ml-2">root@galileoff:~# scraper_engine --target</span>
                    </div>
                </div>

                <div className="p-8 md:p-12">Tor Scraper
                    <form onSubmit={handleScan} className="flex flex-col gap-8 relative z-10">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-emerald-500 font-bold mr-2">➜</span>
                                <span className="text-zinc-400">~</span>
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white font-mono py-4 pl-16 pr-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all placeholder-zinc-700 rounded-sm"
                                placeholder="http://galileoff.onion"
                                autoFocus
                            />
                            {/* Input Glow Efekti */}
                            <div className="absolute inset-0 -z-10 bg-emerald-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative overflow-hidden group px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            .onion ÇÖZÜMLENİYOR...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight size={14} />
                                            ÇALIŞTIR
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Başarı Mesajı */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 p-4 border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3"
                        >
                            <ScanEye className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="text-emerald-500 text-sm font-bold uppercase mb-1">Tarama Başarılı</h4>
                                <p className="text-emerald-400/80 text-sm mb-3">{success}</p>
                                <button
                                    onClick={() => onChangeTab('history')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold border border-emerald-500/30 rounded transition-colors"
                                >
                                    <Database size={12} />
                                    DETAYLARI İNCELE
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Hata Mesajı */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 p-4 border border-red-500/20 bg-red-500/5 flex items-start gap-3"
                        >
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h4 className="text-red-500 text-xs font-bold uppercase mb-1">Bağlantı Hatası</h4>
                                <p className="text-red-400/80 text-xs">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Yükleme Animasyonu */}
                    {loading && (
                        <div className="mt-8 space-y-2">
                            <div className="h-0.5 w-full bg-zinc-900 overflow-hidden">
                                <div className="h-full bg-emerald-500/50 w-1/3 animate-[shimmer_2s_infinite]" />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-400 uppercase">
                                <span>Proxy Tüneli: <span className="text-emerald-500">AÇIK</span></span>
                                <span className="animate-pulse">Veri Paketleri Bekleniyor...</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Alt Bilgi */}
            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="glass-card p-4 flex flex-col items-center text-center gap-2">
                    <Shield size={20} className="text-zinc-100" />
                    <span className="text-xs text-zinc-100 uppercase">Güvenli Tarama</span>
                </div>

                <div className="glass-card p-4 flex flex-col items-center text-center gap-2">
                    <Database size={20} className="text-zinc-100" />
                    <span className="text-xs text-zinc-100 uppercase">Otomatik Arşiv</span>
                </div>

                <div className="glass-card p-4 flex flex-col items-center text-center gap-2">
                    <Terminal size={20} className="text-zinc-100" />
                    <span className="text-[10px] text-zinc-100 uppercase">Derin Analiz</span>
                </div>
            </div>
        </div>
    );
}
