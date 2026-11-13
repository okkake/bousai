import React, { useState } from 'react';
import { ScreenType } from './types';
import { Header } from './components/Header';
import { HomeMenu } from './components/HomeMenu';
import { DisasterAlerts } from './components/DisasterAlerts';
import { Shelters } from './components/Shelters';
import { HazardMap } from './components/HazardMap';
import { EmergencyChecklist } from './components/EmergencyChecklist';
import { ActionGuidelines } from './components/ActionGuidelines';
import { FamilyContact } from './components/FamilyContact';
import { OfflineIndicator } from './components/OfflineIndicator';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-neutral-800 font-sans">
      {/* Sticky Header & Navigation Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-2xs">
        <Header currentScreen={currentScreen} onNavigate={handleNavigate} />

        {/* Screen navigation tabs when in subscreen */}
        {currentScreen !== 'home' && (
          <div className="border-t border-neutral-100 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center gap-1.5 text-xs whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="py-1 px-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>←</span>
                <span>ホーム</span>
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('alerts')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'alerts'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                災害速報
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('shelters')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'shelters'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                避難場所
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('hazard')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'hazard'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                ハザードマップ
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('checklist')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'checklist'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                チェック
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('actions')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'actions'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                行動マニュアル
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('family')}
                className={`py-1 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'family'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                家族連絡
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1">
        {currentScreen === 'home' && <HomeMenu onNavigate={handleNavigate} />}
        {currentScreen === 'alerts' && (
          <DisasterAlerts onBack={() => handleNavigate('home')} />
        )}
        {currentScreen === 'shelters' && <Shelters onBack={() => handleNavigate('home')} />}
        {currentScreen === 'hazard' && <HazardMap onBack={() => handleNavigate('home')} />}
        {currentScreen === 'checklist' && <EmergencyChecklist onBack={() => handleNavigate('home')} />}
        {currentScreen === 'actions' && <ActionGuidelines onBack={() => handleNavigate('home')} />}
        {currentScreen === 'family' && <FamilyContact onBack={() => handleNavigate('home')} />}
      </main>

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-neutral-200/80 text-center text-xs text-neutral-500 bg-white">
        <div className="max-w-5xl mx-auto px-4 space-y-1.5">
          <div className="flex items-center justify-center gap-2 font-medium text-neutral-600">
            <span className="font-bold text-neutral-900">SafeNow</span>
            <span>·</span>
            <span>セーフナウ 総合防災ナビ</span>
          </div>
          <p className="m-0 text-2xs text-neutral-400">
            データ出典：気象庁（JMA）防災情報XML · 国土交通省 重ねるハザードマップ · 国土地理院地図
          </p>
        </div>
      </footer>
    </div>
  );
};
