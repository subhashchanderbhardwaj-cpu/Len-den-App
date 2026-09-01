import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Account, Transaction, BusinessProfile } from '../types';

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture: string;
}

export interface GoogleSheetSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'lenden_google_access_token_v1',
  TOKEN_EXPIRES_AT: 'lenden_google_token_expires_v1',
  USER_PROFILE: 'lenden_google_user_profile_v1',
  SHEET_STATE: 'lenden_google_sheet_state_v1',
  PROMPTED_MOBILE: 'lenden_google_prompted_mobile_v1',
  LAST_DRIVE_BACKUP: 'lenden_google_drive_last_backup_v1',
};

// Initialize Firebase App & Auth
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = googleAuthService.getStoredToken();
      const tokenToUse = cachedAccessToken || storedToken;
      if (tokenToUse) {
        cachedAccessToken = tokenToUse;
        if (onAuthSuccess) onAuthSuccess(user, tokenToUse);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: GoogleUserProfile } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    if (!accessToken) {
      throw new Error('Google access token not received');
    }

    cachedAccessToken = accessToken;
    googleAuthService.setToken(accessToken, 3600);

    const profile: GoogleUserProfile = {
      name: result.user.displayName || result.user.email || 'Google User',
      email: result.user.email || '',
      picture: result.user.photoURL || '',
    };
    googleAuthService.setStoredUserProfile(profile);

    return { user: result.user, accessToken, profile };
  } catch (error: any) {
    console.error('Firebase Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getOrRefreshAccessToken = async (): Promise<string | null> => {
  const token = googleAuthService.getStoredToken();
  if (token) return token;
  try {
    const res = await googleSignIn();
    return res?.accessToken || null;
  } catch (e) {
    console.error('Failed to obtain Google access token:', e);
    return null;
  }
};

export const logoutGoogle = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Firebase signOut error', e);
  }
  cachedAccessToken = null;
  googleAuthService.clearAuth();
};

