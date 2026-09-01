import React from 'react';
import { BookOpen, Globe, Search, RefreshCw, UserCheck, FileSpreadsheet, CheckCircle2, LogIn, Smartphone, Download } from 'lucide-react';
import { Language, BusinessProfile } from '../types';
import { getTranslation } from '../utils/translations';
import { GoogleUserProfile, GoogleSheetSyncState } from '../utils/googleAuth';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  profile: BusinessProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings: () => void;
  onResetSample?: () => void;
  googleUser?: GoogleUserProfile | null;
  sheetState?: GoogleSheetSyncState;
  onSyncWithSheet?: () => void;
  onConnectGoogle?: () => void;
  onOpenInstallModal?: () => void;
  isSyncing?: boolean;
  isStandalone?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  profile,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  googleUser,
  sheetState,
  onSyncWithSheet,
  onConnectGoogle,
  onOpenInstallModal,
  isSyncing = false,
  isStandalone = false,
}) => {
  const t = getTranslation(language);

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top row: Brand & Language & Profile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">
                {profile.businessName || t.appTitle}
              </h1>
              <p className="text-xs text-blue-100/90 font-medium">
                {profile.ownerName ? `${profile.ownerName} • ${profile.place || 'भारत'}` : t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Install Android App Pill (if not in standalone mode) */}
            {!isStandalone && onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                title={language === 'hi' ? 'एंड्रॉइड ऐप इंस्टॉल करें' : 'Install Android App'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 text-xs font-bold active:scale-95 transition-all shadow-sm"
                id="headerInstallAppBtn"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}</span>
              </button>
            )}

            {/* Google Sheet Sync Indicator / Connect Button */}
            {googleUser && sheetState?.spreadsheetId ? (
              <a
                href={sheetState.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetState.spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                title={language === 'hi' ? 'Google Sheet खोलें' : 'Open Google Sheet'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 active:scale-95 transition-all text-xs font-semibold border border-emerald-300/40 text-emerald-100 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Google Sheet</span>
              </a>
            ) : (
              <button
                onClick={() => onConnectGoogle?.()}
                title={language === 'hi' ? 'Google खाता जोड़ें' : 'Connect Google'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-semibold border border-white/20 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">{language === 'hi' ? 'Google शीट' : 'Google Sheet'}</span>
              </button>
            )}

            {/* Language Toggle Pill */}
            <button
              onClick={() => onLanguageChange(language === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-semibold border border-white/20 shadow-sm"
              title="भाषा बदलें / Switch Language"
              id="langToggleBtn"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'Eng' : 'हिंदी'}</span>
            </button>

            {/* Profile / Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/15 relative"
              title={t.tabSettings}
              id="headerSettingsBtn"
            >
              {googleUser?.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {sheetState?.spreadsheetId && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-blue-700" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-2.5 relative">
          <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 bg-white/10 text-white placeholder-blue-200/70 text-sm rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all backdrop-blur-sm"
            id="globalSearchInput"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs bg-white/20 hover:bg-white/30 rounded-full w-4 h-4 flex items-center justify-center text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
