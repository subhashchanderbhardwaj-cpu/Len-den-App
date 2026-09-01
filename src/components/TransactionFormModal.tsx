import React, { useState, useEffect } from 'react';
import { 
  X, Mic, MicOff, Camera, Trash2, CheckCircle2, 
  ArrowDownLeft, ArrowUpRight, Plus, Calculator
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account, Transaction, TransactionType, PaymentMode, Language, BusinessProfile } from '../types';
import { getTranslation } from '../utils/translations';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txnData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  accounts: Account[];
  initialAccount?: Account | null;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  language: Language;
  profile: BusinessProfile;
  onAddNewAccount: () => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  initialAccount,
  initialType = 'credit',
  editingTransaction,
  language,
  profile,
  onAddNewAccount,
}) => {
  const t = getTranslation(language);

  const [accountId, setAccountId] = useState<string>('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
  const [details, setDetails] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [billImage, setBillImage] = useState<string | undefined>(undefined);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [calcInput, setCalcInput] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setAccountId(editingTransaction.accountId);
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setDetails(editingTransaction.details || '');
      setPaymentMode(editingTransaction.paymentMode || 'cash');
      setBillImage(editingTransaction.billImage);
    } else {
      if (initialAccount) {
        setAccountId(initialAccount.id);
      } else if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
      setType(initialType);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setDetails('');
      setPaymentMode('cash');
      setBillImage(undefined);
    }
  }, [editingTransaction, initialAccount, initialType, isOpen]);

  if (!isOpen) return null;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleQuickTag = (tagText: string) => {
    if (!details) {
      setDetails(tagText);
    } else {
      setDetails(`${details}, ${tagText}`);
    }
  };

  // Voice to text using SpeechRecognition
  const toggleVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithSpeech = window as any;
    const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t.speechRecognitionNotSupported);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setDetails((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Image upload handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert(language === 'hi' ? 'कृपया 3MB से छोटी फोटो चुनें' : 'Please select image under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBillImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!accountId) {
      alert(language === 'hi' ? 'कृपया खाता चुनें' : 'Please select an account');
      return;
    }
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      alert(language === 'hi' ? 'कृपया सही राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);
    const accountName = selectedAcc ? selectedAcc.name : 'खाता';

    onSave(
      {
        accountId,
        accountName,
        date,
        time,
        details: details.trim() || (type === 'credit' ? 'पैसे मिले' : 'पैसे दिए'),
        type,
        amount: numAmount,
        paymentMode,
        billImage,
      },
      editingTransaction?.id
    );

    // Confetti effect on save
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    onClose();
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];
  const quickTags = [
    t.tagCashReceived,
    t.tagCashGiven,
    t.tagGoodsPurchased,
    t.tagGoodsSold,
    t.tagRent,
    t.tagSalary,
    t.tagOldBalance,
    t.tagOnlinePay,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden">
        {/* Modal Header */}
        <div className={`p-4 text-white flex items-center justify-between ${
          type === 'credit' 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
            : 'bg-gradient-to-r from-rose-600 to-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {type === 'credit' ? (
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            )}
            <h2 className="font-bold text-base md:text-lg">
              {editingTransaction ? t.editTransaction : t.newTransaction}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. Transaction Type Toggle (Big visually distinct buttons) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.transactionType} *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  type === 'credit'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{language === 'hi' ? 'पैसे मिले (CR +)' : 'Got / Received (+)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  type === 'debit'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{language === 'hi' ? 'पैसे दिए (DR -)' : 'Gave / Paid (-)'}</span>
              </button>
            </div>
          </div>

          {/* 2. Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t.selectAccount} *
              </label>
              <button
                type="button"
                onClick={onAddNewAccount}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addAccount}</span>
              </button>
            </div>

            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
              id="txnAccountSelectModal"
            >
              <option value="">-- {t.selectAccount} --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.place || 'भारत'})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Big Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t.amount} *
              </label>
              <button
                type="button"
                onClick={() => setShowCalc(!showCalc)}
                className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showCalc ? 'कैलकुलेटर बंद' : 'कैलकुलेटर'}</span>
              </button>
            </div>

            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg ${
                type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {profile.currencySymbol || '₹'}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full pl-9 pr-4 py-3 text-xl md:text-2xl font-black rounded-xl border focus:outline-none transition-all ${
                  type === 'credit'
                    ? 'border-emerald-300 text-emerald-700 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20'
                    : 'border-rose-300 text-rose-700 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
                }`}
                autoFocus
                required
                id="txnAmountInput"
              />
            </div>

            {/* Quick +Amount buttons */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">+ जोड़ें:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAddAmount(q)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-lg transition-all shrink-0"
                >
                  +{q}
                </button>
              ))}
            </div>

            {/* In-modal mini calculator helper */}
            {showCalc && (
              <div className="mt-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 mb-1 font-medium">त्वरित गणित (जैसे: 1500+250):</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="उदा. 500*3 या 1200+450"
                    className="flex-1 px-2.5 py-1 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        // eslint-disable-next-line no-eval
                        const res = Function(`'use strict'; return (${calcInput.replace(/[^-()\d/*+.]/g, '')})`)();
                        if (!isNaN(res)) {
                          setAmount(res.toString());
                          setCalcInput('');
                          setShowCalc(false);
                        }
                      } catch {
                        alert('अमान्य गणित गणना');
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg"
                  >
                    = गणना करें
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Date & Time Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.time}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 5. Narration / Details with Speech Mic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t.narration}
              </label>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`text-xs flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md transition-all ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                title="बोलकर लिखें / Voice typing"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3 text-rose-600" />
                    <span>{t.voiceListening}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-blue-600" />
                    <span>बोलकर लिखें (Voice)</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.narrationPlaceholder}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="txnNarrationInput"
            />

            {/* Quick Tag Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTag(tag)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] rounded-md transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Payment Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.paymentMode}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: t.modeCash, icon: '💵' },
                { id: 'upi', label: t.modeUpi, icon: '📱' },
                { id: 'bank', label: t.modeBank, icon: '🏦' },
                { id: 'cheque', label: t.modeCheque, icon: '📜' },
                { id: 'other', label: t.modeOther, icon: '🏷️' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMode(m.id as PaymentMode)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                    paymentMode === m.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 7. Bill / Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.attachBill}
            </label>
            {billImage ? (
              <div className="relative rounded-xl border border-slate-300 p-1.5 bg-slate-50 flex items-center gap-2">
                <img
                  src={billImage}
                  alt="Bill receipt"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {language === 'hi' ? 'बिल रसीद फोटो संलग्न' : 'Bill photo attached'}
                  </p>
                  <label className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold inline-block mt-0.5">
                    <span>{t.changeBill}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setBillImage(undefined)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  title={t.removeBill}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors text-xs font-semibold text-slate-600">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{t.uploadBill}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'credit'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
              id="saveTransactionSubmitBtn"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingTransaction ? t.updateTransaction : t.saveTransaction}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
