import React from 'react';
import { LayoutDashboard, Database, Settings, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n';

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex h-screen bg-[#f5f5f5] font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>AutoBase</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} active />
          {/* Future nav items */}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe size={16} />
              <span>Language</span>
            </div>
            <div className="flex bg-white rounded-md border border-gray-200 p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  language === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  language === 'zh' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                中
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-mono px-3">v1.1.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}>
      {icon}
      {label}
    </button>
  );
}
