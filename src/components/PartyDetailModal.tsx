import React, { useState } from 'react';
import { 
  X, Phone, MessageSquare, ArrowDownLeft, ArrowUpRight, 
  Printer, Trash2, Edit, CheckCircle2, AlertCircle, 
  Calendar, FileSpreadsheet, Share2, Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account, Transaction, Language, BusinessProfile } from '../types';
import { 
  getAccountBalance, 
  formatCurrency, 
  formatDate, 
  calculateRunningBalances, 
  CalculatedTransaction 
} from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface PartyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  transactions: Transaction[];
  language: Language;
  profile: BusinessProfile;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddTransactionForAccount: (account: Account, type: 'credit' | 'debit') => void;
  onEditTransaction: (txn: Transaction) => void;
  onDeleteTransaction: (txnId: string) => void;
  onOpenStatementPrint: (account: Account, txns: CalculatedTransaction[]) => void;
  onSendReminder: (account: Account, balance: number) => void;
  onSettleFullBalance: (account: Account, currentBalance: number) => void;
}

export const PartyDetailModal: React.FC<PartyDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  transactions,
  language,
  profile,
  onEditAccount,
  onDeleteAccount,
  onAddTransactionForAccount,
  onEditTransaction,
  onDeleteTransaction,
  onOpenStatementPrint,
  onSendReminder,
  onSettleFullBalance,
}) => {
  const t = getTranslation(language);
  const [selectedBillImage, setSelectedBillImage] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const partyTxns = transactions.filter((t) => t.accountId === account.id);
  const runningCalculated = calculateRunningBalances(partyTxns, language, profile.currencySymbol);
  // Display latest first in list
  const displayTxns = [...runningCalculated].reverse();

  const currentBalance = getAccountBalance(account.id, transactions);
  const totalReceived = partyTxns.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalGiven = partyTxns.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);

  const isReceive = currentBalance > 0;
  const isGive = currentBalance < 0;
  const isSettled = currentBalance === 0;

  const handleSettle = () => {
    if (isSettled) {
      alert(language === 'hi' ? 'खाता पहले से चुकता है (₹0)' : 'Account is already settled (₹0)');
      return;
    }
    const confirmMsg = language === 'hi'
      ? `क्या आप ${account.name} का कुल ${formatCurrency(Math.abs(currentBalance), profile.currencySymbol)} का हिसाब चुकता करना चाहते हैं?`
      : `Do you want to settle the full balance of ${formatCurrency(Math.abs(currentBalance), profile.currencySymbol)} for ${account.name}?`;

    if (window.confirm(confirmMsg)) {
      onSettleFullBalance(account, currentBalance);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm(`${t.confirmDeleteAccount} (${account.name})`)) {
      onDeleteAccount(account.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 shrink-0 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${account.avatarColor || 'bg-blue-800'} border-2 border-white/30 text-white font-black text-lg flex items-center justify-center shadow-md`}>
                {account.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-lg md:text-xl leading-tight">
                  {account.name}
                </h2>
                <p className="text-xs text-blue-100/90 mt-0.5 flex items-center gap-2">
                  <span>📍 {account.place || 'भारत'}</span>
                  {account.phone && <span>• 📞 {account.phone}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEditAccount(account)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                title={t.editAccount}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteAccount}
                className="p-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 transition-colors"
                title={t.deleteAccount}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Outstanding Balance Banner */}
          <div className="mt-3.5 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-100 font-medium block">
                {language === 'hi' ? 'वर्तमान शुद्ध बकाया (Net Balance)' : 'Current Outstanding Balance'}
              </span>
              <div className="text-xl md:text-2xl font-black mt-0.5 flex items-center gap-1.5">
                {isReceive && <span className="text-emerald-300">+{formatCurrency(currentBalance, profile.currencySymbol)}</span>}
                {isGive && <span className="text-rose-300">-{formatCurrency(Math.abs(currentBalance), profile.currencySymbol)}</span>}
                {isSettled && <span className="text-white flex items-center gap-1"><CheckCircle2 className="w-5 h-5 text-emerald-300" /> {profile.currencySymbol} 0 (हिसाब साफ)</span>}
              </div>
            </div>

            <div className="text-right">
              {isReceive && (
                <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {t.balanceToGet} (CR)
                </span>
              )}
              {isGive && (
                <span className="inline-block bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {t.balanceToGive} (DR)
                </span>
              )}
              {isSettled && (
                <span className="inline-block bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {t.settled}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {account.phone && (
              <a
                href={`tel:${account.phone}`}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t.callParty}</span>
              </a>
            )}

            {account.phone && (
              <a
                href={`https://wa.me/91${account.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t.whatsappParty}</span>
              </a>
            )}

            <button
              onClick={() => onSendReminder(account, currentBalance)}
              className="px-3 py-1.5 bg-amber-500/80 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.sendReminder}</span>
            </button>

            {!isSettled && (
              <button
                onClick={handleSettle}
                className="px-3 py-1.5 bg-white text-blue-800 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-sm ml-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.settleAccount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Totals Summary Row */}
        <div className="bg-white px-4 py-2.5 border-b border-slate-200 grid grid-cols-2 gap-2 text-center text-xs font-medium shrink-0">
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-slate-500 text-[11px] block">{t.totalIn}</span>
            <span className="text-emerald-700 font-bold text-sm">
              +{formatCurrency(totalReceived, profile.currencySymbol)}
            </span>
          </div>
          <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
            <span className="text-slate-500 text-[11px] block">{t.totalOut}</span>
            <span className="text-rose-700 font-bold text-sm">
              -{formatCurrency(totalGiven, profile.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Passbook Transactions List */}
        <div className="p-3 md:p-4 flex-1 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">
              {language === 'hi' ? 'लेन-देन इतिहास (Ledger Entries)' : 'Transaction History'} ({displayTxns.length})
            </span>
            <button
              onClick={() => onOpenStatementPrint(account, runningCalculated)}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printStatement}</span>
            </button>
          </div>

          {displayTxns.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">{t.noTransactionsFound}</p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'नीचे दिए गए बटन से पहला लेन-देन जोड़ें' : 'Add the first entry using buttons below'}
              </p>
            </div>
          ) : (
            displayTxns.map((txn) => {
              const isCredit = txn.type === 'credit';
              return (
                <div
                  key={txn.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 text-xs md:text-sm truncate">
                          {txn.details}
                        </span>
                        {txn.paymentMode && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 uppercase">
                            {txn.paymentMode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(txn.date)} {txn.time ? `• ${txn.time}` : ''}
                        </span>
                        {txn.billImage && (
                          <button
                            type="button"
                            onClick={() => setSelectedBillImage(txn.billImage || null)}
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            📷 {language === 'hi' ? 'बिल देखें' : 'View Bill'}
                          </button>
                        )}
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        <span>{t.runningBalance}: </span>
                        <span className={`font-semibold ${
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
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1 mt-1.5">
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
            })
          )}
        </div>

        {/* Bottom Fast Action Bar (Add Credit / Debit directly for this account) */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2.5 shrink-0 shadow-lg">
          <button
            onClick={() => onAddTransactionForAccount(account, 'credit')}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-98 transition-all"
            id="partyDetailAddCreditBtn"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>+ {language === 'hi' ? 'पैसे मिले (CR)' : 'Got / Received (+)'}</span>
          </button>

          <button
            onClick={() => onAddTransactionForAccount(account, 'debit')}
            className="flex-1 py-3 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-98 transition-all"
            id="partyDetailAddDebitBtn"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>- {language === 'hi' ? 'पैसे दिए (DR)' : 'Gave / Paid (-)'}</span>
          </button>
        </div>

        {/* Bill Image Viewer Modal */}
        {selectedBillImage && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedBillImage(null)}>
            <div className="bg-white rounded-2xl p-3 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">रसीद / बिल फोटो</h3>
                <button onClick={() => setSelectedBillImage(null)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img src={selectedBillImage} alt="Receipt" className="w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
