"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

// Dinamik
const Scanner = dynamic(() => import('../components/Scanner'), { ssr: false });
const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false });

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Yüklemede yerel depolamayı kontrol et (Sadece İstemci Tarafı)
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setScanResult(null);
    setActiveTab('scanner');
  };

  const handleScanComplete = (data) => {
    setScanResult(data);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // --- Görünümler ---

  const ScannerView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Canlı Analiz</h2>
        <p className="text-gray-400">Tor ağı üzerindeki bir forum adresini tarayıp analiz edin.</p>
      </div>

      <Scanner onScanComplete={handleScanComplete} />

      {scanResult && <Dashboard data={scanResult} />}
    </motion.div>
  );

  const HistoryView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tarama Geçmişi</h2>
        <p className="text-gray-400">Daha önce yapılan analizlerin kayıtları.</p>
      </div>

      <div className="p-12 text-center border border-dashed border-gray-700 rounded-xl bg-slate-800/30">
        <p className="text-gray-500">Henüz geçmişte kayıt yok.</p>
      </div>
    </motion.div>
  );

  const SettingsView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Ayarlar</h2>
        <p className="text-gray-400">Sistem yapılandırması ve kullanıcı tercihleri.</p>
      </div>

      <div className="p-12 text-center border border-dashed border-gray-700 rounded-xl bg-slate-800/30">
        <p className="text-gray-500">Ayarlar panelini yakında geliştiricem</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex overflow-hidden">
      {/* Yan Menü */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Ana İçerik Alanı */}
      <main className="flex-1 ml-64 p-8 relative overflow-y-auto h-screen">
        {/* Arka Plan */}
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

        {activeTab === 'scanner' && <ScannerView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
