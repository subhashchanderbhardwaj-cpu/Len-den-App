import React from 'react';
import { X, Printer, Share2, Download, CheckCircle2 } from 'lucide-react';
import { Account, Language, BusinessProfile } from '../types';
import { CalculatedTransaction, formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface StatementPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  transactions: CalculatedTransaction[];
  rangeText: string;
  language: Language;
  profile: BusinessProfile;
}

export const StatementPrintModal: React.FC<StatementPrintModalProps> = ({
  isOpen,
  onClose,
  account,
  transactions,
  rangeText,
  language,
  profile,
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  const totalReceived = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalGiven = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const netBalance = totalGiven - totalReceived;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const accTitle = account ? account.name : 'संयुक्त बहीखाता (Combined Ledger)';
    let text = `*📄 ${profile.businessName || 'खाता बही'} - स्टेटमेंट*\n`;
    text += `पार्टी: *${accTitle}*\n`;
    text += `अवधि: ${rangeText}\n`;
    text += `------------------------------------\n`;
    text += `कुल मिले (CR): ${formatCurrency(totalReceived, profile.currencySymbol)}\n`;
    text += `कुल दिए (DR): ${formatCurrency(totalGiven, profile.currencySymbol)}\n`;
    text += `नेट बैलेंस: ${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, profile.currencySymbol)} ${netBalance > 0 ? '(लेने हैं)' : netBalance < 0 ? '(देने हैं)' : '(चुकता)'}\n\n`;

    transactions.forEach((txn, i) => {
      text += `${i + 1}. ${formatDate(txn.date)} | ${txn.details} | ${txn.type === 'credit' ? 'CR +' : 'DR -'} ${profile.currencySymbol}${txn.amount} | Bal: ${txn.balanceText}\n`;
    });

    if (navigator.share) {
      navigator.share({ title: 'खाता पासबुक स्टेटमेंट', text }).catch(() => {});
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Controls Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm">खाता पासबुक प्रिंट प्रिव्यू (Statement Preview)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              id="printStatementBtn"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printStatement}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.shareWhatsapp}</span>
            </button>

            <button
              onClick={() => exportToCSV(transactions, account ? account.name : 'Statement')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs transition-colors"
              title="CSV Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white print:p-0 print:overflow-visible" id="printablePassbookStatement">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {profile.businessName || 'पर्सनल खाता बही'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {profile.ownerName} • 📞 {profile.phone || '-'} • 📍 {profile.place || 'भारत'}
              </p>
              {profile.upiId && (
                <p className="text-xs text-blue-700 font-semibold mt-0.5">
                  UPI ID: {profile.upiId}
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 uppercase tracking-wide">
                खाता पासबुक / Statement
              </div>
              <p className="text-xs text-slate-500 mt-1">
                जारी दिनांक: {formatDate(new Date().toISOString().split('T')[0])}
              </p>
            </div>
          </div>

          {/* Party & Period Information */}
          <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">खाताधारक / पार्टी:</span>
              <span className="font-bold text-slate-900 text-sm md:text-base">
                {account ? account.name : 'संयुक्त बहीखाता (सभी खाते)'}
              </span>
              {account?.place && <span className="text-slate-500 block">स्थान: {account.place}</span>}
              {account?.phone && <span className="text-slate-500 block">फोन: {account.phone}</span>}
            </div>

            <div className="text-right">
              <span className="text-slate-500 font-medium block">विवरण अवधि (Period):</span>
              <span className="font-bold text-slate-800 block text-xs md:text-sm">{rangeText}</span>
              <span className="text-slate-500 block mt-1">कुल प्रविष्टियां: {transactions.length}</span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-100/80 font-bold text-slate-700">
                  <th className="py-2.5 px-2">दिनांक (Date)</th>
                  <th className="py-2.5 px-2">खाता / पार्टी</th>
                  <th className="py-2.5 px-2">विवरण (Details)</th>
                  <th className="py-2.5 px-2 text-right text-emerald-700">मिले (CR +)</th>
                  <th className="py-2.5 px-2 text-right text-rose-700">दिए (DR -)</th>
                  <th className="py-2.5 px-2 text-right">बैलेंस (Balance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      कोई लेन-देन प्रविष्टि नहीं मिली।
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, idx) => (
                    <tr key={txn.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                        {formatDate(txn.date)}
                      </td>
                      <td className="py-2 px-2 font-semibold text-slate-900">
                        {txn.accountName}
                      </td>
                      <td className="py-2 px-2 text-slate-700 max-w-xs truncate">
                        {txn.details}
                        {txn.paymentMode && (
                          <span className="ml-1 text-[10px] text-slate-400 font-normal uppercase">
                            ({txn.paymentMode})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {txn.type === 'credit' ? `+${formatCurrency(txn.amount, profile.currencySymbol)}` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-rose-600 whitespace-nowrap">
                        {txn.type === 'debit' ? `-${formatCurrency(txn.amount, profile.currencySymbol)}` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-800 whitespace-nowrap">
                        {txn.balanceText}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-black text-xs md:text-sm">
                  <td colSpan={3} className="py-2.5 px-2">कुल योग (Total):</td>
                  <td className="py-2.5 px-2 text-right text-emerald-700">
                    +{formatCurrency(totalReceived, profile.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-rose-700">
                    -{formatCurrency(totalGiven, profile.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, profile.currencySymbol)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Net Closing Balance Card */}
          <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">अंतिम शुद्ध बकाया (Net Balance Due):</span>
              <div className="text-lg md:text-xl font-black mt-0.5">
                {formatCurrency(Math.abs(netBalance), profile.currencySymbol)}
                <span className="text-xs font-normal text-slate-300 ml-1.5">
                  {netBalance > 0 ? '(लेने बाकी हैं / Receivable)' : netBalance < 0 ? '(देने बाकी हैं / Payable)' : '(पूर्णतः चुकता / Settled)'}
                </span>
              </div>
            </div>
            {netBalance === 0 && (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>हिसाब साफ</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p>कंप्यूटरीकृत बहीखाता विवरण पत्र।</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Len Den Mobile Khata द्वारा निर्मित।</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
