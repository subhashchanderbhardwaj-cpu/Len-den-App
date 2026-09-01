import React from 'react';
import { Users, FileText, Plus, BarChart3, Settings } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

export type NavTab = 'khata' | 'passbook' | 'analytics' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewTxn: () => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTxn,
  language,
}) => {
  const t = getTranslation(language);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg py-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Khata Tab */}
        <button
          onClick={() => onSelectTab('khata')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'khata'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="navKhataBtn"
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">{t.tabKhata}</span>
        </button>

        {/* Passbook Tab */}
        <button
          onClick={() => onSelectTab('passbook')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'passbook'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="navPassbookBtn"
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">{t.tabPassbook}</span>
        </button>

        {/* Center Primary Action Button (Add Entry) */}
        <div className="relative -top-4">
          <button
            onClick={onOpenNewTxn}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 active:scale-95 transition-all border-4 border-white"
            title={t.tabAdd}
            id="centerAddTxnBtn"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Analytics Tab */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'analytics'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="navAnalyticsBtn"
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">{t.tabAnalytics}</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="navSettingsBtn"
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">{t.tabSettings}</span>
        </button>
      </div>
    </div>
  );
};
