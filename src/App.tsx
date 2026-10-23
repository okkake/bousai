import React, { useState } from 'react';
import { ScreenType } from './types';
import { Header } from './components/Header';
import { HomeMenu } from './components/HomeMenu';
import { DisasterAlerts } from './components/DisasterAlerts';
import { Shelters } from './components/Shelters';
import { EmergencyChecklist } from './components/EmergencyChecklist';
import { ActionGuidelines } from './components/ActionGuidelines';
import { FamilyContact } from './components/FamilyContact';
import { DisasterQuiz } from './components/DisasterQuiz';
import { OfflineIndicator } from './components/OfflineIndicator';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f5f7]">
      <Header currentScreen={currentScreen} onNavigate={handleNavigate} />

      {/* Screen navigation tabs when in subscreen */}
      {currentScreen !== 'home' && (
        <div className="bg-white border-b border-neutral-200 overflow-x-auto shadow-xs">
          <div className="max-w-[600px] mx-auto px-4 py-2 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="py-1.5 px-2.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors cursor-pointer"
            >
              🏠 ホーム
            </button>
            <span className="text-neutral-300">/</span>
            <button
              type="button"
              onClick={() => handleNavigate('alerts')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'alerts'
                  ? 'bg-red-50 text-[#d32f2f] font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              🚨 災害速報
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('shelters')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'shelters'
                  ? 'bg-blue-50 text-[#1976d2] font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              🏃 避難場所
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('checklist')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'checklist'
                  ? 'bg-emerald-50 text-[#28a745] font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              🎒 チェック
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('actions')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'actions'
                  ? 'bg-amber-50 text-amber-700 font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              📖 行動
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('family')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'family'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              👨‍👩‍👧 家族
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('quiz')}
              className={`py-1.5 px-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                currentScreen === 'quiz'
                  ? 'bg-purple-50 text-purple-700 font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              🧠 クイズ
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {currentScreen === 'home' && <HomeMenu onNavigate={handleNavigate} />}
        {currentScreen === 'alerts' && <DisasterAlerts onBack={() => handleNavigate('home')} />}
        {currentScreen === 'shelters' && <Shelters onBack={() => handleNavigate('home')} />}
        {currentScreen === 'checklist' && <EmergencyChecklist onBack={() => handleNavigate('home')} />}
        {currentScreen === 'actions' && <ActionGuidelines onBack={() => handleNavigate('home')} />}
        {currentScreen === 'family' && <FamilyContact onBack={() => handleNavigate('home')} />}
        {currentScreen === 'quiz' && <DisasterQuiz onBack={() => handleNavigate('home')} />}
      </main>

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Emergency telephone contacts footer */}
      <footer className="mt-auto py-6 border-t border-neutral-200 text-center text-xs text-neutral-500 bg-white/70">
        <div className="max-w-[600px] mx-auto px-4 space-y-2">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-neutral-600 font-medium">
            <span>📞 災害用伝言ダイヤル: 171</span>
            <span>🚒 消防・救急: 119</span>
            <span>🚓 警察: 110</span>
          </div>
          <p className="m-0 text-neutral-400">
            データ出典：気象庁（JMA）防災情報XML / 国土地理院地図
          </p>
        </div>
      </footer>
    </div>
  );
};
