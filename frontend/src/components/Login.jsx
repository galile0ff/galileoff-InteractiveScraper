"use client";

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, Loader2, Check, X, ShieldCheck, Wifi, Lock, PenTool } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState("AWAITING_CREDENTIALS");

    // Daktilo efekti için yardımcı fonksiyon
    const updateStatus = (msg) => {
        setStatusMessage(""); // Önce temizle
        let i = 0;
        const interval = setInterval(() => {
            setStatusMessage(prev => msg.slice(0, i + 1));
            i++;
            if (i > msg.length) clearInterval(interval);
        }, 30); // Yazma hızı
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setStatus('loading');
        updateStatus("ENCRYPTING_DATA_PACKETS...");

        // Sinematik gecikme
        await new Promise(r => setTimeout(r, 2000));

        try {
            const res = await api.post('/login', { username, password });
            if (res.status === 200) {
                setStatus('success');
                updateStatus("AUTHENTICATION_SUCCESSFUL");
                setTimeout(() => onLoginSuccess(res.data.token), 1500);
            }
        } catch (err) {
            setStatus('error');
            updateStatus("ERROR: ACCESS_DENIED");

            setTimeout(() => {
                setStatus('idle');
                updateStatus("SYSTEM_RESET: READY");
            }, 3000);
        }
    };

    return (
        <div className="login-page-bg">

            {/* --- ATMOSFERİK KATMANLAR --- */}

            {/* Arkaplan Doku */}
            <div className="login-bg-noise"></div>

            {/* Arkaplan Işık Akışı */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1],
                    background: status === 'error'
                        ? 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0) 70%)'
                        : status === 'success'
                            ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)'
                            : 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 70%)'
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none z-0"
            />

            {/* Hareketli Izgara */}
            <div className="login-perspective-grid"></div>


            {/* --- Ana Kutu --- */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="login-card-wrapper"
            >
                {/* Köşe Çizgileri */}
                <div className={`login-corner-border top-0 left-0 border-l-2 border-t-2 ${status === 'error' ? 'error' : ''}`} />
                <div className={`login-corner-border top-0 right-0 border-r-2 border-t-2 ${status === 'error' ? 'error' : ''}`} />
                <div className={`login-corner-border bottom-0 left-0 border-l-2 border-b-2 ${status === 'error' ? 'error' : ''}`} />
                <div className={`login-corner-border bottom-0 right-0 border-r-2 border-b-2 ${status === 'error' ? 'error' : ''}`} />

                {/* İçerik Kutusu */}
                <div className="login-card-body">

                    {/* Scanline Efekti */}
                    <div className="login-scanline"></div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-zinc-500' : status === 'loading' ? 'bg-amber-500 animate-pulse' : status === 'success' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                            <span className="text-[16px] tracking-[0.2em] font-bold text-white">galileoff.</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-bold">
                            <Wifi size={12} />
                            <span>SCRAPER_DASHBOARD</span>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 relative z-10">

                        {/* Durum Mesajı */}
                        <div className="h-8 flex items-center gap-2 text-xs tracking-widest uppercase border-l-2 border-zinc-700 pl-3 text-zinc-400">
                            <span className="text-white font-bold">&gt;</span>
                            {statusMessage}
                            <span className="w-1.5 h-3 bg-zinc-500 animate-pulse inline-block ml-1" />
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Input: username */}
                            <div className="group space-y-2">
                                <label className="text-xs uppercase tracking-widest text-zinc-500 group-focus-within:text-white transition-colors font-bold ml-1">KULLANICI ID</label>
                                <div className="login-input-wrapper">
                                    <div className="login-input-icon-box">
                                        <ShieldCheck size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="login-input"
                                        placeholder="admin"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Input: password */}
                            <div className="group space-y-2">
                                <label className="text-xs uppercase tracking-widest text-zinc-500 group-focus-within:text-white transition-colors font-bold ml-1">GÜVENLİK ANAHTARI</label>
                                <div className="login-input-wrapper">
                                    <div className="login-input-icon-box">
                                        <Lock size={14} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="login-input"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/*buton*/}
                            <div className="pt-2">
                                <motion.button
                                    type="submit"
                                    disabled={status !== 'idle'}
                                    layout
                                    className={`login-submit-btn ${status}`}
                                >
                                    <AnimatePresence mode="wait">
                                        {status === 'idle' && (
                                            <motion.div
                                                key="idle"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-3 z-10"
                                            >
                                                SİSTEME GİR
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </motion.div>
                                        )}

                                        {status === 'loading' && (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-3 z-10"
                                            >
                                                <Loader2 size={16} className="animate-spin" />
                                                İŞLENİYOR
                                                {/* Arka planda dolan bar efekti */}
                                                <motion.div
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 2, ease: "linear" }}
                                                    className="absolute bottom-0 left-0 h-[2px] bg-white opacity-50"
                                                />
                                            </motion.div>
                                        )}

                                        {status === 'success' && (
                                            <motion.div
                                                key="success"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="flex items-center gap-3 z-10"
                                            >
                                                <Check size={18} strokeWidth={3} />
                                                ERİŞİM ONAYLANDI
                                            </motion.div>
                                        )}

                                        {status === 'error' && (
                                            <motion.div
                                                key="error"
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: [0, -10, 10, -10, 10, 0], opacity: 1 }}
                                                transition={{ duration: 0.4 }}
                                                className="flex items-center gap-3 z-10"
                                            >
                                                <X size={18} strokeWidth={3} />
                                                ERİŞİM REDDEDİLDİ
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="flex justify-between items-end border-t border-zinc-800 pt-4 opacity-50 text-xs">
                            <div className="flex flex-col gap-1">
                                <span>kimsenin uykusunun fesleğen koktuğu yok</span>
                                <span>altıkırkbeşte vapur ve sancı geç saatlerde</span>
                            </div>
                            <PenTool size={20} className="text-zinc-400" />
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}