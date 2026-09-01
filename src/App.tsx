/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, ArrowDownLeft, ArrowUpRight, 
  Search, Filter, Plus, FileText, CheckCircle2, 
  HelpCircle, Sparkles, AlertTriangle, Download, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { 
  Account, Transaction, TransactionType, 
  BusinessProfile, Language, FilterTab, AccountCategory 
} from './types';
import { storage } from './utils/storage';
import { getTranslation } from './utils/translations';
import { 
  getAccountBalance, 
  formatCurrency, 
  CalculatedTransaction, 
  calculateRunningBalances 
} from './utils/formatters';

import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { AccountCard } from './components/AccountCard';
import { TransactionFormModal } from './components/TransactionFormModal';
import { AddAccountModal } from './components/AddAccountModal';
import { PartyDetailModal } from './components/PartyDetailModal';
import { PassbookView } from './components/PassbookView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { StatementPrintModal } from './components/StatementPrintModal';
import { PaymentReminderModal } from './components/PaymentReminderModal';
import { GoogleMobileSignInModal } from './components/GoogleMobileSignInModal';
import { InstallAppModal } from './components/InstallAppModal';
import { GoogleDriveBackupModal } from './components/GoogleDriveBackupModal';
import { 
  googleAuthService, 
  googleSignIn,
  getOrRefreshAccessToken,
  logoutGoogle,
  initAuth,
  GoogleUserProfile, 
  GoogleSheetSyncState 
} from './utils/googleAuth';

declare global {
  interface Window {
    google?: any;
  }
}

