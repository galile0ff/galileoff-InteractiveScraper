"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';

// Dinamik importlar (SSR kapalı)
const Scanner = dynamic(() => import('../components/Scanner'), { ssr: false });
const GeneralDashboard = dynamic(() => import('../components/GeneralDashboard'), { ssr: false });
const HistoryPage = dynamic(() => import('../components/History'), { ssr: false });
const SettingsPage = dynamic(() => import('../components/Settings'), { ssr: false });

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // Sayfa yenilendiğinde son kalınan sekmeyi aç
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
    setIsLoading(false);
  }, []);

  // Sekme değiştiğinde kaydet
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, isAuthenticated]);

  const handleLoginSuccess = (token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('activeTab', 'dashboard'); // Login olunca dashboard'a git
    setActiveTab('dashboard');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeTab'); // Çıkış yapınca sekme bilgisini sil
    setIsAuthenticated(false);
    setScanResult(null);
    setActiveTab('dashboard');
  };

  const handleScanComplete = (data) => {
    setScanResult(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-emerald-500 text-xs tracking-widest animate-pulse">BAĞLANTI KURULUYOR...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden selection:bg-emerald-500/30">
      {/* Yan Menü */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Ana İçerik Alanı */}
      <main className="flex-1 ml-64 p-8 relative overflow-y-auto h-screen scrollbar-hide">
        {/* Arka Plan Efekti */}
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black pointer-events-none -z-10" />
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {activeTab === 'dashboard' && <GeneralDashboard />}
        {activeTab === 'scanner' && <Scanner onScanComplete={handleScanComplete} />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
