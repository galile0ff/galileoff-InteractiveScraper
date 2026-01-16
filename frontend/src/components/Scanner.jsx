"use client";

import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertTriangle, Terminal, ChevronRight } from 'lucide-react';

export default function Scanner({ onScanComplete }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('http://localhost:8080/api/scan', { url });

            if (res.data.saved) {
                onScanComplete(res.data.data);
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
        <div className="w-full max-w-4xl mx-auto pt-12">
            <div className="border border-zinc-800 bg-black min-h-[400px] flex flex-col font-mono shadow-2xl">
                {/* Terminal Başlığı */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">root@galileoff:~# scraper_engine</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    </div>
                </div>

                {/* İçerik */}
                <div className="p-8 flex-1 flex flex-col justify-center">

                    <div className="mb-8">
                        <h1 className="text-2xl text-white font-bold mb-2 tracking-tight">galileoff. TOR SCRAPER</h1>
                        <p className="text-zinc-500 text-sm">Tarama başlatmak için .onion adresini girin.</p>
                    </div>

                    <form onSubmit={handleScan} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-zinc-700 pb-2 focus-within:border-white transition-colors">
                            <ChevronRight size={18} className="text-zinc-500" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-zinc-700"
                                placeholder="http://galileoff.onion"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} />
                                        İŞLENİYOR
                                    </>
                                ) : (
                                    <>
                                        <Search size={14} />
                                        ÇALIŞTIR
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 p-3 border-l-2 border-red-600 bg-red-950/20 text-red-500 text-xs font-mono">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle size={14} />
                                <span className="font-bold">HATA</span>
                            </div>
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="mt-8 text-xs font-mono text-zinc-500 space-y-1">
                            <p>&gt; Tor soketi başlatılıyor...</p>
                            <p>&gt; Sunucu çözümleniyor...</p>
                            <p className="animate-pulse">&gt; İşaretleme yapısı analiz ediliyor...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
