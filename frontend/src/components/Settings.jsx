"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Shield, Server, Database, Save, Power, Eye, Lock, Edit2, Trash2, Plus, X, Check, Tag, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

function KeywordManager() {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState({ word: '', category: '', color: '#3b82f6' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ word: '', category: '', color: '' });

    // Verileri Çek
    useEffect(() => {
        fetchKeywords();
    }, []);

    const fetchKeywords = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/settings/keywords');
            setKeywords(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Keywords yüklenemedi", error);
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newKeyword.word || !newKeyword.category) return;
        try {
            await axios.post('http://localhost:8080/api/settings/keywords', newKeyword);
            setNewKeyword({ word: '', category: '', color: '#3b82f6' });
            fetchKeywords();
        } catch (error) {
            console.error("Ekleme hatası", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8080/api/settings/keywords/${id}`);
            fetchKeywords();
        } catch (error) {
            console.error("Silme hatası", error);
        }
    };

    const startEdit = (k) => {
        setEditingId(k.id);
        setEditForm({ word: k.word, category: k.category, color: k.color });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ word: '', category: '', color: '' });
    };

    const saveEdit = async () => {
        try {
            await axios.put(`http://localhost:8080/api/settings/keywords/${editingId}`, editForm);
            setEditingId(null);
            fetchKeywords();
        } catch (error) {
            console.error("Güncelleme hatası", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-zinc-800 bg-zinc-900/30 rounded-xl overflow-hidden"
        >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={16} /> KATEGORİ & KEYWORD YÖNETİMİ
                </h2>
                <button onClick={fetchKeywords} className="text-zinc-500 hover:text-white transition-colors">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="p-6">
                {/* Listeleme */}
                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-zinc-500 text-xs">Yükleniyor...</div>
                    ) : keywords.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic">Henüz tanımlı anahtar kelime yok.</div>
                    ) : (
                        keywords.map((k) => (
                            <div key={k.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-all">
                                {editingId === k.id ? (
                                    // Düzenleme Modu
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            value={editForm.word}
                                            onChange={e => setEditForm({ ...editForm, word: e.target.value })}
                                            className="bg-black/80 border border-zinc-600 rounded px-2 py-1 text-xs text-white w-32 font-bold"
                                            placeholder="Kelime"
                                        />
                                        <input
                                            value={editForm.category}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                            className="bg-black/80 border border-zinc-600 rounded px-2 py-1 text-xs text-white w-24 font-bold"
                                            placeholder="Kategori"
                                        />
                                        <input
                                            type="color"
                                            value={editForm.color}
                                            onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                            className="bg-transparent w-6 h-6 border-none cursor-pointer"
                                        />
                                        <button onClick={saveEdit} className="p-1 hover:text-emerald-500 text-zinc-400"><Check size={14} /></button>
                                        <button onClick={cancelEdit} className="p-1 hover:text-red-500 text-zinc-400"><X size={14} /></button>
                                    </div>
                                ) : (
                                    // Görüntüleme Modu
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.color }} />
                                            <div>
                                                <div className="text-sm font-bold text-white tracking-wide">{k.word}</div>
                                                <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium">{k.category}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(k)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(k.id)} className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Ekleme Formu */}
                <div className="pt-4 border-t border-zinc-800/50 flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Aranacak Kelime</label>
                        <input
                            type="text"
                            value={newKeyword.word}
                            onChange={(e) => setNewKeyword({ ...newKeyword, word: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600"
                            placeholder="Örn: hack, spoof, apt..."
                        />
                    </div>
                    <div className="w-32 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Kategori Adı</label>
                        <input
                            type="text"
                            value={newKeyword.category}
                            onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600"
                            placeholder="Örn: Hacking"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold block tracking-wider">Renk</label>
                        <input
                            type="color"
                            value={newKeyword.color}
                            onChange={(e) => setNewKeyword({ ...newKeyword, color: e.target.value })}
                            className="h-[34px] w-12 bg-zinc-900 border border-zinc-800 rounded px-1 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!newKeyword.word || !newKeyword.category}
                        className="h-[34px] px-4 bg-white text-black text-xs font-bold rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={14} /> EKLE
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function UserAgentManager() {
    const [userAgents, setUserAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUA, setNewUA] = useState('');

    useEffect(() => {
        fetchUserAgents();
    }, []);

    const fetchUserAgents = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/settings/user-agents');
            setUserAgents(res.data);
            setLoading(false);
        } catch (error) {
            console.error("User Agents yüklenemedi", error);
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newUA) return;
        try {
            await axios.post('http://localhost:8080/api/settings/user-agents', { user_agent: newUA });
            setNewUA('');
            fetchUserAgents();
        } catch (error) {
            console.error("Ekleme hatası", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8080/api/settings/user-agents/${id}`);
            fetchUserAgents();
        } catch (error) {
            console.error("Silme hatası", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-zinc-800 bg-zinc-900/30 rounded-xl overflow-hidden"
        >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={16} /> USER AGENT YÖNETİMİ
                </h2>
                <button onClick={fetchUserAgents} className="text-zinc-500 hover:text-white transition-colors">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="p-6">
                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-zinc-500 text-xs">Yükleniyor...</div>
                    ) : userAgents.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic">Henüz tanımlı User Agent yok.</div>
                    ) : (
                        userAgents.map((ua) => (
                            <div key={ua.ID} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-all">
                                <span className="text-xs text-zinc-300 font-mono break-all">{ua.user_agent}</span>
                                <button onClick={() => handleDelete(ua.ID)} className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Yeni User Agent</label>
                        <input
                            type="text"
                            value={newUA}
                            onChange={(e) => setNewUA(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600 font-mono"
                            placeholder="Mozilla/5.0..."
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!newUA}
                        className="h-[34px] px-4 bg-white text-black text-xs font-bold rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={14} /> EKLE
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function SettingsPage() {
    const [config, setConfig] = useState({
        torProxy: true,
        deepAnalysis: false,
        autoSave: true,
        headlessMode: true,
        randomUA: false,
        logLevel: 'INFO'
    });

    useEffect(() => {
        const savedRandomUA = localStorage.getItem('settings_randomUA') === 'true';
        setConfig(prev => ({ ...prev, randomUA: savedRandomUA }));
    }, []);

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

            {/* Kategori ve Keyword Yönetimi */}
            <KeywordManager />

            {/* User Agent Yönetimi */}
            <UserAgentManager />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">

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
                        label="RANDOM USER AGENT"
                        description="Her istekte rastgele bir User Agent (Tarayıcı Kimliği) kullanarak takibi zorlaştır."
                        icon={Eye}
                        checked={config.randomUA}
                        onChange={(v) => {
                            setConfig({ ...config, randomUA: v });
                            localStorage.setItem('settings_randomUA', v);
                        }}
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
