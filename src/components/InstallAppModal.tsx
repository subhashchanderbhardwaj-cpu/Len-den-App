import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, Check, X, 
  ExternalLink, Sparkles, Shield, WifiOff, 
  Layers, ArrowRight, Share2, MoreVertical 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deferredPrompt: any;
  onInstalledSuccess: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  language,
  deferredPrompt,
  onInstalledSuccess,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAndroid, setIsAndroid] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/i.test(ua));
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onInstalledSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-5 text-center">
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Icon Preview */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white p-1.5 shadow-xl ring-4 ring-white/20 flex items-center justify-center mb-3">
            <img 
              src="/icon.svg" 
              alt="Len Den Khata App Icon" 
              className="w-full h-full rounded-xl object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-2 border border-white/20">
            <Smartphone className="w-3.5 h-3.5 text-blue-200" />
            <span>
              {language === 'hi' ? 'एंड्रॉइड मोबाइल ऐप (Android PWA)' : 'Android Mobile App (PWA)'}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {language === 'hi' ? 'Len Den Khata ऐप इंस्टॉल करें' : 'Install Len Den Khata App'}
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xs mx-auto">
            {language === 'hi' 
              ? 'बिना प्ले स्टोर के सीधे अपने एंड्रॉइड फोन में इंस्टॉल करें' 
              : 'Directly install as a native app on your Android phone'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-5 space-y-4">
          {/* App Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">
                {language === 'hi' ? 'फुल स्क्रीन' : 'Full Screen'}
              </span>
              <span className="text-[10px] text-slate-500">
                {language === 'hi' ? 'बिना ब्राउज़र बार' : 'No URL bar'}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                <WifiOff className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">
                {language === 'hi' ? '100% ऑफलाइन' : '100% Offline'}
              </span>
              <span className="text-[10px] text-slate-500">
                {language === 'hi' ? 'इंटरनेट के बिना' : 'Works offline'}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 block">
                {language === 'hi' ? 'सुपर फ़ास्ट' : 'Instant Open'}
              </span>
              <span className="text-[10px] text-slate-500">
                {language === 'hi' ? 'होम स्क्रीन से' : 'From Launcher'}
              </span>
            </div>
          </div>

          {/* If Native 1-Tap prompt is available */}
          {deferredPrompt ? (
            <div className="space-y-2.5">
              <button
                onClick={handleNativeInstall}
                disabled={isInstalling}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                id="nativeInstallAndroidBtn"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {language === 'hi' ? 'अभी एंड्रॉइड फोन में इंस्टॉल करें' : 'Install on Android Phone Now'}
                </span>
              </button>
              <p className="text-[11px] text-center text-slate-500">
                {language === 'hi' ? 'एक टैप में ऐप आइकन आपकी स्क्रीन पर आ जाएगा।' : 'One tap adds the app icon directly to your phone screen.'}
              </p>
            </div>
          ) : (
            /* Step-by-Step Android Chrome Instructions */
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-2.5">
                <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'hi' ? 'Chrome ब्राउज़र से इंस्टॉल करने का आसान तरीका:' : 'Quick Steps to Install on Android Chrome:'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-blue-100">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-semibold">
                        {language === 'hi' ? 'ऊपर दाईं ओर 3-डॉट्स (⋮) मेनू पर टैप करें' : 'Tap the 3-dots (⋮) menu in Chrome (top right)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-blue-100">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-semibold">
                        {language === 'hi' ? '"Install app" या "होम स्क्रीन में जोड़ें (Add to Home Screen)" चुनें' : 'Select "Install app" or "Add to Home screen"'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-blue-100">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-semibold">
                        {language === 'hi' ? '"Install" बटन दबाएं — ऐप आपके फोन के ऐप ड्रॉवर में आ जाएगी!' : 'Tap "Install" — the app will appear in your Android app launcher!'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span>
                  {language === 'hi' ? 'फोन में किसी भी समय ऑफलाइन इस्तेमाल करें' : 'Open anytime like a native Android APK'}
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'तैयार' : 'Ready'}
                </span>
              </div>
            </div>
          )}

          {/* Close / Dismiss */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
