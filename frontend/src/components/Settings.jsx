"use client";

import { useState } from 'react';
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
        <div className="w-full max-w-5xl mx-auto pt-10 font-mono">
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

                <div className="flex items-center justify-between p-6 border border-red-900/30 bg-red-900/5">
                    <div>
                        <h3 className="text-sm font-bold text-red-500 mb-1">VERİTABANINI SIFIRLA</h3>
                        <p className="text-xs text-red-400/60">Tüm geçmiş tarama kayıtlarını ve indekslenmiş sayfaları kalıcı olarak siler.</p>
                    </div>
                    <button className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
                        SIFIRLA
                    </button>
                </div>
            </div>
        </div>
    );
}
