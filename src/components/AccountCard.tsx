import React from 'react';
import { Phone, MessageSquare, ChevronRight, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { Account, Transaction, Language, BusinessProfile } from '../types';
import { getAccountBalance, formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface AccountCardProps {
  account: Account;
  transactions: Transaction[];
  language: Language;
  profile: BusinessProfile;
  onClick: () => void;
  onQuickAddCredit: (account: Account) => void;
  onQuickAddDebit: (account: Account) => void;
  onSendReminder: (account: Account, balance: number) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  transactions,
  language,
  profile,
  onClick,
  onQuickAddCredit,
  onQuickAddDebit,
  onSendReminder,
}) => {
  const t = getTranslation(language);
  const balance = getAccountBalance(account.id, transactions);
  
  // Find last transaction
  const partyTxns = transactions
    .filter((txn) => txn.accountId === account.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastTxn = partyTxns[0];

  const isReceive = balance > 0; // Lena hai
  const isGive = balance < 0;    // Dena hai
  const isSettled = balance === 0;

  // Category labels
  const getCategoryBadge = () => {
    switch (account.category) {
      case 'customer':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{t.catCustomer}</span>;
      case 'supplier':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">{t.catSupplier}</span>;
      case 'friend':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">{t.catFriend}</span>;
      case 'staff':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">{t.catStaff}</span>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div 
      className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group mb-2.5 relative overflow-hidden"
      onClick={onClick}
      id={`account-card-${account.id}`}
    >
      {/* Top section: Avatar, Name, Location, Balance */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-2xl ${account.avatarColor || 'bg-blue-600'} text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0`}>
            {getInitials(account.name)}
          </div>

          {/* Name & Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-sm md:text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                {account.name}
              </h3>
              {getCategoryBadge()}
            </div>
            
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>📍 {account.place || 'भारत'}</span>
              {account.phone && <span>• 📞 {account.phone}</span>}
            </p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-right shrink-0">
          <div className="text-sm md:text-base font-bold">
            {isReceive && (
              <div className="text-emerald-600 flex items-center justify-end gap-0.5">
                <span>{formatCurrency(balance, profile.currencySymbol)}</span>
              </div>
            )}
            {isGive && (
              <div className="text-rose-600 flex items-center justify-end gap-0.5">
                <span>{formatCurrency(Math.abs(balance), profile.currencySymbol)}</span>
              </div>
            )}
            {isSettled && (
              <div className="text-slate-500 flex items-center justify-end gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{profile.currencySymbol} 0</span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-medium mt-0.5">
            {isReceive && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold">
                {t.balanceToGet} (CR)
              </span>
            )}
            {isGive && (
              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md font-semibold">
                {t.balanceToGive} (DR)
              </span>
            )}
            {isSettled && (
              <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {t.settled}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Last transaction info */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="truncate pr-2">
          {lastTxn ? (
            <span>
              <span className="text-slate-400">{formatDate(lastTxn.date)}: </span>
              <span className="font-medium text-slate-700">{lastTxn.details || 'लेन-देन'}</span>
              <span className={`ml-1 font-semibold ${lastTxn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({lastTxn.type === 'credit' ? '+ ' : '- '}{formatCurrency(lastTxn.amount, profile.currencySymbol)})
              </span>
            </span>
          ) : (
            <span className="italic text-slate-400">{t.openingDate}: {formatDate(account.openingDate)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <span className="text-[11px] font-medium text-blue-600 group-hover:underline">
            {t.viewPassbook}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
        </div>
      </div>

      {/* Bottom Action strip */}
      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
        {/* Call & WhatsApp buttons */}
        <div className="flex items-center gap-1.5">
          {account.phone && (
            <>
              <a
                href={`tel:${account.phone}`}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                title={t.callParty}
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
              </a>

              <a
                href={`https://wa.me/91${account.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                title={t.whatsappParty}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            </>
          )}

          {isReceive && (
            <button
              onClick={() => onSendReminder(account, balance)}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium transition-colors border border-amber-200"
            >
              🔔 {t.sendReminder}
            </button>
          )}
        </div>

        {/* Quick + / - entry shortcuts */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuickAddCredit(account)}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors border border-emerald-200"
            title={t.moneyReceived}
          >
            <ArrowDownLeft className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            <span>+ मिले (CR)</span>
          </button>

          <button
            onClick={() => onQuickAddDebit(account)}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors border border-rose-200"
            title={t.moneyGiven}
          >
            <ArrowUpRight className="w-3 h-3 text-rose-600 stroke-[2.5]" />
            <span>- दिए (DR)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