export default function App() {
  // Core application state loaded from local persistence
  const [accounts, setAccounts] = useState<Account[]>(() => storage.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [profile, setProfile] = useState<BusinessProfile>(() => storage.getProfile());
  const [language, setLanguage] = useState<Language>(() => storage.getLanguage());

  // Google OAuth & Sheets State
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() =>
    googleAuthService.getStoredUserProfile()
  );
  const [sheetState, setSheetState] = useState<GoogleSheetSyncState>(() =>
    googleAuthService.getSheetState()
  );
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveProcessing, setIsDriveProcessing] = useState(false);

  // PWA & Android Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // Navigation & filter state
  const [currentTab, setCurrentTab] = useState<NavTab>('khata');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [targetAccountForTxn, setTargetAccountForTxn] = useState<Account | null>(null);
  const [initialTxnType, setInitialTxnType] = useState<TransactionType>('credit');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);

  const [isStatementPrintOpen, setIsStatementPrintOpen] = useState(false);
  const [statementAccount, setStatementAccount] = useState<Account | null>(null);
  const [statementTransactions, setStatementTransactions] = useState<CalculatedTransaction[]>([]);
  const [statementRangeText, setStatementRangeText] = useState('');

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderAccount, setReminderAccount] = useState<Account | null>(null);
  const [reminderBalance, setReminderBalance] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getTranslation(language);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Initialize Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        const uProfile: GoogleUserProfile = {
          email: user.email || '',
          name: user.displayName || user.email || 'Google User',
          picture: user.photoURL || '',
        };
        setGoogleUser(uProfile);
      },
      () => {
        // Not logged in or expired
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Check first-time access from mobile
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    const hasPrompted = googleAuthService.hasPromptedOnMobile();
    const storedToken = googleAuthService.getStoredToken();

    if (isMobile && !hasPrompted && !storedToken) {
      const promptTimer = setTimeout(() => {
        setIsGoogleModalOpen(true);
        googleAuthService.markPromptedOnMobile();
      }, 1000);
      return () => clearTimeout(promptTimer);
    }
  }, []);

  // 3. Listen for PWA beforeinstallprompt on Android/Chrome
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      showToast(language === 'hi' ? 'Len Den Khata ऐप सफलतापूर्वक इंस्टॉल हो गई!' : 'Len Den Khata app installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [language]);

  // Post login helper: Fetch profile & create sheet if needed
  const handlePostGoogleAuth = async (token: string, directProfile?: GoogleUserProfile) => {
    setIsGoogleLoading(true);
    try {
      // 1. Set user info
      if (directProfile) {
        setGoogleUser(directProfile);
      } else {
        const uProfile = await googleAuthService.fetchUserProfile(token);
        if (uProfile) {
          setGoogleUser(uProfile);
        }
      }

      // 2. Check if a spreadsheet is already created; if not, create one on first time access
      const currentState = googleAuthService.getSheetState();
      if (!currentState.spreadsheetId) {
        const { spreadsheetId, spreadsheetUrl } = await googleAuthService.createKhataSpreadsheet(
          token,
          profile,
          accounts,
          transactions
        );
        setSheetState(googleAuthService.getSheetState());
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        showToast(
          language === 'hi'
            ? 'Google Sheet तैयार हो गई है!'
            : 'Google Sheet Ledger created successfully!'
        );
      } else {
        // Sync fresh data
        await googleAuthService.syncAllDataToSheet(
          token,
          currentState.spreadsheetId,
          profile,
          accounts,
          transactions
        );
        setSheetState(googleAuthService.getSheetState());
        showToast(language === 'hi' ? 'Google Sheet सिंक हो गई!' : 'Google Sheet synced!');
      }

      setIsGoogleModalOpen(false);
    } catch (err: any) {
      console.error('Error during Google Sheets setup:', err);
      showToast(err.message || (language === 'hi' ? 'शीट बनाने में समस्या आई' : 'Failed to setup Google Sheet'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Login Trigger via Firebase Popup
  const handleTriggerGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.profile);
        await handlePostGoogleAuth(result.accessToken, result.profile);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      // If popup closed by user or cancelled
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        showToast(
          language === 'hi'
            ? 'Google साइन-इन विफल रहा: ' + (err.message || '')
            : 'Google sign-in failed: ' + (err.message || '')
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Manual Sync Trigger
  const handleSyncGoogleSheet = async () => {
    const token = googleAuthService.getStoredToken();
    const currentState = googleAuthService.getSheetState();
    if (!token) {
      handleTriggerGoogleLogin();
      return;
    }
    if (!currentState.spreadsheetId) {
      handleCreateGoogleSheet();
      return;
    }

    setIsGoogleLoading(true);
    try {
      await googleAuthService.syncAllDataToSheet(
        token,
        currentState.spreadsheetId,
        profile,
        accounts,
        transactions
      );
      setSheetState(googleAuthService.getSheetState());
      showToast(language === 'hi' ? 'Google Sheet में डेटा सिंक हो गया!' : 'Synced to Google Sheet!');
    } catch (err: any) {
      console.error('Sync error:', err);
      if (err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED')) {
        googleAuthService.clearAuth();
        setGoogleUser(null);
        handleTriggerGoogleLogin();
      } else {
        showToast(language === 'hi' ? 'सिंक विफल रहा' : 'Sync failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Manual Create Sheet Trigger
  const handleCreateGoogleSheet = async () => {
    const token = googleAuthService.getStoredToken();
    if (!token) {
      handleTriggerGoogleLogin();
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { spreadsheetUrl } = await googleAuthService.createKhataSpreadsheet(
        token,
        profile,
        accounts,
        transactions
      );
      setSheetState(googleAuthService.getSheetState());
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      showToast(
        language === 'hi'
          ? 'नई Google Sheet बहीखाता तैयार हो गया!'
          : 'New Google Sheet ledger created!'
      );
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showToast(language === 'hi' ? 'शीट बनाने में त्रुटि' : 'Failed to create sheet');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    googleAuthService.setSheetState({ spreadsheetId: null, spreadsheetUrl: null, lastSyncedAt: null });
    setGoogleUser(null);
    setSheetState(googleAuthService.getSheetState());
    showToast(language === 'hi' ? 'Google खाता डिस्कनेक्ट कर दिया गया' : 'Google Account disconnected');
  };

  // Google Drive Backup Handlers
  const handleBackupToGoogleDrive = async (): Promise<boolean> => {
    setIsDriveProcessing(true);
    try {
      let token = await getOrRefreshAccessToken();
      if (!token) {
        // Prompt login and get token
        const loginRes = await googleSignIn();
        if (loginRes) {
          token = loginRes.accessToken;
          setGoogleUser(loginRes.profile);
        }
      }

      if (!token) {
        showToast(language === 'hi' ? 'Google खाता कनेक्ट करें' : 'Please connect Google account');
        return false;
      }

      const backupJson = storage.exportBackup();
      await googleAuthService.uploadBackupToGoogleDrive(token, backupJson);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      showToast(
        language === 'hi'
          ? 'Google Drive पर बैकअप सुरक्षित सहेजा गया!'
          : 'Backup successfully uploaded to Google Drive!'
      );
      return true;
    } catch (err: any) {
      console.error('Google Drive backup error:', err);
      if (err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED')) {
        googleAuthService.clearAuth();
        setGoogleUser(null);
        showToast(language === 'hi' ? 'Google सत्र समाप्त हो गया, कृपया पुनः लॉगिन करें' : 'Session expired, please sign in again');
      } else {
        showToast(err.message || (language === 'hi' ? 'Google Drive बैकअप में त्रुटि' : 'Google Drive backup failed'));
      }
      return false;
    } finally {
      setIsDriveProcessing(false);
    }
  };

  const handleRestoreFromDriveJson = (jsonStr: string): boolean => {
    const ok = storage.importBackup(jsonStr);
    if (ok) {
      setAccounts(storage.getAccounts());
      setTransactions(storage.getTransactions());
      setProfile(storage.getProfile());
      setLanguage(storage.getLanguage());
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      showToast(language === 'hi' ? 'Google Drive से डेटा रीस्टोर हो गया!' : 'Data restored from Google Drive!');
      return true;
    }
    showToast(language === 'hi' ? 'बैकअप फ़ाइल अमान्य है' : 'Invalid backup data format');
    return false;
  };

  // Sync state changes to storage
  useEffect(() => {
    storage.saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    storage.saveLanguage(language);
  }, [language]);

  // Dashboard Aggregated Stats
  const dashboardStats = useMemo(() => {
    let totalToReceive = 0;
    let totalToGive = 0;

    accounts.forEach((acc) => {
      const bal = getAccountBalance(acc.id, transactions);
      if (bal > 0) {
        totalToReceive += bal;
      } else if (bal < 0) {
        totalToGive += Math.abs(bal);
      }
    });

    const net = totalToReceive - totalToGive;

    return {
      totalToReceive,
      totalToGive,
      net,
    };
  }, [accounts, transactions]);

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const bal = getAccountBalance(acc.id, transactions);

      // 1. Status Filter Tab
      if (filterTab === 'get' && bal <= 0) return false;
      if (filterTab === 'give' && bal >= 0) return false;
      if (filterTab === 'settled' && bal !== 0) return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && acc.category !== categoryFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchPlace = (acc.place || '').toLowerCase().includes(q);
        const matchPhone = (acc.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchPlace && !matchPhone) return false;
      }

      return true;
    });
  }, [accounts, transactions, filterTab, categoryFilter, searchQuery]);

  // Handler: Save / Update Account
  const handleSaveAccount = (accountData: Omit<Account, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === existingId ? { ...a, ...accountData } : a))
      );
      // Update account name in transactions if edited
      setTransactions((prev) =>
        prev.map((t) =>
          t.accountId === existingId ? { ...t, accountName: accountData.name } : t
        )
      );
      showToast(t.updatedSuccessfully);
    } else {
      const newAcc: Account = {
        ...accountData,
        id: `acc_${Date.now()}`,
        createdAt: Date.now(),
      };
      setAccounts((prev) => [newAcc, ...prev]);
      showToast(t.savedSuccessfully);
    }
  };

  // Handler: Delete Account
  const handleDeleteAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setTransactions((prev) => prev.filter((t) => t.accountId !== accountId));
    if (selectedAccountForDetail?.id === accountId) {
      setSelectedAccountForDetail(null);
    }
    showToast(t.deletedSuccessfully);
  };

  // Handler: Save / Update Transaction
  const handleSaveTransaction = (
    txnData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...txnData } : t))
      );
      showToast(t.updatedSuccessfully);
    } else {
      const newTxn: Transaction = {
        ...txnData,
        id: `txn_${Date.now()}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTxn, ...prev]);
      showToast(t.savedSuccessfully);
    }
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = (txnId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txnId));
    showToast(t.deletedSuccessfully);
  };

  // Quick Action Triggers
  const handleOpenNewTxnModal = (acc?: Account | null, type: TransactionType = 'credit') => {
    setTargetAccountForTxn(acc || null);
    setInitialTxnType(type);
    setEditingTxn(null);
    setIsTxnModalOpen(true);
  };

  const handleEditTxn = (txn: Transaction) => {
    setEditingTxn(txn);
    setIsTxnModalOpen(true);
  };

  const handleOpenAddAccount = (acc?: Account | null) => {
    setEditingAccount(acc || null);
    setIsAccountModalOpen(true);
  };

  const handleSendReminder = (acc: Account, bal: number) => {
    setReminderAccount(acc);
    setReminderBalance(bal);
    setIsReminderOpen(true);
  };

  const handleSettleFullBalance = (acc: Account, currentBal: number) => {
    // If party owed us (currentBal > 0), they paid us full -> create Credit transaction
    // If we owed party (currentBal < 0), we paid them full -> create Debit transaction
    const isPartyOwedUs = currentBal > 0;
    const settleType: TransactionType = isPartyOwedUs ? 'credit' : 'debit';
    const settleAmount = Math.abs(currentBal);

    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      accountId: acc.id,
      accountName: acc.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      details: language === 'hi' ? 'पूरा हिसाब चुकता (Settled Full Balance)' : 'Settled Full Balance',
      type: settleType,
      amount: settleAmount,
      paymentMode: 'cash',
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTxn, ...prev]);
    showToast(language === 'hi' ? 'खाता पूर्णतः चुकता कर दिया गया!' : 'Account settled successfully!');
  };

  const handleOpenStatementPrintForParty = (acc: Account, txns: CalculatedTransaction[]) => {
    setStatementAccount(acc);
    setStatementTransactions(txns);
    setStatementRangeText(language === 'hi' ? 'अब तक का पूर्ण विवरण' : 'All Time Complete Ledger');
    setIsStatementPrintOpen(true);
  };

  const handleOpenStatementPrintGeneric = (
    acc: Account | null,
    txns: CalculatedTransaction[],
    rangeText: string
  ) => {
    setStatementAccount(acc);
    setStatementTransactions(txns);
    setStatementRangeText(rangeText);
    setIsStatementPrintOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs md:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        profile={profile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setCurrentTab('settings')}
        googleUser={googleUser}
        sheetState={sheetState}
        onSyncWithSheet={handleSyncGoogleSheet}
        onConnectGoogle={() => setIsGoogleModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isSyncing={isGoogleLoading}
        isStandalone={isStandalone}
      />

      {/* Android Mobile Install Quick Banner (shown if not yet installed in standalone mode) */}
      {!isStandalone && showInstallBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-3.5 py-2.5 shadow-md flex items-center justify-between gap-2 border-b border-blue-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white p-0.5 shrink-0 shadow-sm flex items-center justify-center">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full rounded-lg object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs truncate">Len Den Khata</span>
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase">
                  Android
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 truncate">
                {language === 'hi' ? 'फोन में ऐप की तरह इंस्टॉल करें' : 'Install as Android phone app'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
              id="topBannerInstallBtn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'इंस्टॉल' : 'Install'}</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center hover:bg-white/10"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-3.5 md:p-4">
        {/* TAB 1: KHATA / PARTIES LIST */}
        {currentTab === 'khata' && (
          <div className="space-y-3.5 pb-24 animate-in fade-in duration-150">
            {/* Top Stat Cards (Receive / Give / Net) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* You'll Get Card */}
              <div 
                onClick={() => setFilterTab(filterTab === 'get' ? 'all' : 'get')}
                className={`p-3.5 rounded-3xl cursor-pointer transition-all border ${
                  filterTab === 'get'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${filterTab === 'get' ? 'text-emerald-100' : 'text-emerald-800'}`}>
                    {t.totalToGet}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${filterTab === 'get' ? 'bg-white/20' : 'bg-emerald-200/70'}`}>
                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-black mt-1">
                  +{formatCurrency(dashboardStats.totalToReceive, profile.currencySymbol)}
                </div>
              </div>

              {/* You'll Give Card */}
              <div 
                onClick={() => setFilterTab(filterTab === 'give' ? 'all' : 'give')}
                className={`p-3.5 rounded-3xl cursor-pointer transition-all border ${
                  filterTab === 'give'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                    : 'bg-rose-50 hover:bg-rose-100/80 text-rose-950 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${filterTab === 'give' ? 'text-rose-100' : 'text-rose-800'}`}>
                    {t.totalToGive}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${filterTab === 'give' ? 'bg-white/20' : 'bg-rose-200/70'}`}>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-black mt-1">
                  -{formatCurrency(dashboardStats.totalToGive, profile.currencySymbol)}
                </div>
              </div>
            </div>

            {/* Filter Tabs Strip */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.filterAll} ({accounts.length})
                </button>
                <button
                  onClick={() => setFilterTab('get')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    filterTab === 'get' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {t.filterToGet}
                </button>
                <button
                  onClick={() => setFilterTab('give')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    filterTab === 'give' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  {t.filterToGive}
                </button>
                <button
                  onClick={() => setFilterTab('settled')}
                  className={`px-2.5 py-1.5 rounded-xl transition-all ${
                    filterTab === 'settled' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.filterSettled}
                </button>
              </div>

              {/* Add New Party Button */}
              <button
                onClick={() => handleOpenAddAccount()}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                id="mainAddPartyBtn"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ {t.addAccount}</span>
              </button>
            </div>

            {/* Category Filter Pills (Optional) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              <span className="text-[11px] text-slate-400 shrink-0">श्रेणी:</span>
              {[
                { id: 'all', label: t.allCategories },
                { id: 'customer', label: t.catCustomer },
                { id: 'supplier', label: t.catSupplier },
                { id: 'friend', label: t.catFriend },
                { id: 'staff', label: t.catStaff },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-xl transition-all shrink-0 text-[11px] ${
                    categoryFilter === cat.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Parties List */}
            <div className="space-y-2">
              {filteredAccounts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-slate-200 shadow-sm">
                  <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'hi' ? 'कोई खाता नहीं मिला' : 'No accounts found'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'hi' ? 'नया खाता जोड़ने के लिए ऊपर दिए बटन पर क्लिक करें' : 'Click "+ Add New Account" above to get started'}
                  </p>
                  <button
                    onClick={() => handleOpenAddAccount()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30"
                  >
                    + {t.addAccount}
                  </button>
                </div>
              ) : (
                filteredAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    transactions={transactions}
                    language={language}
                    profile={profile}
                    onClick={() => setSelectedAccountForDetail(acc)}
                    onQuickAddCredit={(a) => handleOpenNewTxnModal(a, 'credit')}
                    onQuickAddDebit={(a) => handleOpenNewTxnModal(a, 'debit')}
                    onSendReminder={handleSendReminder}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PASSBOOK / STATEMENTS */}
        {currentTab === 'passbook' && (
          <PassbookView
            accounts={accounts}
            transactions={transactions}
            language={language}
            profile={profile}
            onEditTransaction={handleEditTxn}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenStatementPrint={handleOpenStatementPrintGeneric}
            onSelectAccountDetail={setSelectedAccountForDetail}
          />
        )}

        {/* TAB 3: ANALYTICS */}
        {currentTab === 'analytics' && (
          <AnalyticsView
            accounts={accounts}
            transactions={transactions}
            language={language}
            profile={profile}
            onSelectAccount={setSelectedAccountForDetail}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsView
            profile={profile}
            onSaveProfile={setProfile}
            language={language}
            onLanguageChange={setLanguage}
            googleUser={googleUser}
            sheetState={sheetState}
            onConnectGoogle={() => setIsGoogleModalOpen(true)}
            onDisconnectGoogle={handleDisconnectGoogle}
            onSyncWithGoogleSheet={handleSyncGoogleSheet}
            onCreateGoogleSheet={handleCreateGoogleSheet}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenGoogleDriveModal={() => setIsDriveModalOpen(true)}
            onBackupToDrive={handleBackupToGoogleDrive}
            isDriveProcessing={isDriveProcessing}
            isSyncingGoogle={isGoogleLoading}
            isStandalone={isStandalone}
            onExportBackup={() => {
              const dataStr = storage.exportBackup();
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `LenDen_Backup_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast(language === 'hi' ? 'बैकअप डाउनलोड हो गया!' : 'Backup downloaded!');
            }}
            onImportBackup={(jsonStr) => {
              const ok = storage.importBackup(jsonStr);
              if (ok) {
                setAccounts(storage.getAccounts());
                setTransactions(storage.getTransactions());
                setProfile(storage.getProfile());
                setLanguage(storage.getLanguage());
                showToast(language === 'hi' ? 'डेटा रीस्टोर हो गया!' : 'Data restored!');
                return true;
              }
              return false;
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewTxn={() => handleOpenNewTxnModal()}
        language={language}
      />

      {/* Google Mobile Sign-In Prompt Modal */}
      <GoogleMobileSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSignIn={handleTriggerGoogleLogin}
        isLoading={isGoogleLoading}
        language={language}
      />

      {/* Google Drive Backup & Restore Modal */}
      <GoogleDriveBackupModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        language={language}
        googleUser={googleUser}
        onConnectGoogle={() => setIsGoogleModalOpen(true)}
        onBackupToDrive={handleBackupToGoogleDrive}
        onRestoreFromDriveContent={handleRestoreFromDriveJson}
        isProcessing={isDriveProcessing}
      />

      {/* Android Mobile Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        language={language}
        deferredPrompt={deferredPrompt}
        onInstalledSuccess={() => {
          setIsStandalone(true);
          setDeferredPrompt(null);
          showToast(language === 'hi' ? 'ऐप इंस्टॉल हो गया है!' : 'App installed successfully!');
        }}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isTxnModalOpen}
        onClose={() => {
          setIsTxnModalOpen(false);
          setEditingTxn(null);
          setTargetAccountForTxn(null);
        }}
        onSave={handleSaveTransaction}
        accounts={accounts}
        initialAccount={targetAccountForTxn}
        initialType={initialTxnType}
        editingTransaction={editingTxn}
        language={language}
        profile={profile}
        onAddNewAccount={() => {
          setIsTxnModalOpen(false);
          handleOpenAddAccount();
        }}
      />

      {/* 2. Add / Edit Account Modal */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
        language={language}
        profile={profile}
      />

      {/* 3. Detailed Party Passbook Modal */}
      <PartyDetailModal
        isOpen={!!selectedAccountForDetail}
        onClose={() => setSelectedAccountForDetail(null)}
        account={selectedAccountForDetail}
        transactions={transactions}
        language={language}
        profile={profile}
        onEditAccount={(acc) => {
          setSelectedAccountForDetail(null);
          handleOpenAddAccount(acc);
        }}
        onDeleteAccount={handleDeleteAccount}
        onAddTransactionForAccount={(acc, type) => {
          handleOpenNewTxnModal(acc, type);
        }}
        onEditTransaction={handleEditTxn}
        onDeleteTransaction={handleDeleteTransaction}
        onOpenStatementPrint={handleOpenStatementPrintForParty}
        onSendReminder={handleSendReminder}
        onSettleFullBalance={handleSettleFullBalance}
      />

      {/* 4. Statement Printable Sheet Modal */}
      <StatementPrintModal
        isOpen={isStatementPrintOpen}
        onClose={() => setIsStatementPrintOpen(false)}
        account={statementAccount}
        transactions={statementTransactions}
        rangeText={statementRangeText}
        language={language}
        profile={profile}
      />

      {/* 5. Payment Reminder Modal */}
      <PaymentReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        account={reminderAccount}
        balance={reminderBalance}
        language={language}
        profile={profile}
      />
    </div>
  );
}
