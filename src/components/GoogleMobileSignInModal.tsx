import React from 'react';
import { 
  FileSpreadsheet, ShieldCheck, ArrowRight, X, 
  Sparkles, Smartphone, Check, Loader2 
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface GoogleMobileSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  isLoading: boolean;
  language: Language;
}

export const GoogleMobileSignInModal: React.FC<GoogleMobileSignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  isLoading,
  language,
}) => {
  if (!isOpen) return null;
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner with Google Drive / Sheet motif */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 text-white p-6 text-center">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white p-2.5 shadow-lg flex items-center justify-center mb-3">
            {/* Google Sheets SVG Icon */}
            <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
              <path d="M28 4H12C9.79 4 8 5.79 8 8V40C8 42.21 9.79 44 12 44H36C38.21 44 40 42.21 40 40V16L28 4Z" fill="#0F9D58"/>
              <path d="M28 4V16H40L28 4Z" fill="#87CEAC"/>
              <path d="M16 22H32V26H16V22ZM16 30H32V34H16V30Z" fill="white"/>
            </svg>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-2 border border-white/20">
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {language === 'hi' ? 'मोबाइल फर्स्ट बैकअप' : 'Mobile First Cloud Sync'}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {language === 'hi' ? 'Google खाता लिंक करें' : 'Connect Google Account'}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
            {language === 'hi'
              ? 'आपके मोबाइल लेन-देन के लिए ऑटोमैटिक Google Sheet डिजिटल बहीखाता'
              : 'Auto-create and maintain your digital ledger directly in Google Sheets'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-5 space-y-3.5">
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="font-bold text-emerald-950 block">
                  {language === 'hi' ? 'Google Sheet बहीखाता निर्माण' : 'Instant Google Spreadsheet Creation'}
                </span>
                <span className="text-emerald-800/80 text-[11px]">
                  {language === 'hi'
                    ? 'पहली बार लॉगिन करते ही आपके Google Drive में खाता तैयार होगा।'
                    : 'A dedicated spreadsheet is automatically created in your Google Drive.'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="font-bold text-blue-950 block">
                  {language === 'hi' ? '100% सुरक्षित और ऑटोमैटिक सिंक' : 'Secure & Always Accessible'}
                </span>
                <span className="text-blue-800/80 text-[11px]">
                  {language === 'hi'
                    ? 'मोबाइल खोने या बदलने पर भी आपका पूरा हिसाब-किताब सुरक्षित रहेगा।'
                    : 'Access your Khata book from any laptop, mobile or Excel anytime.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              id="googleMobileSignInBtn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>
                    {language === 'hi' ? 'Google Sheet तैयार हो रही है...' : 'Creating Google Sheet...'}
                  </span>
                </>
              ) : (
                <>
                  {/* Google "G" icon */}
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.15 7.15 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>
                    {language === 'hi' ? 'Google खाते से साइन इन करें' : 'Sign in with Google Account'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors"
            >
              {language === 'hi' ? 'अभी नहीं (बाद में करें)' : 'Skip for now (Continue offline)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
