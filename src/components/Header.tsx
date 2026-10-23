import React from 'react';
import { ScreenType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate }) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'alerts':
        return { title: '🚨 災害速報', subtitle: '最新の災害情報を確認できます' };
      case 'shelters':
        return { title: '🏃 避難場所', subtitle: '近くの避難場所を確認する' };
      case 'checklist':
        return { title: '🎒 防災チェック', subtitle: '防災用品・備蓄量をシミュレーション' };
      case 'actions':
        return { title: '📖 災害時の行動', subtitle: '災害が起きたときの行動を学ぶ' };
      case 'family':
        return { title: '👨‍👩‍👧 家族との連絡', subtitle: '集合場所などを確認する' };
      case 'quiz':
        return { title: '🧠 防災クイズ', subtitle: 'クイズで防災知識を学ぶ' };
      case 'home':
      default:
        return { title: '🚨 防災アプリ', subtitle: '災害から身を守るための情報を確認しよう' };
    }
  };

  const { title, subtitle } = getScreenTitle();

  return (
    <header className="bg-[#d32f2f] text-white text-center py-5 px-4 shadow-md sticky top-0 z-30 transition-colors">
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center relative">
        {/* Tablet/Desktop PWA Install button positioned in header */}
        <div className="absolute right-0 top-1 hidden sm:block">
          <PWAInstallButton />
        </div>

        <h1
          onClick={() => onNavigate('home')}
          className="m-0 mb-1 text-2xl md:text-3xl font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {title}
        </h1>
        <p className="m-0 text-xs md:text-sm text-red-100 font-normal">
          {subtitle}
        </p>

        {/* Mobile PWA Install button */}
        <div className="mt-2 sm:hidden">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
