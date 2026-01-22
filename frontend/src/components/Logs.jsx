"use client";

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, RefreshCw, AlertTriangle, Info, Clock, Search, Filter, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, info: 0, warn: 0, error: 0, success: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, INFO, ERROR, WARN, SUCCESS
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/logs/stats');
            setStats({
                total: res.data.total,
                info: res.data.info,
                warn: res.data.warning,
                error: res.data.error,
                success: res.data.success
            });
        } catch (error) {
            console.error("İstatistikler yüklenemedi", error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/logs');
            setLogs(res.data);
        } catch (error) {
            console.error("Loglar yüklenemedi", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesType = filter === 'ALL' || log.level === filter;
        const matchesSearch = (log.message?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (log.source?.toLowerCase() || '').includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    const StatCard = ({ label, value, icon: Icon, color, subLabel }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col relative overflow-hidden group p-4 glass-card`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-500 ${color}`}>
                <Icon size={64} />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 bg-zinc-900/80 border border-white/5 rounded-lg ${color}`}>
                        <Icon size={18} />
                    </div>
                </div>

                <div className="text-2xl font-bold text-white font-mono tracking-tighter mb-1">{value}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    {label}
                    {subLabel && <span className="text-zinc-600">— {subLabel}</span>}
                </div>
            </div>
        </motion.div>
    );

    const handleExport = () => {
        if (filteredLogs.length === 0) return;

        const timestamp = new Date().toLocaleString('tr-TR');
        let content = `GALILEOFF SİSTEM LOGLARI\nOluşturulma Tarihi: ${timestamp}\n`;
        content += `Filtre: ${filter !== 'ALL' ? filter : 'TÜMÜ'}\n`;
        content += "--------------------------------------------------------------------------------\n\n";

        filteredLogs.forEach(log => {
            const date = new Date(log.created_at).toLocaleString('tr-TR');
            content += `[${date}] [${log.level}] [${log.source}]\n`;
            content += `${log.message}\n`;
            content += "--------------------------------------------------\n";
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `galileoff_logs_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-6xl mx-auto pt-10 font-mono">
            {/* İstatistik Bandı */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <StatCard label="TOPLAM" value={stats.total} icon={FileText} color="text-white" subLabel="LOG" />
                <StatCard label="BAŞARILI" value={stats.success} icon={CheckCircle} color="text-emerald-500" subLabel="SUCCESS" />
                <StatCard label="BİLGİ" value={stats.info} icon={Info} color="text-blue-500" subLabel="INFO" />
                <StatCard label="UYARI" value={stats.warn} icon={AlertCircle} color="text-amber-500" subLabel="WARNING" />
                <StatCard label="HATA" value={stats.error} icon={AlertTriangle} color="text-red-500" subLabel="ERROR" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-zinc-800 pb-6 gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <FileText className="text-yellow-500" size={28} />
                        SİSTEM LOGLARI
                    </h1>
                    <p className="text-xs text-zinc-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                        CANLI KAYIT AKIŞI
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={filteredLogs.length === 0}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Download size={16} className="group-hover:text-emerald-500 transition-colors" />
                        <span className="hidden md:inline">DIŞA AKTAR</span>
                    </button>
                    <button
                        onClick={() => { fetchLogs(); fetchStats(); }}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                        title="Yenile"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Kontroller */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                {/* Arama */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Loglarda ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
                    />
                </div>

                {/* Filtre */}
                <div className="flex flex-wrap gap-2 justify-end">
                    {['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'].map((type) => {
                        const active = filter === type;

                        let colorStyles = {};
                        if (active) {
                            switch (type) {
                                case 'ERROR':
                                    colorStyles = { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-500', shadow: 'shadow-red-900/20' };
                                    break;
                                case 'WARN':
                                    colorStyles = { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-500', shadow: 'shadow-amber-900/20' };
                                    break;
                                case 'SUCCESS':
                                    colorStyles = { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-500', shadow: 'shadow-emerald-900/20' };
                                    break;
                                case 'INFO':
                                    colorStyles = { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-500', shadow: 'shadow-blue-900/20' };
                                    break;
                                default: // ALL
                                    colorStyles = { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', shadow: 'shadow-white/5' };
                            }
                        }

                        let label = type;
                        if (type === 'ALL') label = 'TÜMÜ';
                        if (type === 'WARN') label = 'WARNING';

                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`
                                    flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all shadow-lg
                                    ${active
                                        ? `${colorStyles.bg} ${colorStyles.border} ${colorStyles.text} ${colorStyles.shadow}`
                                        : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                {type === 'ALL' && <Filter size={14} />}
                                {type === 'INFO' && <Info size={14} />}
                                {type === 'SUCCESS' && <CheckCircle size={14} />}
                                {type === 'WARN' && <AlertCircle size={14} />}
                                {type === 'ERROR' && <AlertTriangle size={14} />}
                                {label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Log Tablosu */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel min-h-[500px]"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-48 font-mono">Tarih</th>
                                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-32 font-mono">Seviye</th>
                                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-40 font-mono">Kaynak</th>
                                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Mesaj</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-zinc-500 text-sm font-mono">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin text-zinc-600" size={20} />
                                            LOGLAR YÜKLENİYOR...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-zinc-500 text-sm italic font-mono">
                                        Kriterlerinize uyan hiçbir kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log, index) => {
                                    const getRowColor = (level) => {
                                        switch (level) {
                                            case 'ERROR': return 'text-red-500';
                                            case 'WARN': return 'text-amber-500';
                                            case 'SUCCESS': return 'text-emerald-500';
                                            default: return 'text-blue-500';
                                        }
                                    };

                                    const colorClass = getRowColor(log.level);

                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            key={log.id}
                                            className="hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0"
                                        >
                                            <td className="p-4 text-xs text-zinc-500 font-mono whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-colors" />
                                                    {new Date(log.created_at).toLocaleString('tr-TR')}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold border border-current bg-opacity-10 ${colorClass.replace('text-', 'bg-').replace('500', '500/10')} ${colorClass}`}>
                                                    <span className="tracking-wider">{log.level}</span>
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className="text-[10px] text-zinc-400 font-bold tracking-wide bg-zinc-900 border border-zinc-800 px-2 py-1 rounded font-mono">
                                                    {log.source || 'WATCHLIST'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs text-zinc-300 leading-relaxed font-medium break-all font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {log.message}
                                                </p>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
