import React, { useState, useEffect } from 'react';
import { 
  Cloud, HardDrive, Download, Upload, Check, 
  X, RefreshCw, Loader2, Calendar, FileText, 
  ShieldCheck, AlertCircle, ArrowRight, ExternalLink,
  Sparkles, CheckCircle2, Lock
} from 'lucide-react';
import { Language } from '../types';
import { GoogleUserProfile, googleAuthService, googleSignIn, getOrRefreshAccessToken } from '../utils/googleAuth';
import { storage } from '../utils/storage';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  googleUser: GoogleUserProfile | null;
  onConnectGoogle?: () => void;
  onBackupToDrive?: () => Promise<boolean>;
  onRestoreFromDriveContent?: (jsonStr: string) => boolean;
  isProcessing?: boolean;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  language,
  googleUser,
  onConnectGoogle,
  onBackupToDrive,
  onRestoreFromDriveContent,
  isProcessing = false,
}) => {
  const [backups, setBackups] = useState<Array<{ id: string; name: string; createdTime: string; size?: string; webViewLink?: string }>>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchBackups = async () => {
    const token = googleAuthService.getStoredToken();
    if (!token) return;
    setIsLoadingList(true);
    try {
      const list = await googleAuthService.listGoogleDriveBackups(token);
      setBackups(list);
    } catch (err: any) {
      console.error('Error fetching drive backups', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      if (googleUser) {
        fetchBackups();
      } else {
        setBackups([]);
      }
    }
  }, [isOpen, googleUser]);

  if (!isOpen) return null;

  const handleDirectGoogleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      if (onConnectGoogle) {
        onConnectGoogle();
      } else {
        const res = await googleSignIn();
        if (res?.accessToken) {
          setStatusMessage({
            type: 'success',
            text: language === 'hi' ? 'Google खाता सफलतापूर्वक कनेक्ट हुआ!' : 'Google Account connected successfully!',
          });
          await fetchBackups();
        }
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || (language === 'hi' ? 'Google साइन-इन विफल रहा' : 'Google sign-in failed'),
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBackupNow = async () => {
    setStatusMessage(null);
    setIsLocalProcessing(true);
    try {
      if (onBackupToDrive) {
        const success = await onBackupToDrive();
        if (success) {
          setStatusMessage({
            type: 'success',
            text: language === 'hi' ? 'Google Drive पर बैकअप सुरक्षित सहेज दिया गया!' : 'Backup successfully saved to Google Drive!',
          });
          await fetchBackups();
        } else {
          setStatusMessage({
            type: 'error',
            text: language === 'hi' ? 'बैकअप सहेजने में विफल। कृपया पुनः प्रयास करें।' : 'Failed to save backup to Google Drive. Please retry.',
          });
        }
      } else {
        const token = await getOrRefreshAccessToken();
        if (!token) {
          setStatusMessage({
            type: 'error',
            text: language === 'hi' ? 'Google खाता कनेक्ट करें' : 'Please connect Google Account first',
          });
          return;
        }
        const backupJson = storage.exportBackup();
        await googleAuthService.uploadBackupToGoogleDrive(token, backupJson);
        setStatusMessage({
          type: 'success',
          text: language === 'hi' ? 'Google Drive पर बैकअप सुरक्षित सहेज दिया गया!' : 'Backup successfully saved to Google Drive!',
        });
        await fetchBackups();
      }
    } catch (err: any) {
      console.error('Drive backup failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || (language === 'hi' ? 'बैकअप में त्रुटि आई।' : 'Error during backup.'),
      });
    } finally {
      setIsLocalProcessing(false);
    }
  };

  const handleRestoreBackup = async (fileId: string, fileName: string) => {
    const confirmMsg = language === 'hi'
      ? `क्या आप इस बैकअप (${fileName}) से खाता डेटा रीस्टोर करना चाहते हैं?`
      : `Do you want to restore data from this backup (${fileName})?`;
    
    if (!window.confirm(confirmMsg)) return;

    setRestoringId(fileId);
    setStatusMessage(null);
    try {
      const token = await getOrRefreshAccessToken();
      if (!token) {
        throw new Error(language === 'hi' ? 'Google प्रमाणीकरण टोकन नहीं मिला' : 'Google Auth token not found');
      }

      const jsonStr = await googleAuthService.downloadBackupFromGoogleDrive(token, fileId);
      
      let success = false;
      if (onRestoreFromDriveContent) {
        success = onRestoreFromDriveContent(jsonStr);
      } else {
        success = storage.importBackup(jsonStr);
        if (success) {
          window.location.reload();
        }
      }

      if (success) {
        setStatusMessage({
          type: 'success',
          text: language === 'hi' ? 'डेटा Google Drive बैकअप से सफलतापूर्वक रीस्टोर हो गया!' : 'Data successfully restored from Google Drive backup!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: language === 'hi' ? 'अमान्य बैकअप फ़ाइल!' : 'Invalid backup file content!',
        });
      }
    } catch (err: any) {
      console.error('Drive restore error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || (language === 'hi' ? 'रीस्टोर करने में त्रुटि आई।' : 'Error restoring backup from Google Drive.'),
      });
    } finally {
      setRestoringId(null);
    }
  };

  // Local JSON download
  const handleDownloadLocalFile = () => {
    try {
      const backupJson = storage.exportBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `LenDen_Khata_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({
        type: 'success',
        text: language === 'hi' ? 'बैकअप फ़ाइल (.json) आपके डिवाइस में डाउनलोड हो गई!' : 'Backup file (.json) downloaded to your device!',
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Local JSON upload
  const handleLocalFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let success = false;
        if (onRestoreFromDriveContent) {
          success = onRestoreFromDriveContent(content);
        } else {
          success = storage.importBackup(content);
          if (success) {
            window.location.reload();
          }
        }

        if (success) {
          setStatusMessage({
            type: 'success',
            text: language === 'hi' ? 'बैकअप फ़ाइल से डेटा सफलतापूर्वक रीस्टोर हो गया!' : 'Data restored successfully from file!',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: language === 'hi' ? 'अमान्य बैकअप फ़ाइल!' : 'Invalid backup file format!',
          });
        }
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: language === 'hi' ? 'फ़ाइल पढ़ने में त्रुटि' : 'Failed to read file',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const lastBackupTime = googleAuthService.getLastDriveBackupAt();
  const busy = isProcessing || isLocalProcessing || isLoggingIn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-2 text-blue-700 shadow-md flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                {language === 'hi' ? 'Google Drive बैकअप व रीस्टोर' : 'Google Drive Backup & Restore'}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {language === 'hi' ? 'अपने सुरक्षित पर्सनल Google Drive पर पूरा डेटा सहेजें' : 'Save & restore your khata data on your personal Google Drive'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-4">
          {/* Status feedback message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {!googleUser ? (
            /* Not logged in view */
            <div className="p-5 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                <Cloud className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  {language === 'hi' ? 'Google खाता कनेक्ट करें' : 'Connect Your Google Account'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'अपने सुरक्षित Google Drive में ऑटोमैटिक व 1-क्लिक बैकअप सहेजने के लिए Google से साइन इन करें।'
                    : 'Sign in with Google to enable automatic cloud backups directly in your personal Google Drive.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDirectGoogleLogin}
                disabled={busy}
                className="py-3 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md shadow-blue-600/25 transition-all inline-flex items-center justify-center gap-2 w-full disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                    <path fill="#FBBC05" d="M5.28 14.27a7.15 7.15 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15Z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                  </svg>
                )}
                <span>{language === 'hi' ? 'Google खाते से साइन इन करें' : 'Sign In with Google Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Logged in view */
            <div className="space-y-4">
              {/* Account details & Action button */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  {googleUser.picture ? (
                    <img
                      src={googleUser.picture}
                      alt={googleUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {googleUser.name?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{googleUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{googleUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackupNow}
                  disabled={busy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                  id="modalDriveBackupNowBtn"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'hi' ? 'अभी बैकअप लें' : 'Backup Now'}</span>
                </button>
              </div>

              {lastBackupTime && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 px-1 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'hi' ? 'अंतिम Drive बैकअप:' : 'Last Drive Backup:'}{' '}
                    <strong className="text-slate-800 font-bold">{new Date(lastBackupTime).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              )}

              {/* Drive Backups List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {language === 'hi' ? 'Google Drive में सहेजे गए बैकअप्स' : 'Backups Saved in Google Drive'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchBackups}
                    disabled={isLoadingList}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 p-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                    <span>{language === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-0.5">
                  {isLoadingList ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>{language === 'hi' ? 'Google Drive बैकअप सूची लोड हो रही है...' : 'Loading backups from Drive...'}</span>
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                      <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p>{language === 'hi' ? 'अभी तक कोई Google Drive बैकअप नहीं मिला।' : 'No backups found in your Google Drive yet.'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'hi' ? 'ऊपर दिए गए "अभी बैकअप लें" बटन पर टैप करें।' : 'Tap "Backup Now" above to create your first backup.'}
                      </p>
                    </div>
                  ) : (
                    backups.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{b.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(b.createdTime).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.webViewLink && (
                            <a
                              href={b.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                              title={language === 'hi' ? 'Drive में देखें' : 'View in Drive'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(b.id, b.name)}
                            disabled={restoringId === b.id}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                          >
                            {restoringId === b.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{language === 'hi' ? 'रीस्टोर' : 'Restore'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Local Backup & Restore Tools */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              {language === 'hi' ? 'लोकल बैकअप विकल्प (ऑफलाइन)' : 'Offline Local Backup Options'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadLocalFile}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'hi' ? 'फ़ाइल डाउनलोड (.json)' : 'Download .json'}</span>
              </button>

              <label className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'hi' ? 'फ़ाइल रीस्टोर करें' : 'Restore .json'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLocalFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