export const googleAuthService = {
  getLastDriveBackupAt(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_DRIVE_BACKUP);
    } catch {
      return null;
    }
  },

  setLastDriveBackupAt(timestamp: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_DRIVE_BACKUP, timestamp);
    } catch (e) {
      console.error('Failed to save last drive backup timestamp', e);
    }
  },

  getStoredToken(): string | null {
    if (cachedAccessToken) return cachedAccessToken;
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      if (!token || !expiresAt) return null;
      if (Date.now() > Number(expiresAt)) {
        this.clearAuth();
        return null;
      }
      cachedAccessToken = token;
      return token;
    } catch {
      return null;
    }
  },

  setToken(token: string, expiresInSeconds: number = 3600): void {
    cachedAccessToken = token;
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      const expiresAt = Date.now() + (expiresInSeconds - 120) * 1000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
    } catch (e) {
      console.error('Failed to save Google token', e);
    }
  },

  getStoredUserProfile(): GoogleUserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUserProfile(profile: GoogleUserProfile | null): void {
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      }
    } catch (e) {
      console.error('Failed to save Google user profile', e);
    }
  },

  getSheetState(): GoogleSheetSyncState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_STATE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to get sheet state', e);
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSyncedAt: null,
      autoSync: true,
    };
  },

  setSheetState(state: Partial<GoogleSheetSyncState>): GoogleSheetSyncState {
    const current = this.getSheetState();
    const updated: GoogleSheetSyncState = { ...current, ...state };
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_STATE, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to set sheet state', e);
    }
    return updated;
  },

  hasPromptedOnMobile(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PROMPTED_MOBILE) === 'true';
  },

  markPromptedOnMobile(): void {
    localStorage.setItem(STORAGE_KEYS.PROMPTED_MOBILE, 'true');
  },

  clearAuth(): void {
    cachedAccessToken = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  /**
   * Fetch current user profile info using the access token
   */
  async fetchUserProfile(token: string): Promise<GoogleUserProfile | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const profile: GoogleUserProfile = {
        email: data.email || '',
        name: data.name || data.email || 'Google User',
        picture: data.picture || '',
      };
      this.setStoredUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching Google profile:', err);
      return null;
    }
  },

  /**
   * Create a formatted Google Spreadsheet for Len Den Khata
   */
  async createKhataSpreadsheet(
    token: string,
    profile: BusinessProfile,
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const title = `${profile.businessName || 'Len Den Khata'} - डिजिटल बहीखाता (${new Date().toLocaleDateString('en-GB')})`;

    // 1. Create Spreadsheet with two sheets: 'Parties Summary (खाता सारांश)' & 'All Transactions (समस्त लेन-देन)'
    const createPayload = {
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'खाता सारांश (Accounts)',
            gridProperties: { rowCount: 100, columnCount: 8, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'समस्त लेन-देन (Transactions)',
            gridProperties: { rowCount: 500, columnCount: 9, frozenRowCount: 1 },
          },
        },
      ],
    };

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Sheet');
    }

    const createdSheet = await createRes.json();
    const spreadsheetId: string = createdSheet.spreadsheetId;
    const spreadsheetUrl: string = createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Populate initial data & headers
    await this.syncAllDataToSheet(token, spreadsheetId, profile, accounts, transactions);

    this.setSheetState({
      spreadsheetId,
      spreadsheetUrl,
      lastSyncedAt: new Date().toISOString(),
    });

    return { spreadsheetId, spreadsheetUrl };
  },

  /**
   * Sync accounts and transactions into an existing Google Sheet
   */
  async syncAllDataToSheet(
    token: string,
    spreadsheetId: string,
    profile: BusinessProfile,
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<void> {
    // Prepare Accounts Sheet rows
    const accountsHeader = [
      'खाता ID (Account ID)',
      'नाम (Party Name)',
      'मोबाइल (Phone)',
      'स्थान (Location)',
      'श्रेणी (Category)',
      'कुल जमा / CR (Total Received)',
      'कुल नाम / DR (Total Paid)',
      'शुद्ध बैलेंस / Net Balance (₹)',
    ];

    const accountRows = accounts.map((acc) => {
      const accTxns = transactions.filter((t) => t.accountId === acc.id);
      const totalCr = accTxns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const totalDr = accTxns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      const balance = totalCr - totalDr; // positive = to get, negative = to give

      return [
        acc.id,
        acc.name,
        acc.phone || '-',
        acc.place || '-',
        acc.category,
        totalCr,
        totalDr,
        balance,
      ];
    });

    // Prepare Transactions Sheet rows
    const txnHeader = [
      'लेन-देन ID (Txn ID)',
      'दिनांक (Date)',
      'समय (Time)',
      'खाता धारक (Party Name)',
      'प्रकार (Type - CR/DR)',
      'राशि (Amount ₹)',
      'विवरण (Narration)',
      'भुगतान माध्यम (Mode)',
      'दर्ज समय (Logged At)',
    ];

    const txnRows = transactions
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((t) => [
        t.id,
        t.date,
        t.time || '-',
        t.accountName,
        t.type === 'credit' ? 'पैसे मिले / जमा (CR +)' : 'पैसे दिए / नामे (DR -)',
        t.amount,
        t.details || '-',
        t.paymentMode || 'cash',
        new Date(t.createdAt).toLocaleString('en-IN'),
      ]);

    // Batch update values to Google Sheet
    const updatePayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'खाता सारांश (Accounts)!A1:H',
          values: [accountsHeader, ...accountRows],
        },
        {
          range: 'समस्त लेन-देन (Transactions)!A1:I',
          values: [txnHeader, ...txnRows],
        },
      ],
    };

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update Google Sheet data');
    }

    this.setSheetState({
      lastSyncedAt: new Date().toISOString(),
    });
  },

  /**
   * Append a single transaction to Google Sheet
   */
  async appendTransactionToSheet(
    token: string,
    spreadsheetId: string,
    txn: Transaction
  ): Promise<void> {
    const row = [
      txn.id,
      txn.date,
      txn.time || '-',
      txn.accountName,
      txn.type === 'credit' ? 'पैसे मिले / जमा (CR +)' : 'पैसे दिए / नामे (DR -)',
      txn.amount,
      txn.details || '-',
      txn.paymentMode || 'cash',
      new Date(txn.createdAt).toLocaleString('en-IN'),
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/समस्त लेन-देन (Transactions)!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );
  },

  /**
   * Upload a full JSON backup file directly into the user's Google Drive
   */
  async uploadBackupToGoogleDrive(
    token: string,
    backupJsonString: string
  ): Promise<{ id: string; name: string; webViewLink?: string; createdTime?: string }> {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `LenDen_Khata_Backup_${dateStr}.json`;

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'Len Den Mobile Khata Complete Data Backup',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      backupJsonString +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload backup to Google Drive');
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();
    this.setLastDriveBackupAt(nowIso);
    return data;
  },

  /**
   * List previous backups stored in Google Drive
   */
  async listGoogleDriveBackups(
    token: string
  ): Promise<Array<{ id: string; name: string; createdTime: string; size?: string; webViewLink?: string }>> {
    const query = encodeURIComponent("name contains 'LenDen_Khata_Backup' and trashed=false");
    const fields = encodeURIComponent('files(id,name,createdTime,size,webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=createdTime desc&pageSize=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch Google Drive backups');
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Download a backup JSON file content from Google Drive
   */
  async downloadBackupFromGoogleDrive(token: string, fileId: string): Promise<string> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to download backup file from Google Drive');
    }

    return await res.text();
  },
};
