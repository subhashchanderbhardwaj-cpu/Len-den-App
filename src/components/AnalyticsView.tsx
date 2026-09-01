import React from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Wallet, 
  Users, CreditCard, PieChart, ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';
import { Account, Transaction, Language, BusinessProfile } from '../types';
import { getAccountBalance, formatCurrency } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface AnalyticsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  language: Language;
  profile: BusinessProfile;
  onSelectAccount: (account: Account) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  accounts,
  transactions,
  language,
  profile,
  onSelectAccount,
}) => {
  const t = getTranslation(language);

  // Overall aggregates
  const totalReceived = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalGiven = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Account balances ranking
  const accountBalances = accounts.map((acc) => {
    const bal = getAccountBalance(acc.id, transactions);
    return { account: acc, balance: bal };
  });

  const topDebtors = accountBalances
    .filter((a) => a.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  const topCreditors = accountBalances
    .filter((a) => a.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 5);

  // Payment mode distribution
  const paymentModes: Record<string, number> = transactions.reduce((acc, txn) => {
    const mode = txn.paymentMode || 'cash';
    acc[mode] = (acc[mode] || 0) + Number(txn.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const totalPaymentVolume: number = (Object.values(paymentModes) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;

  // Monthly breakdown (last 6 months)
  const monthlyStats = transactions.reduce((acc, txn) => {
    const month = txn.date.slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { credit: 0, debit: 0 };
    }
    if (txn.type === 'credit') acc[month].credit += Number(txn.amount || 0);
    if (txn.type === 'debit') acc[month].debit += Number(txn.amount || 0);
    return acc;
  }, {} as Record<string, { credit: number; debit: number }>);

  const sortedMonths = Object.keys(monthlyStats).sort().slice(-6);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base md:text-lg leading-tight">
              {t.cashflowOverview}
            </h2>
            <p className="text-xs text-blue-100/90">
              {accounts.length} {t.partiesCount} • {transactions.length} लेन-देन
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
            <span className="text-xs text-emerald-200 font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {t.totalIn}
            </span>
            <div className="text-lg md:text-xl font-black text-white mt-1">
              {formatCurrency(totalReceived, profile.currencySymbol)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
            <span className="text-xs text-rose-200 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {t.totalOut}
            </span>
            <div className="text-lg md:text-xl font-black text-white mt-1">
              {formatCurrency(totalGiven, profile.currencySymbol)}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Bar Trend */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>{t.monthlyTrend}</span>
        </h3>

        {sortedMonths.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{t.noTransactionsFound}</p>
        ) : (
          <div className="space-y-3">
            {sortedMonths.map((m) => {
              const data = monthlyStats[m];
              const maxVal = Math.max(data.credit, data.debit, 1);
              const creditPct = Math.min(100, Math.round((data.credit / maxVal) * 100));
              const debitPct = Math.min(100, Math.round((data.debit / maxVal) * 100));

              return (
                <div key={m} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{m}</span>
                    <span className="text-[11px] text-slate-400">
                      CR: {formatCurrency(data.credit, profile.currencySymbol)} | DR: {formatCurrency(data.debit, profile.currencySymbol)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Inflow Bar */}
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${creditPct}%` }}
                      />
                    </div>
                    {/* Outflow Bar */}
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${debitPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Parties To Receive From */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          <span>{language === 'hi' ? 'जिनसे सबसे ज्यादा पैसे लेने हैं' : 'Top Receivable Accounts'}</span>
        </h3>
        
        {topDebtors.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">कोई बकाया नहीं है (All settled)</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {topDebtors.map(({ account, balance }) => (
              <div
                key={account.id}
                onClick={() => onSelectAccount(account)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-xs md:text-sm text-slate-900">{account.name}</h4>
                  <p className="text-[11px] text-slate-400">{account.place || 'भारत'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-sm">
                    +{formatCurrency(balance, profile.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-medium">लेने हैं</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Parties To Pay */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
          <span>{language === 'hi' ? 'जिन्हें सबसे ज्यादा पैसे देने हैं' : 'Top Payable Accounts'}</span>
        </h3>

        {topCreditors.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">किसी को देने बाकी नहीं हैं (No payables)</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {topCreditors.map(({ account, balance }) => (
              <div
                key={account.id}
                onClick={() => onSelectAccount(account)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl px-2 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-xs md:text-sm text-slate-900">{account.name}</h4>
                  <p className="text-[11px] text-slate-400">{account.place || 'भारत'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-600 text-sm">
                    -{formatCurrency(Math.abs(balance), profile.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-rose-700 block font-medium">देने हैं</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modes Distribution */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>{t.paymentModeShare}</span>
        </h3>

        <div className="space-y-2">
          {Object.entries(paymentModes).map(([mode, amt]) => {
            const pct = Math.round((amt / totalPaymentVolume) * 100);
            return (
              <div key={mode} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="uppercase">{mode}</span>
                  <span>{formatCurrency(amt, profile.currencySymbol)} ({pct}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
