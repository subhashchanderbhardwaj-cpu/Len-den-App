import React, { useState, useMemo } from 'react';
import { 
  FileText, Calendar, Filter, Printer, Share2, 
  Download, ArrowDownLeft, ArrowUpRight, Search, 
  ChevronRight, Edit, Trash2, CheckCircle2 
} from 'lucide-react';
import { Account, Transaction, Language, BusinessProfile, DateRangePreset } from '../types';
import { 
  calculateRunningBalances, 
  formatCurrency, 
  formatDate, 
  CalculatedTransaction,
  exportToCSV
} from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface PassbookViewProps {
  accounts: Account[];
  transactions: Transaction[];
  language: Language;
  profile: BusinessProfile;
  onEditTransaction: (txn: Transaction) => void;
  onDeleteTransaction: (txnId: string) => void;
  onOpenStatementPrint: (account: Account | null, txns: CalculatedTransaction[], rangeText: string) => void;
  onSelectAccountDetail: (account: Account) => void;
}

export const PassbookView: React.FC<PassbookViewProps> = ({
  accounts,
  transactions,
  language,
  profile,
  onEditTransaction,
  onDeleteTransaction,
  onOpenStatementPrint,
  onSelectAccountDetail,
}) => {
  const t = getTranslation(language);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date range filter calculation
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return transactions.filter((txn) => {
      // 1. Account Filter
      if (selectedAccountId !== 'all' && txn.accountId !== selectedAccountId) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = txn.accountName.toLowerCase().includes(q);
        const matchDetails = (txn.details || '').toLowerCase().includes(q);
        if (!matchName && !matchDetails) return false;
      }

      // 3. Date Range Filter
      const txnDate = txn.date;
      if (datePreset === 'all') return true;

      if (datePreset === 'today') {
        return txnDate === todayStr;
      }

      if (datePreset === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        return txnDate >= weekAgoStr && txnDate <= todayStr;
      }

      if (datePreset === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        return txnDate >= startOfMonth && txnDate <= todayStr;
      }

      if (datePreset === 'lastMonth') {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        return txnDate >= startOfLastMonth && txnDate <= endOfLastMonth;
      }

      if (datePreset === 'custom') {
        if (customStartDate && txnDate < customStartDate) return false;
        if (customEndDate && txnDate > customEndDate) return false;
        return true;
      }

      return true;
    });
  }, [transactions, selectedAccountId, datePreset, customStartDate, customEndDate, searchQuery]);

  // Compute Running Balances
  const calculatedTransactions = useMemo(() => {
    return calculateRunningBalances(filteredTransactions, language, profile.currencySymbol);
  }, [filteredTransactions, language, profile.currencySymbol]);

  // Totals for this period
  const totalReceived = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const totalGiven = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const netBalance = totalGiven - totalReceived;

  const currentSelectedAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  const getRangeLabel = () => {
    if (datePreset === 'all') return t.rangeAll;
    if (datePreset === 'today') return t.rangeToday;
    if (datePreset === 'week') return t.rangeThisWeek;
    if (datePreset === 'month') return t.rangeThisMonth;
    if (datePreset === 'lastMonth') return t.rangeLastMonth;
    return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
  };

  const handleExportCSV = () => {
    const accName = currentSelectedAccount ? currentSelectedAccount.name : 'Combined_Ledger';
    exportToCSV(calculatedTransactions, accName);
  };

  const handleShareWhatsAppSummary = () => {
    const accTitle = currentSelectedAccount ? currentSelectedAccount.name : 'संयुक्त खाता बही (Combined)';
    let msg = `*📊 ${profile.businessName || 'लेन-देन खाता'} - पासबुक रिपोर्ट*\n`;
    msg += `👤 खाता: *${accTitle}*\n`;
    msg += `📅 अवधि: ${getRangeLabel()}\n`;
    msg += `--------------------------------\n`;
    msg += `🟢 कुल मिले (CR): ${formatCurrency(totalReceived, profile.currencySymbol)}\n`;
    msg += `🔴 कुल दिए (DR): ${formatCurrency(totalGiven, profile.currencySymbol)}\n`;
    msg += `⚖️ शुद्ध स्थिति: ${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, profile.currencySymbol)} ${netBalance > 0 ? '(लेने हैं)' : netBalance < 0 ? '(देने हैं)' : '(चुकता)'}\n\n`;
    
    // Top 5 entries
    msg += `*हालिया लेन-देन:* \n`;
    const recent = [...calculatedTransactions].reverse().slice(0, 8);
    recent.forEach((t, idx) => {
      const sign = t.type === 'credit' ? '+ CR' : '- DR';
      msg += `${idx + 1}. ${formatDate(t.date)} | ${t.accountName} | ${t.details} | ${sign} ${profile.currencySymbol}${t.amount}\n`;
    });

    if (calculatedTransactions.length > 8) {
      msg += `...और ${calculatedTransactions.length - 8} अन्य लेन-देन।\n`;
    }

    if (navigator.share) {
      navigator.share({ title: 'खाता पासबुक', text: msg }).catch(() => {});
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-3.5 pb-24 animate-in fade-in duration-150">
      {/* Top Filter Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                {t.passbookReport}
              </h2>
              <p className="text-xs text-slate-500">{t.selectAccountToView}</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenStatementPrint(currentSelectedAccount, calculatedTransactions, getRangeLabel())}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title={t.printStatement}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareWhatsAppSummary}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
              title={t.shareWhatsapp}
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
              title={t.exportCsv}
            >
              <Download className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* 1. Account Dropdown Selector */}
        <div className="mb-3">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            id="passbookAccountSelector"
          >
            <option value="all">📁 {t.allAccounts}</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                👤 {acc.name} ({acc.place || 'भारत'})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Date Range Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs font-semibold">
          {[
            { id: 'today', label: t.rangeToday },
            { id: 'week', label: t.rangeThisWeek },
            { id: 'month', label: t.rangeThisMonth },
            { id: 'lastMonth', label: t.rangeLastMonth },
            { id: 'all', label: t.rangeAll },
            { id: 'custom', label: t.rangeCustom },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id as DateRangePreset)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                datePreset === preset.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs if selected */}
        {datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">{t.fromDate}</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">{t.toDate}</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats Card */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-medium text-emerald-800 block truncate">{t.totalIn}</span>
          <span className="text-sm md:text-base font-black text-emerald-700 block mt-0.5">
            +{formatCurrency(totalReceived, profile.currencySymbol)}
          </span>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-medium text-rose-800 block truncate">{t.totalOut}</span>
          <span className="text-sm md:text-base font-black text-rose-700 block mt-0.5">
            -{formatCurrency(totalGiven, profile.currencySymbol)}
          </span>
        </div>

        <div className={`rounded-2xl p-3 text-center border ${
          netBalance > 0 
            ? 'bg-emerald-100/60 border-emerald-300' 
            : netBalance < 0 
            ? 'bg-rose-100/60 border-rose-300' 
            : 'bg-slate-100 border-slate-200'
        }`}>
          <span className="text-[11px] font-medium text-slate-700 block truncate">{t.netChange}</span>
          <span className={`text-sm md:text-base font-black block mt-0.5 ${
            netBalance > 0 ? 'text-emerald-800' : netBalance < 0 ? 'text-rose-800' : 'text-slate-700'
          }`}>
            {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance, profile.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Entries List Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700">
          {language === 'hi' ? 'पासबुक प्रविष्टियां (Entries)' : 'Passbook Entries'} ({calculatedTransactions.length})
        </span>
        <span className="text-xs text-slate-400 font-medium">
          {getRangeLabel()}
        </span>
      </div>

      {/* Transactions Feed / Table */}
      {calculatedTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">{t.noTransactionsFound}</p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hi' ? 'अवधि बदलें या नया लेन-देन दर्ज करें' : 'Change date filter or add a new transaction'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {calculatedTransactions.slice().reverse().map((txn) => {
            const isCredit = txn.type === 'credit';
            return (
              <div
                key={txn.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isCredit ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {txn.accountName}
                      </span>
                      {txn.paymentMode && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                          {txn.paymentMode}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      {txn.details}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>📅 {formatDate(txn.date)} {txn.time ? `• ${txn.time}` : ''}</span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      <span>बैलेंस: </span>
                      <span className={`font-bold ${
                        txn.balanceType === 'get' ? 'text-emerald-600' : txn.balanceType === 'give' ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {txn.balanceText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-black text-sm md:text-base ${
                    isCredit ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isCredit ? '+' : '-'}{formatCurrency(txn.amount, profile.currencySymbol)}
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-2">
                    <button
                      onClick={() => onEditTransaction(txn)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                      title={t.editTxn}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t.confirmDeleteTxn)) {
                          onDeleteTransaction(txn.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                      title={t.deleteTxn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
