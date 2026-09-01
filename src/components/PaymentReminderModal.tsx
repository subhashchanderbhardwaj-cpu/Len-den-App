import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, QrCode, Phone, Bell } from 'lucide-react';
import { Account, Language, BusinessProfile } from '../types';
import { generateWhatsAppReminder, formatCurrency } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface PaymentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  balance: number;
  language: Language;
  profile: BusinessProfile;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  isOpen,
  onClose,
  account,
  balance,
  language,
  profile,
}) => {
  const t = getTranslation(language);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !account) return null;

  const reminderText = generateWhatsAppReminder(account, balance, profile, language);

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = account.phone ? account.phone.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    
    let url = '';
    if (cleanPhone) {
      url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderText)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(reminderText)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-bold text-base md:text-lg">{t.reminderTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-4">
          {/* Party and Amount Summary */}
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 font-medium block">{account.name}</span>
              <span className="text-lg font-black text-amber-900">
                {formatCurrency(Math.abs(balance), profile.currencySymbol)}
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                {balance > 0 ? t.balanceToGet : t.balanceToGive}
              </span>
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              संदेश प्रिव्यू (WhatsApp Message):
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {reminderText}
            </div>
          </div>

          {/* UPI ID note */}
          {profile.upiId && (
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
              <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                UPI ID <code className="font-bold bg-white px-1 py-0.5 rounded border border-blue-200">{profile.upiId}</code> संदेश में शामिल है।
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.copied : t.copyText}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.sendViaWhatsapp}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
