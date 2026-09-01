import React, { useState } from 'react';
import { 
  Settings, User, Store, Phone, MapPin, Globe, 
  Download, Upload, CheckCircle2, Cloud, HardDrive,
  ShieldCheck, Smartphone, QrCode, FileSpreadsheet,
  ExternalLink, LogOut, LogIn, Loader2, RefreshCcw, ArrowRight
} from 'lucide-react';
import { BusinessProfile, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { GoogleUserProfile, GoogleSheetSyncState, googleAuthService } from '../utils/googleAuth';

interface SettingsViewProps {
  profile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onOpenGoogleDriveModal?: () => void;
  onBackupToDrive?: () => Promise<boolean>;
  googleUser?: GoogleUserProfile | null;
  sheetState?: GoogleSheetSyncState;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
  onSyncWithGoogleSheet?: () => void;
  onCreateGoogleSheet?: () => void;
  onOpenInstallModal?: () => void;
  isSyncingGoogle?: boolean;
  isDriveProcessing?: boolean;
  isStandalone?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onSaveProfile,
  language,
  onLanguageChange,
  onExportBackup,
  onImportBackup,
  onOpenGoogleDriveModal,
  onBackupToDrive,
  googleUser,
  sheetState,
  onConnectGoogle,
  onDisconnectGoogle,
  onSyncWithGoogleSheet,
  onCreateGoogleSheet,
  onOpenInstallModal,
  isSyncingGoogle = false,
  isDriveProcessing = false,
  isStandalone = false,
}) => {
  const t = getTranslation(language);

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [place, setPlace] = useState(profile.place);
  const [upiId, setUpiId] = useState(profile.upiId || '');
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol || '₹');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      place: place.trim(),
      upiId: upiId.trim(),
      currencySymbol: currencySymbol.trim() || '₹',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = onImportBackup(content);
        if (success) {
          alert(language === 'hi' ? 'बैकअप सफलतापूर्वक रीस्टोर हो गया!' : 'Backup restored successfully!');
        } else {
          alert(language === 'hi' ? 'अमान्य बैकअप फ़ाइल!' : 'Invalid backup file!');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Google Sheets & Account Integration Card */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-4 md:p-5 shadow-sm border border-emerald-200">
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                {language === 'hi' ? 'Google Sheets ऑटो बैकअप' : 'Google Sheets Cloud Backup'}
              </h2>
              <p className="text-xs text-emerald-800 font-medium">
                {language === 'hi' ? 'क्लाउड सिंक और ऑटोमैटिक स्प्रेडशीट' : 'Real-time cloud ledger & backup'}
              </p>
            </div>
          </div>

          {googleUser && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{language === 'hi' ? 'जुड़ा हुआ' : 'Connected'}</span>
            </span>
          )}
        </div>

        {googleUser ? (
          <div className="space-y-3">
            {/* Logged in User Card */}
            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                    {googleUser.name?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm text-slate-900">{googleUser.name}</div>
                  <div className="text-xs text-slate-500">{googleUser.email}</div>
                </div>
              </div>

              {onDisconnectGoogle && (
                <button
                  onClick={onDisconnectGoogle}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  title={language === 'hi' ? 'लॉगआउट करें' : 'Disconnect'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Google Sheet Link & Sync Controls */}
            {sheetState?.spreadsheetId ? (
              <div className="p-3.5 bg-emerald-100/60 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">Google Sheet तैयार है (Ready)</span>
                  </div>
                  <a
                    href={sheetState.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetState.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <span>{language === 'hi' ? 'शीट खोलें' : 'Open Sheet'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/80">
                  <span>
                    {sheetState.lastSyncedAt
                      ? `${language === 'hi' ? 'अंतिम सिंक:' : 'Last Synced:'} ${new Date(sheetState.lastSyncedAt).toLocaleTimeString('en-IN')}`
                      : language === 'hi' ? 'सिंक उपलब्ध' : 'Ready to sync'}
                  </span>

                  {onSyncWithGoogleSheet && (
                    <button
                      onClick={onSyncWithGoogleSheet}
                      disabled={isSyncingGoogle}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 rounded-lg font-bold border border-emerald-300 flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {isSyncingGoogle ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                      ) : (
                        <RefreshCcw className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{language === 'hi' ? 'अभी सिंक करें' : 'Sync Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="text-xs text-amber-900 font-medium">
                  {language === 'hi'
                    ? 'Google खाता कनेक्ट है, लेकिन अभी Google Sheet नहीं बनाई गई है।'
                    : 'Google Account is connected, but a spreadsheet is not created yet.'}
                </div>
                {onCreateGoogleSheet && (
                  <button
                    onClick={onCreateGoogleSheet}
                    disabled={isSyncingGoogle}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {isSyncingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    <span>
                      {language === 'hi' ? 'Google Sheet बनाएं' : 'Create Google Sheet Ledger'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'अपने Google खाते से साइन इन करें ताकि मोबाइल या अन्य डिवाइस से सारा हिसाब सीधे Google Sheets में सुरक्षित रहे।'
                : 'Sign in with your Google Account to automatically sync and store your ledger in Google Sheets.'}
            </p>
            {onConnectGoogle && (
              <button
                onClick={onConnectGoogle}
                disabled={isSyncingGoogle}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-slate-900/20 transition-all disabled:opacity-50"
              >
                {isSyncingGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.15 7.15 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                )}
                <span>
                  {language === 'hi' ? 'Google खाते से कनेक्ट करें' : 'Connect with Google Account'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Android Mobile App Installation Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-blue-600/15 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
                <img src="/icon.svg" alt="Len Den Icon" className="w-full h-full rounded-xl object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-base leading-tight">
                    {language === 'hi' ? 'एंड्रॉइड मोबाइल ऐप' : 'Android Mobile App'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                    PWA / APK
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 font-medium">
                  {language === 'hi' ? 'सीधे फोन में इंस्टॉल करें' : 'Install on Android Phone'}
                </p>
              </div>
            </div>

            {isStandalone && (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{language === 'hi' ? 'इंस्टॉल है' : 'Installed'}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-blue-100 leading-relaxed mb-3.5">
            {language === 'hi'
              ? 'Len Den Khata ऐप को बिना किसी प्ले स्टोर की आवश्यकता के अपने फोन की होम स्क्रीन पर सीधे इंस्टॉल करें। फुल-स्क्रीन, 100% ऑफलाइन और सुपर-फास्ट अनुभव!'
              : 'Install Len Den Khata directly onto your Android phone for a native full-screen app experience that works completely offline.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInstallModal}
              className="flex-1 py-3 px-4 bg-white text-blue-900 hover:bg-blue-50 active:scale-[0.98] font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
              id="settingsInstallAppBtn"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                {language === 'hi' ? 'एंड्रॉइड ऐप इंस्टॉल करें (Install App)' : 'Install on Android Phone'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 leading-tight">
              {t.businessSettings}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'रसीद व रिपोर्ट पर प्रदर्शित विवरण' : 'Details displayed on passbooks & receipts'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.businessName}</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="उदा. मेरी दुकान / श्री गणेश ट्रेडर्स"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.ownerName}</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="उदा. सुभाष शर्मा"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.phone}</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.location}</span>
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="उदा. जयपुर"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.upiId}</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="user@upi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t.savedSuccessfully}
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-blue-600/30 transition-all"
            >
              {t.saveSettings}
            </button>
          </div>
        </form>
      </div>

      {/* Language & Interface Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{t.language}</h3>
              <p className="text-xs text-slate-500">{language === 'hi' ? 'हिंदी व English सपोर्ट' : 'Hindi & English Support'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore Card */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.dataManagement}</span>
        </h3>

        <div className="space-y-3">
          {/* Google Drive Cloud Backup Primary Option */}
          <div className="p-3.5 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900 leading-tight">
                    {language === 'hi' ? 'Google Drive पर बैकअप' : 'Backup to Google Drive'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'क्लाउड में सुरक्षित बैकअप सहेजें व रीस्टोर करें' : 'Save & restore backups directly on Drive'}
                  </p>
                </div>
              </div>

              {googleAuthService.getLastDriveBackupAt() && (
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                  {language === 'hi' ? 'सुरक्षित' : 'Secured'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-100">
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {googleAuthService.getLastDriveBackupAt()
                  ? `${language === 'hi' ? 'अंतिम बैकअप:' : 'Last Backup:'} ${new Date(googleAuthService.getLastDriveBackupAt()!).toLocaleString('en-IN')}`
                  : (language === 'hi' ? 'Drive बैकअप उपलब्ध' : 'Cloud backup ready')}
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                {onBackupToDrive && (
                  <button
                    type="button"
                    onClick={onBackupToDrive}
                    disabled={isDriveProcessing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all disabled:opacity-50"
                    title={language === 'hi' ? 'तुरंत Google Drive पर बैकअप लें' : 'Backup to Google Drive now'}
                  >
                    {isDriveProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'hi' ? 'तुरंत बैकअप लें' : 'Backup Now'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenGoogleDriveModal}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0"
                  id="settingsOpenDriveModalBtn"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'बैकअप व रीस्टोर' : 'Drive Backups'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Download JSON backup */}
            <button
              onClick={onExportBackup}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span>{t.exportBackup}</span>
              </div>
              <span className="text-[11px] text-slate-400">.json</span>
            </button>

            {/* Import JSON backup */}
            <label className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{t.importBackup}</span>
              </div>
              <span className="text-[11px] text-slate-400">Select File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Security & Offline Badge */}
      <div className="bg-slate-100/80 rounded-2xl p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Smartphone className="w-4 h-4 text-slate-400" />
        <span>100% सुरक्षित • आपका डेटा केवल आपके डिवाइस और आपकी Google Sheet में रहता है</span>
      </div>
    </div>
  );
};

