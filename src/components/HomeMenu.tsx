import React from 'react';
import { ScreenType } from '../types';

interface HomeMenuProps {
  onNavigate: (screen: ScreenType) => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onNavigate }) => {
  const menuItems: { id: ScreenType; title: string; desc: string; icon: string }[] = [
    {
      id: 'alerts',
      title: '災害速報',
      desc: '最新の災害情報を見る',
      icon: '🚨',
    },
    {
      id: 'shelters',
      title: '避難場所',
      desc: '近くの避難場所を確認する',
      icon: '🏃',
    },
    {
      id: 'checklist',
      title: '防災チェック',
      desc: '防災用品を確認する',
      icon: '🎒',
    },
    {
      id: 'actions',
      title: '災害時の行動',
      desc: '災害が起きたときの行動を学ぶ',
      icon: '📖',
    },
    {
      id: 'family',
      title: '家族との連絡',
      desc: '集合場所などを確認する',
      icon: '👨‍👩‍👧',
    },
    {
      id: 'quiz',
      title: '防災クイズ',
      desc: 'クイズで防災知識を学ぶ',
      icon: '🧠',
    },
  ];

  return (
    <nav className="w-[90%] max-w-[600px] mx-auto my-6 space-y-4" aria-label="メインメニュー">
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className="w-full p-5 bg-white rounded-xl text-left cursor-pointer shadow-md hover:bg-neutral-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 border border-neutral-100 flex flex-col justify-center focus-visible:outline-2 focus-visible:outline-[#d32f2f]"
        >
          <span className="block text-xl font-bold text-neutral-800 mb-1">
            {item.icon} {item.title}
          </span>
          <small className="text-sm text-neutral-500 font-normal">
            {item.desc}
          </small>
        </button>
      ))}
    </nav>
  );
};
