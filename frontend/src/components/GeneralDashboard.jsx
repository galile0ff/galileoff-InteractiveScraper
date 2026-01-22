"use client";

import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
    AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
    Globe, FileText, MessageSquare, Database, Activity, Target, Shield,
    Server, Cpu, HardDrive, Wifi, Zap, Terminal,
    EyeOff,
    LayoutDashboard,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function GeneralDashboard() {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats/general');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchLogs = async () => {
            try {
                const res = await api.get('/logs');
                setLogs(res.data);
            } catch (error) {
                console.error("Failed to fetch logs");
            }
        };

        fetchStats();
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-zinc-950 font-mono">
            <div className="flex flex-col items-center gap-4">
                <Activity className="animate-spin text-emerald-500" size={32} />
                <span className="text-zinc-400 text-xs tracking-widest animate-pulse">SİSTEM VERİLERİ YÜKLENİYOR...</span>
            </div>
        </div>
    );

    if (!stats) return null;

    // Renk Paleti
    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

    // Veri Hazırlığı
    const distributionData = [
        { name: 'Konular', value: stats.thread_count || 0 },
        { name: 'İletiler', value: stats.post_count || 0 },
    ];

    const StatCard = ({ label, value, icon: Icon, subLabel, trend, delay }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay }}
            className="glass-card p-6 group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500">
                <Icon size={80} />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-emerald-500">
                        <Icon size={20} />
                    </div>
                    {trend && <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 font-mono">{trend}</span>}
                </div>

                <div>
                    <div className="text-3xl font-bold text-white font-mono tracking-tighter mb-1">{value}</div>
                    <div className="text-xs text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                        {label}
                        {subLabel && <span className="text-zinc-500 text-[11px]"> — {subLabel}</span>}
                    </div>
                </div>
            </div>

            {/* Alt Çizgi Efekti */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-600/0 via-emerald-600/50 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );

    const SystemMetric = ({ label, value, percentage, icon: Icon, color }) => (
        <div className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-black/20">
            {/* Background Gradient */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color.replace('text-', 'from-')}/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-black/20 ring-1 ring-white/5 ${color} bg-opacity-10`}>
                        <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 tracking-wide">{label}</span>
                </div>
                <span className="text-xs font-bold text-white font-mono bg-black/30 px-2 py-1 rounded border border-white/5 min-w-[3rem] text-center">
                    {value}
                </span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                {/* Progress Bar */}
                <div
                    className={`h-full ${color.replace('text-', 'bg-')} rounded-full relative overflow-hidden transition-all duration-500`}
                    style={{ width: `${typeof percentage === 'number' ? percentage : 100}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto font-mono p-2 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-zinc-800 pb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <LayoutDashboard className="text-red-500" size={28} />
                        ANA KONTROL PANELİ
                    </h1>
                    <p className="text-xs text-zinc-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Sistem Çevrimiçi • Veri Akışı Aktif
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-zinc-500 uppercase">Son Güncelleme</div>
                        <div className="text-xs text-emerald-500 font-mono">AZ ÖNCE</div>
                    </div>
                    <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2">
                        <EyeOff size={12} /> galileoff.
                    </div>
                </div>
            </div>

            {/* İstatistik Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Taranan Hedef" value={stats.site_count} icon={Globe} subLabel="AKTİF" delay={0} />
                <StatCard label="İndeksli İçerik" value={stats.page_count} icon={FileText} subLabel="SAYFA" delay={0.1} />
                <StatCard label="Konu Başlığı" value={stats.thread_count} icon={MessageSquare} delay={0.2} />
                <StatCard label="Analiz Edilen Veri" value={stats.post_count} icon={Database} subLabel="GİRDİ" delay={0.3} />
            </div>

            {/* Ana İçerik Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sol Büyük Kolon - Grafik */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarama Hacmi Grafiği */}
                    <div className="glass-panel p-6 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-emerald-500" />
                                Taranan İçerik Hacmi
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="text-xs text-zinc-400">İLETİLER</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                    <span className="text-xs text-zinc-400">KONULAR</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.content_volume || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorThreads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#52525b"
                                        tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                        interval={0}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }}
                                        labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        itemStyle={{ fontSize: '11px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="posts"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPosts)"
                                        name="İleti Sayısı"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="threads"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorThreads)"
                                        name="Konu Sayısı"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Son Hedefler Tablosu */}
                    <div className="glass-panel p-6">
                        <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Target size={14} className="text-red-500" />
                            Son İşlenen Hedefler
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                                        <th className="py-3 font-medium">HEDEF URL</th>
                                        <th className="py-3 font-medium">ETİKET</th>
                                        <th className="py-3 font-medium text-right">DURUM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_sites && stats.recent_sites.map((site) => (
                                        <tr key={site.id} className="border-b border-zinc-800/50 group hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3 text-xs text-zinc-300 font-mono group-hover:text-white transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={12} className="text-zinc-500" />
                                                    {site.url}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    {site.source === 'watchlist' && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 uppercase tracking-wide font-bold flex items-center gap-1">
                                                            <Clock size={9} /> WATCHLIST
                                                        </span>
                                                    )}
                                                    {site.category ? (
                                                        <span
                                                            className="text-[10px] px-2 py-1 rounded border uppercase tracking-wide font-bold transition-colors"
                                                            style={{
                                                                backgroundColor: site.color ? `${site.color}20` : 'rgba(168, 85, 247, 0.1)',
                                                                borderColor: site.color ? `${site.color}40` : 'rgba(168, 85, 247, 0.3)',
                                                                color: site.color || '#a855f7'
                                                            }}
                                                        >
                                                            [{site.category}]
                                                        </span>
                                                    ) : (
                                                        <span className={`text-[11px] px-2 py-0.5 border ${site.is_forum ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-blue-500/30 text-blue-500 bg-blue-500/5'}`}>
                                                            {site.is_forum ? 'FORUM' : 'WEB'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className="text-[11px] text-emerald-500 flex items-center justify-end gap-1">
                                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> TAMAMLANDI
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Sağ Kolon - Yan Paneller */}
                <div className="space-y-6">

                    {/* Terminal Log */}
                    <div className="border border-zinc-800 bg-[#09090b] rounded-md overflow-hidden flex flex-col h-[400px] shadow-2xl font-mono text-xs relative group">
                        {/* Status Bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-[pulse_3s_infinite]"></div>
                                    <span className="text-zinc-400 font-bold tracking-widest text-[10px] uppercase">ff_TERMİNAL</span>
                                </div>
                                <div className="h-3 w-[1px] bg-zinc-800"></div>
                                <span className="text-zinc-600 text-[9px] tracking-wider">galileoff.</span>
                            </div>
                            <div className="flex gap-4 text-[9px] font-medium text-zinc-500 font-sans tracking-tight">
                                <div className="flex items-center gap-1">
                                    <span>DURUM:</span>
                                    <span>DURUM:</span>
                                    <span className={stats.system_status?.tor_status === 'AKTİF' ? "text-emerald-500" : "text-red-500"}>
                                        {stats.system_status?.tor_status === 'AKTİF' ? 'CONNECTED' : 'DISCONNECTED'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>GECİKME:</span>
                                    <span className="text-zinc-300">12ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative bg-[#050505] selection:bg-zinc-800 selection:text-white">
                            {/* Subtle Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                            <div className="relative z-10 space-y-0.5">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex gap-3 px-1.5 py-1 hover:bg-white/[0.03] transition-colors rounded-sm group/line items-baseline">
                                            <span className="text-zinc-600 font-medium whitespace-nowrap text-[10px] tabular-nums opacity-60 group-hover/line:opacity-100 transition-opacity">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </span>

                                            <div className="flex-1 break-all flex gap-3 text-[11px] leading-relaxed">
                                                <span className={`font-bold w-14 text-right shrink-0 tracking-wider ${log.level === 'ERROR' ? 'text-red-500' :
                                                    log.level === 'WARN' ? 'text-amber-500' :
                                                        log.level === 'SUCCESS' ? 'text-emerald-500' :
                                                            'text-blue-500'
                                                    }`}>
                                                    {log.level}
                                                </span>
                                                <span className={`transition-colors ${log.level === 'ERROR' ? 'text-red-200' :
                                                    log.level === 'WARN' ? 'text-amber-100' :
                                                        'text-zinc-400 group-hover/line:text-zinc-300'
                                                    }`}>
                                                    {log.message}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2 opacity-50">
                                        <Activity size={16} />
                                        <span className="uppercase tracking-widest text-[10px]">Aktif veri akışı yok.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Status */}
                        <div className="px-3 py-1 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center text-[9px] text-zinc-600 font-mono">
                            <span>memory_usage: {(stats?.system_status?.memory || 0)}%</span>
                            <span className="animate-pulse text-red-600">● REC</span>
                        </div>
                    </div>

                    {/* Hedef Dağılımı Pie Chart */}
                    <div className="glass-panel p-6 flex flex-col items-center">
                        <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4 w-full text-left flex items-center gap-2">
                            <Activity size={14} className="text-purple-500" />
                            İçerik Dağılımı
                        </h3>
                        <div className="w-[200px] h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Ortadaki Yazı */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-white">{(stats.thread_count || 0) + (stats.post_count || 0)}</span>
                                <span className="text-[11px] text-zinc-400 uppercase">VERİ</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4 w-full justify-center">
                            {distributionData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                    <span className="text-xs text-zinc-400 uppercase">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sistem Durumu */}
                    <div className="glass-panel overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Server size={16} /> SİSTEM SAĞLIĞI
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <SystemMetric label="CPU KULLANIMI" value={`${stats.system_status?.cpu || 0}%`} percentage={stats.system_status?.cpu || 0} icon={Cpu} color="text-blue-500" />
                            <SystemMetric label="BELLEK" value={`${stats.system_status?.memory || 0}%`} percentage={stats.system_status?.memory || 0} icon={HardDrive} color="text-purple-500" />
                            <SystemMetric label="AĞ GECİKMESİ" value="İyi" icon={Wifi} color="text-emerald-500" />
                            <SystemMetric label="BACKEND ZAMANI" value={stats.system_status?.uptime || "0h"} icon={Zap} color="text-amber-500" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
