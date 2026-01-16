"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, MessageSquare, Activity, Server, ArrowDownRight } from 'lucide-react';

export default function Dashboard({ data }) {
    if (!data) return null;

    const chartData = [
        { name: 'Konular', value: data.ThreadCount || 0 },
        { name: 'Mesajlar', value: data.PostCount || 0 },
    ];

    const StatBox = ({ label, value, icon: Icon }) => (
        <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between h-32 hover:border-zinc-600 transition-colors">
            <div className="flex justify-between items-start">
                <Icon size={18} className="text-zinc-500" />
                <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 font-mono">GÜVENLİ</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-white font-mono tracking-tighter">{value}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 font-mono">
            {/* Başlık Bilgisi */}
            <div className="mb-8 p-6 border border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">HEDEF ÇEVRİMİÇİ</span>
                    </div>
                    <h1 className="text-xl text-white font-bold tracking-tight">{data.Title || "Bilinmeyen Hedef"}</h1>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">YANIT SÜRESİ</div>
                    <div className="text-sm text-white font-mono">124ms</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <StatBox label="Toplam Konu" value={data.ThreadCount} icon={FileText} />
                <StatBox label="Toplam Mesaj" value={data.PostCount} icon={MessageSquare} />
                <StatBox label="Aktif Düğümler" value="3" icon={Server} />
                <StatBox label="Risk Skoru" value="0.0" icon={Activity} />
            </div>

            {/* Grafik */}
            <div className="border border-zinc-800 bg-zinc-950 p-8 min-h-[400px]">
                <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-6">Veri Dağılımı</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#52525b"
                            tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#18181b' }}
                            contentStyle={{
                                backgroundColor: '#09090b',
                                borderColor: '#27272a',
                                color: '#fff',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                borderRadius: '0px'
                            }}
                        />
                        <Bar dataKey="value" fill="#d4d4d8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
