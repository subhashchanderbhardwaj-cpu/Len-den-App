import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Phone, MapPin, Calendar, Tag, FileText } from 'lucide-react';
import { Account, AccountCategory, Language, BusinessProfile } from '../types';
import { getTranslation } from '../utils/translations';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Omit<Account, 'id' | 'createdAt'>, existingId?: string) => void;
  editingAccount?: Account | null;
  language: Language;
  profile: BusinessProfile;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-cyan-600',
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAccount,
  language,
}) => {
  const t = getTranslation(language);

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [place, setPlace] = useState<string>('');
  const [openingDate, setOpeningDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<AccountCategory>('customer');
  const [notes, setNotes] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setPhone(editingAccount.phone || '');
      setPlace(editingAccount.place || '');
      setOpeningDate(editingAccount.openingDate || new Date().toISOString().split('T')[0]);
      setCategory(editingAccount.category || 'customer');
      setNotes(editingAccount.notes || '');
      setAvatarColor(editingAccount.avatarColor || AVATAR_COLORS[0]);
    } else {
      setName('');
      setPhone('');
      setPlace('');
      setOpeningDate(new Date().toISOString().split('T')[0]);
      setCategory('customer');
      setNotes('');
      // Random color
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'hi' ? 'कृपया खातेदार का नाम दर्ज करें' : 'Please enter party name');
      return;
    }

    onSave(
      {
        name: name.trim(),
        phone: phone.trim(),
        place: place.trim() || (language === 'hi' ? 'जयपुर' : 'Local'),
        openingDate,
        category,
        notes: notes.trim(),
        avatarColor,
      },
      editingAccount?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingAccount ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <h2 className="font-bold text-base md:text-lg">
              {editingAccount ? t.editAccount : t.addAccount}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.ownerName} / {language === 'hi' ? 'पार्टी का नाम' : 'Party Name'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. राम शर्मा / सुनील ट्रेडर्स"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              autoFocus
              id="accNameInput"
            />
          </div>

          {/* Place & Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.location}</span>
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="उदा. जयपुर / दिल्ली"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                id="accPlaceInput"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.phone}</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                id="accPhoneInput"
              />
            </div>
          </div>

          {/* Category & Opening Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'hi' ? 'खाता श्रेणी' : 'Category'}</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AccountCategory)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="customer">{t.catCustomer}</option>
                <option value="supplier">{t.catSupplier}</option>
                <option value="friend">{t.catFriend}</option>
                <option value="family">{t.catFamily}</option>
                <option value="staff">{t.catStaff}</option>
                <option value="other">{t.catOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.openingDate}</span>
              </label>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.notes}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. नियमित ग्राहक, 15 दिन की उधारी"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              {language === 'hi' ? 'रंग चुनें' : 'Card Color'}
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-6 h-6 rounded-full ${c} transition-transform ${
                    avatarColor === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs md:text-sm hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-md shadow-blue-600/30"
              id="saveAccountSubmitBtn"
            >
              {editingAccount ? t.editAccount : t.addAccount}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
