"use client";

import { useState } from 'react';
import axios from 'axios';
import { Settings, Shield, Server, Database, Save, Power, Eye, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const [config, setConfig] = useState({
        torProxy: true,
        deepAnalysis: false,
        autoSave: true,
        headlessMode: true,
        logLevel: 'INFO'
    });

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [notification, setNotification] = useState({ type: null, message: null });

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: null, message: null }), 5000);
    };

    const handleReset = async () => {
        setResetLoading(true);
        try {
            await axios.delete('http://localhost:8080/api/system/reset-db');
            showNotification('success', "Veritabanı başarıyla sıfırlandı ve temizlendi.");
            setShowResetConfirm(false);
        } catch (error) {
            console.error("Sıfırlama hatası:", error);
            showNotification('error', "İşlem başarısız oldu: " + (error.response?.data?.error || error.message));
        } finally {
            setResetLoading(false);
        }
    };

    const Toggle = ({ label, description, checked, onChange, icon: Icon }) => (
        <div className="flex items-center justify-between p-6 border border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white mb-1 font-mono tracking-wide">{label}</h3>
                    <p className="text-xs text-zinc-500 max-w-[300px] leading-relaxed">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${checked ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-zinc-800 border border-zinc-700'}`}
            >
                <div className={`w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6 bg-emerald-400' : 'translate-x-0 bg-zinc-500'}`} />
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto pt-10 font-mono relative">
            {/* Modal Overlay */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowResetConfirm(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative z-10 w-full max-w-md bg-zinc-900/40 border border-white/10 p-8 rounded-xl shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                                <Database size={32} className="text-red-500" />
                            </div>

                            <h3 className="text-xl font-bold text-white tracking-tight">Emin misiniz?</h3>

                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Bu işlem geri alınamaz. Kaydedilmiş <span className="text-white font-bold">tüm tarama geçmişi, içerikler ve loglar</span> kalıcı olarak silinecektir.
                            </p>

                            <div className="flex gap-3 w-full pt-4">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-bold rounded transition-colors"
                                >
                                    İPTAL ET
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={resetLoading}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {resetLoading ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            SİLİNİYOR...
                                        </>
                                    ) : (
                                        "EVET, SIFIRLA"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Başlık */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <Settings className="text-purple-500" size={28} />
                        SİSTEM YAPILANDIRMASI
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest pl-10">
                        galileoff • YETKİ SEVİYESİ: <span className="text-purple-500">ROOT</span>
                    </p>
                </div>
                <button className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-colors flex items-center gap-2">
                    <Save size={14} />
                    KAYDET
                </button>
            </div>

            {/* Bildirim Alanı */}
            {notification.message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-8 p-4 border backdrop-blur-sm relative overflow-hidden ${notification.type === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/10'
                        : 'border-red-500/20 bg-red-500/10'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {notification.type === 'success' ? <Shield size={20} /> : <Database size={20} />}
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold uppercase mb-1 ${notification.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {notification.type === 'success' ? 'İŞLEM BAŞARILI' : 'SİSTEM HATASI'}
                            </h4>
                            <p className={`text-xs ${notification.type === 'success' ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Ağ Ayarları */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <h2 className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Server size={14} /> AĞ PROTOKOLLERİ
                    </h2>

                    <Toggle
                        label="TOR PROXY TÜNELİ"
                        description="Tüm giden trafiği yerel Tor SOCKS5 proxy üzerinden yönlendir."
                        icon={Shield}
                        checked={config.torProxy}
                        onChange={(v) => setConfig({ ...config, torProxy: v })}
                    />

                    <Toggle
                        label="HEADLESS TARAYICI"
                        description="Tarayıcı arayüzünü gizleyerek performansı artırır."
                        icon={Eye}
                        checked={config.headlessMode}
                        onChange={(v) => setConfig({ ...config, headlessMode: v })}
                    />
                </motion.div>

                {/* Analiz Ayarları */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <h2 className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Database size={14} /> VERİ İŞLEME
                    </h2>

                    <Toggle
                        label="DERİN ANALİZ MODU"
                        description="Alt sayfaları ve dış bağlantıları da tarama kapsamına alır (Daha yavaş)."
                        icon={Power}
                        checked={config.deepAnalysis}
                        onChange={(v) => setConfig({ ...config, deepAnalysis: v })}
                    />

                    <Toggle
                        label="OTOMATİK ARŞİVLEME"
                        description="Bulunan tüm içerikleri anında yerel veritabanına kaydet."
                        icon={Save}
                        checked={config.autoSave}
                        onChange={(v) => setConfig({ ...config, autoSave: v })}
                    />
                </motion.div>
            </div>

            {/* Tehlikeli Bölge */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
                <h2 className="text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Lock size={14} /> KRİTİK İŞLEMLER
                </h2>

                <div className="flex items-center justify-between p-6 border border-red-900/30 bg-red-900/5 hover:bg-red-900/10 transition-colors">
                    <div>
                        <h3 className="text-sm font-bold text-red-500 mb-1">VERİTABANINI SIFIRLA</h3>
                        <p className="text-xs text-red-400/60">Tüm geçmiş tarama kayıtlarını ve indekslenmiş sayfaları kalıcı olarak siler.</p>
                    </div>
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                        SIFIRLA
                    </button>
                </div>
            </div>
        </div>
    );
}
