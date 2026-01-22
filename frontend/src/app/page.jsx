"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';

// Dinamik importlar (SSR kapalı)
const Scanner = dynamic(() => import('../components/Scanner'), { ssr: false });
const GeneralDashboard = dynamic(() => import('../components/GeneralDashboard'), { ssr: false });
const HistoryPage = dynamic(() => import('../components/History'), { ssr: false });
const LogsPage = dynamic(() => import('../components/Logs'), { ssr: false });
const SettingsPage = dynamic(() => import('../components/Settings'), { ssr: false });

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Sayfa yenilendiğinde oturumu koru
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
        const savedTab = sessionStorage.getItem('activeTab');
        if (savedTab) {
          setActiveTab(savedTab);
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Sekme değiştiğinde kaydet
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, isAuthenticated]);

  const handleLoginSuccess = (token) => {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('activeTab', 'dashboard');
    setActiveTab('dashboard');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('activeTab');
    setIsAuthenticated(false);
    setScanResult(null);
    setActiveTab('dashboard');
  };

  const handleScanComplete = (data) => {
    setScanResult(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center font-mono">
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
    <div className="min-h-screen bg-transparent text-white flex overflow-hidden selection:bg-emerald-500/30">
      {/* Yan Menü */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Ana İçerik Alanı */}
      <main className="flex-1 ml-64 p-8 relative overflow-y-auto h-screen scrollbar-hide">

        {activeTab === 'dashboard' && <GeneralDashboard />}
        {activeTab === 'scanner' && <Scanner onScanComplete={handleScanComplete} onChangeTab={setActiveTab} />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'logs' && <LogsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
