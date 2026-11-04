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
        return { title: '災害速報', subtitle: '最新の地震・津波・気象警報' };
      case 'shelters':
        return { title: '避難場所・ルート', subtitle: '現在地周辺の指定緊急避難場所' };
      case 'checklist':
        return { title: '防災チェックリスト', subtitle: '持ち出し品・非常備蓄シミュレーション' };
      case 'actions':
        return { title: '災害時の行動マニュアル', subtitle: '地震・台風・火災時の適切な初動' };
      case 'family':
        return { title: '家族の安否・連絡先', subtitle: '集合場所・連絡先メモ・伝言ダイヤル' };
      case 'quiz':
        return { title: '防災知識クイズ', subtitle: 'クイズで防災の知識と判断力を学ぶ' };
      case 'hazard':
        return { title: 'ハザードマップ・リスク確認', subtitle: '国交省浸水想定・土砂災害・標高と避難判定' };
      case 'home':
      default:
        return { title: 'SafeNow', subtitle: 'セーフナウ 総合防災ナビ' };
    }
  };

  const { title, subtitle } = getScreenTitle();

  return (
    <div className="text-neutral-900 transition-all">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
        >
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:bg-red-700 transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.14-2.76 8.01-6 9.07-3.24-1.06-6-4.93-6-9.07V6.43l6-2.25zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-neutral-900 truncate">
                {currentScreen === 'home' ? 'SafeNow' : title}
              </span>
              {currentScreen === 'home' ? (
                <span className="text-2xs font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  セーフナウ
                </span>
              ) : null}
            </div>
            <p className="text-2xs text-neutral-500 font-normal m-0 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {currentScreen !== 'home' && (
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="py-1 px-2.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
            >
              ホーム
            </button>
          )}
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
