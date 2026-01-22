"use client";

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Settings, Server, Database, Eye, Lock, Edit2, Trash2, Plus, X, Check, Tag, RefreshCw, Layers, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function KeywordManager({ refreshTrigger }) {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState({ word: '', category: '', color: '#3b82f6' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ word: '', category: '', color: '' });

    // Verileri Çek
    useEffect(() => {
        fetchKeywords();
    }, [refreshTrigger]);

    const fetchKeywords = async () => {
        try {
            const res = await api.get('/settings/keywords');
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
            await api.post('/settings/keywords', newKeyword);
            setNewKeyword({ word: '', category: '', color: '#3b82f6' });
            fetchKeywords();
        } catch (error) {
            console.error("Ekleme hatası", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/settings/keywords/${id}`);
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
            await api.put(`/settings/keywords/${editingId}`, editForm);
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
            className="mb-8 glass-panel overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={16} /> KATEGORİ & KEYWORD YÖNETİMİ
                </h2>
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
                            <div key={k.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/20 transition-all hover:bg-white/10">
                                {editingId === k.id ? (
                                    // Düzenleme Modu
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            value={editForm.word}
                                            onChange={e => setEditForm({ ...editForm, word: e.target.value })}
                                            className="bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white w-32 font-bold"
                                            placeholder="Kelime"
                                        />
                                        <input
                                            value={editForm.category}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                            className="bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white w-24 font-bold"
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
                <div className="pt-4 border-t border-white/5 flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Aranacak Kelime</label>
                        <input
                            type="text"
                            value={newKeyword.word}
                            onChange={(e) => setNewKeyword({ ...newKeyword, word: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600"
                            placeholder="Örn: hack, spoof, apt..."
                        />
                    </div>
                    <div className="w-32 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Kategori Adı</label>
                        <input
                            type="text"
                            value={newKeyword.category}
                            onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600"
                            placeholder="Örn: Hacking"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold block tracking-wider">Renk</label>
                        <input
                            type="color"
                            value={newKeyword.color}
                            onChange={(e) => setNewKeyword({ ...newKeyword, color: e.target.value })}
                            className="h-[34px] w-12 bg-white/5 border border-white/10 rounded px-1 cursor-pointer"
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

function UserAgentManager({ refreshTrigger }) {
    const [userAgents, setUserAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUA, setNewUA] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState('');

    useEffect(() => {
        fetchUserAgents();
    }, [refreshTrigger]);

    const fetchUserAgents = async () => {
        try {
            const res = await api.get('/settings/user-agents');
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
            await api.post('/settings/user-agents', { user_agent: newUA });
            setNewUA('');
            fetchUserAgents();
        } catch (error) {
            console.error("Ekleme hatası", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/settings/user-agents/${id}`);
            fetchUserAgents();
        } catch (error) {
            console.error("Silme hatası", error);
        }
    };

    const startEdit = (ua) => {
        setEditingId(ua.ID);
        setEditForm(ua.user_agent);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm('');
    };

    const saveEdit = async () => {
        try {
            await api.put(`/settings/user-agents/${editingId}`, { user_agent: editForm });
            setEditingId(null);
            fetchUserAgents();
        } catch (error) {
            console.error("Güncelleme hatası", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={16} /> USER AGENT YÖNETİMİ
                </h2>
            </div>

            <div className="p-6">
                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-zinc-500 text-xs">Yükleniyor...</div>
                    ) : userAgents.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic">Henüz tanımlı User Agent yok.</div>
                    ) : (
                        userAgents.map((ua) => (
                            <div key={ua.ID} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/20 transition-all hover:bg-white/10">
                                {editingId === ua.ID ? (
                                    // Düzenleme Modu
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            value={editForm}
                                            onChange={e => setEditForm(e.target.value)}
                                            className="flex-1 bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white font-mono"
                                            placeholder="Mozilla/5.0..."
                                        />
                                        <button onClick={saveEdit} className="p-1 hover:text-emerald-500 text-zinc-400"><Check size={14} /></button>
                                        <button onClick={cancelEdit} className="p-1 hover:text-red-500 text-zinc-400"><X size={14} /></button>
                                    </div>
                                ) : (
                                    // Görüntüleme Modu
                                    <>
                                        <span className="text-xs text-zinc-300 font-mono break-all">{ua.user_agent}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(ua)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(ua.ID)} className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Yeni User Agent</label>
                        <input
                            type="text"
                            value={newUA}
                            onChange={(e) => setNewUA(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-medium placeholder-zinc-600 font-mono"
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

function WatchlistManager({ refreshTrigger }) {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWatch, setNewWatch] = useState({ url: '', interval: '60', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ url: '', interval: '', description: '' });

    useEffect(() => {
        fetchWatchlist();
    }, [refreshTrigger]);

    const fetchWatchlist = async () => {
        try {
            const res = await api.get('/settings/watchlist');
            setWatchlist(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Watchlist yüklenemedi", error);
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newWatch.url || !newWatch.interval) return;
        try {
            await api.post('/settings/watchlist', {
                url: newWatch.url,
                interval_minutes: parseInt(newWatch.interval),
                description: newWatch.description
            });
            setNewWatch({ url: '', interval: '60', description: '' });
            fetchWatchlist();
        } catch (error) {
            console.error("Ekleme hatası", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/settings/watchlist/${id}`);
            fetchWatchlist();
        } catch (error) {
            console.error("Silme hatası", error);
        }
    };

    const startEdit = (w) => {
        setEditingId(w.id);
        setEditForm({ url: w.url, interval: w.interval_minutes.toString(), description: w.description || '' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ url: '', interval: '', description: '' });
    };

    const saveEdit = async () => {
        try {
            await api.put(`/settings/watchlist/${editingId}`, {
                url: editForm.url,
                interval_minutes: parseInt(editForm.interval),
                description: editForm.description
            });
            setEditingId(null);
            fetchWatchlist();
        } catch (error) {
            console.error("Güncelleme hatası", error);
        }
    };

    const formatInterval = (minutes) => {
        if (minutes < 60) return `${minutes} dakika`;
        if (minutes === 60) return '1 saat';
        if (minutes < 1440) return `${Math.floor(minutes / 60)} saat`;
        return `${Math.floor(minutes / 1440)} gün`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={16} /> WATCHLIST YÖNETİMİ
                </h2>
            </div>

            <div className="p-6">
                {/* Listeleme */}
                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-zinc-500 text-xs">Yükleniyor...</div>
                    ) : watchlist.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic">Henüz watchlist'e eklenmiş site yok.</div>
                    ) : (
                        watchlist.map((w) => (
                            <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/20 transition-all hover:bg-white/10">
                                {editingId === w.id ? (
                                    // Düzenleme Modu
                                    <div className="flex-1 flex gap-2 items-center flex-wrap">
                                        <input
                                            value={editForm.url}
                                            onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                            className="bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white flex-1 min-w-[200px] font-mono"
                                            placeholder="galileoff.onion"
                                        />
                                        <input
                                            type="number"
                                            value={editForm.interval}
                                            onChange={e => setEditForm({ ...editForm, interval: e.target.value })}
                                            className="bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white w-20 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="60"
                                            min="1"
                                        />
                                        <input
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            className="bg-white/5 border border-zinc-600 rounded px-2 py-1 text-xs text-white flex-1 min-w-[150px]"
                                            placeholder="Açıklama (opsiyonel)"
                                        />
                                        <button onClick={saveEdit} className="p-1 hover:text-emerald-500 text-zinc-400"><Check size={14} /></button>
                                        <button onClick={cancelEdit} className="p-1 hover:text-red-500 text-zinc-400"><X size={14} /></button>
                                    </div>
                                ) : (
                                    // Görüntüleme Modu
                                    <>
                                        <div className="flex-1">
                                            <div className="text-sm font-mono text-white tracking-wide break-all">{w.url}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="text-[11px] text-emerald-400 uppercase tracking-widest font-medium flex items-center gap-1">
                                                    <Clock size={10} /> {formatInterval(w.interval_minutes)}
                                                </div>
                                                {w.description && (
                                                    <div className="text-[11px] text-zinc-500 italic">{w.description}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(w)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(w.id)} className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-500 transition-colors">
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
                <div className="pt-4 border-t border-white/5 flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[250px] space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Site URL</label>
                        <input
                            type="url"
                            value={newWatch.url}
                            onChange={(e) => setNewWatch({ ...newWatch, url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono placeholder-zinc-600"
                            placeholder="galileoff.onion"
                        />
                    </div>
                    <div className="w-28 space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Süre (dk)</label>
                        <input
                            type="number"
                            value={newWatch.interval}
                            onChange={(e) => setNewWatch({ ...newWatch, interval: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-bold placeholder-zinc-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="60"
                            min="1"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px] space-y-1">
                        <label className="text-[11px] text-zinc-300 uppercase font-bold tracking-wider">Açıklama (Opsiyonel)</label>
                        <input
                            type="text"
                            value={newWatch.description}
                            onChange={(e) => setNewWatch({ ...newWatch, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600"
                            placeholder="Örn: APT Grup Forumu"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!newWatch.url || !newWatch.interval}
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
        watchlistEnabled: false,
        autoSave: true,
        headlessMode: true,
        randomUA: false,
        logLevel: 'INFO'
    });

    useEffect(() => {
        const savedRandomUA = localStorage.getItem('settings_randomUA') === 'true';
        const savedWatchlistEnabled = localStorage.getItem('settings_watchlistEnabled') === 'true';
        setConfig(prev => ({ ...prev, randomUA: savedRandomUA, watchlistEnabled: savedWatchlistEnabled }));
    }, []);

    const [modalState, setModalState] = useState({
        isOpen: false,
        step: 'CONFIRM', // 'CONFIRM', 'LOADING', 'SUCCESS', 'ERROR'
        message: null
    });

    const [resetOptions, setResetOptions] = useState({
        history: false,
        logs: false,
        settings: false
    });

    const openResetModal = () => {
        setModalState({ isOpen: true, step: 'CONFIRM', message: null });
        setResetOptions({ history: false, logs: false, settings: false });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, step: 'CONFIRM', message: null });
    };

    const handleReset = async () => {
        setModalState(prev => ({ ...prev, step: 'LOADING' }));
        try {
            await api.post('/system/reset-db', resetOptions);
            setModalState({ isOpen: true, step: 'SUCCESS', message: "Seçilen veriler başarıyla temizlendi." });
            // Seçenekleri sıfırla
            setResetOptions({ history: false, logs: false, settings: false });
        } catch (error) {
            console.error("Sıfırlama hatası:", error);
            const errMsg = error.response?.data?.error || error.message;
            setModalState({ isOpen: true, step: 'ERROR', message: "İşlem başarısız oldu: " + errMsg });
        }
    };

    const Toggle = ({ label, description, checked, onChange, icon: Icon }) => (
        <div className="flex items-center justify-between p-6 glass-card shadow-lg">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 border border-white/5 text-zinc-400 rounded-lg">
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

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="w-full max-w-5xl mx-auto pt-10 font-mono relative">
            {/* Unified Glass Modal */}
            <AnimatePresence>
                {modalState.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={modalState.step === 'LOADING' ? null : closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        />

                        {/* Modal Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-lg bg-black/80 border border-white/10 p-1 rounded-3xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                            <div className="bg-black/20 p-8 rounded-[20px] relative z-10">
                                {/* CONFIRM STEP */}
                                {modalState.step === 'CONFIRM' && (
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-900/20 flex items-center justify-center border border-red-500/30 mb-2 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative group">
                                            <div className="absolute inset-0 rounded-full border border-white/10 opacity-50" />
                                            <Database size={36} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Veritabanı Temizliği</h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed font-light">
                                                Silinecek veri türlerini seçin. <br /><span className="text-red-400/80 font-medium">Bu işlem geri alınamaz.</span>
                                            </p>
                                        </div>

                                        <div className="w-full grid gap-3 text-left">
                                            {/* Options */}
                                            {[
                                                { id: 'history', label: 'TARAMA GEÇMİŞİ', desc: 'Threads, posts, istatistikler', checked: resetOptions.history },
                                                { id: 'logs', label: 'SİSTEM LOGLARI', desc: 'Sistem logları, hata raporları', checked: resetOptions.logs },
                                                { id: 'settings', label: 'AYARLAR VE VERİLER', desc: 'Keywords, User Agents, Watchlist', checked: resetOptions.settings }
                                            ].map((item) => (
                                                <label
                                                    key={item.id}
                                                    onClick={() => setResetOptions({ ...resetOptions, [item.id]: !item.checked })}
                                                    className={`group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden
                                                    ${item.checked
                                                            ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
                                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                                >
                                                    <div className={`
                                                        w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
                                                        ${item.checked
                                                            ? 'bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                                            : 'border-zinc-600 bg-black/20 group-hover:border-zinc-500'}
                                                    `}>
                                                        {item.checked && <Check size={12} className="text-white stroke-[4]" />}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className={`text-xs font-bold tracking-wider transition-colors duration-300 ${item.checked ? 'text-red-400' : 'text-white'}`}>
                                                            {item.label}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{item.desc}</div>
                                                    </div>

                                                    {/* Glow Effect */}
                                                    {item.checked && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl -mr-8 -mt-8 rounded-full pointer-events-none" />}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 w-full pt-4">
                                            <button
                                                onClick={closeModal}
                                                className="flex-1 py-3.5 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wide"
                                            >
                                                İptal Et
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                disabled={!resetOptions.history && !resetOptions.logs && !resetOptions.settings}
                                                className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide relative overflow-hidden group"
                                            >
                                                <span className="relative z-10">Seçilenleri Sil</span>
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* LOADING STEP */}
                                {modalState.step === 'LOADING' && (
                                    <div className="flex flex-col items-center text-center py-12">
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                                            <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin relative z-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Temizleniyor...</h3>
                                        <p className="text-sm text-zinc-500 font-light">Veritabanı optimize ediliyor</p>
                                    </div>
                                )}

                                {/* SUCCESS/ERROR STEP */}
                                {(modalState.step === 'SUCCESS' || modalState.step === 'ERROR') && (
                                    <div className="flex flex-col items-center text-center py-6">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-2 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative ${modalState.step === 'SUCCESS'
                                            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border-emerald-500/30 text-emerald-400'
                                            : 'bg-gradient-to-br from-red-500/20 to-red-900/20 border-red-500/30 text-red-500'
                                            }`}>
                                            {modalState.step === 'SUCCESS' ? <Check size={40} className="drop-shadow-md" /> : <X size={40} className="drop-shadow-md" />}

                                            {/* Glow Ring */}
                                            <div className={`absolute inset-0 rounded-full blur-xl opacity-40 ${modalState.step === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        </div>

                                        <h3 className={`text-2xl font-bold mb-3 tracking-tight ${modalState.step === 'SUCCESS' ? 'text-white' : 'text-red-400'}`}>
                                            {modalState.step === 'SUCCESS' ? 'İşlem Başarılı' : 'Hata Oluştu'}
                                        </h3>

                                        <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-[90%] font-light border p-4 rounded-xl border-white/5 bg-black/20">
                                            {modalState.message}
                                        </p>

                                        <button
                                            onClick={closeModal}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-widest hover:tracking-[0.2em] duration-300"
                                        >
                                            Pencereyi Kapat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Başlık */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-zinc-800 pb-6 gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <Settings className="text-purple-500" size={28} />
                        SİSTEM YAPILANDIRMASI
                    </h1>
                    <p className="text-xs text-zinc-400 mt-2 uppercase tracking-widest pl-1">
                        galileoff • YETKİ SEVİYESİ: <span className="text-purple-500">ROOT</span>
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                        title="Tüm Verileri Yenile"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>



            {/* Kategori ve Keyword Yönetimi */}
            <KeywordManager refreshTrigger={refreshTrigger} />

            {/* User Agent Yönetimi */}
            <UserAgentManager refreshTrigger={refreshTrigger} />

            {/* Watchlist Yönetimi */}
            <WatchlistManager refreshTrigger={refreshTrigger} />

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
                        label="WATCHLIST AKTİF"
                        description="Watchlist'teki siteleri belirlenen aralıklarla otomatik olarak tarar."
                        icon={Clock}
                        checked={config.watchlistEnabled}
                        onChange={async (v) => {
                            setConfig({ ...config, watchlistEnabled: v });
                            localStorage.setItem('settings_watchlistEnabled', v);

                            // Tüm watchlist öğelerinin is_active değerini güncelle
                            try {
                                await api.put('/settings/watchlist/toggle-all', { is_active: v });
                            } catch (error) {
                                console.error("Watchlist toggle hatası:", error);
                            }
                        }}
                    />

                </motion.div>
            </div>

            {/* Tehlikeli Bölge */}
            <div className="mt-12 pt-8 border-t border-white/5">
                <h2 className="text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Lock size={14} /> KRİTİK İŞLEMLER
                </h2>

                <div className="flex items-center justify-between p-6 border border-red-500/10 bg-red-500/5 backdrop-blur-xl rounded-xl hover:bg-red-500/10 transition-colors">
                    <div>
                        <h3 className="text-sm font-bold text-red-500 mb-1">VERİTABANINI SIFIRLA</h3>
                        <p className="text-xs text-red-400/60">Tüm geçmiş tarama kayıtlarını ve indekslenmiş sayfaları kalıcı olarak siler.</p>
                    </div>
                    <button
                        onClick={openResetModal}
                        className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                        SIFIRLA
                    </button>
                </div>
            </div>
        </div >
    );
}
