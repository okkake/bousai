import React, { useState } from 'react';
import { ScreenType } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HomeMenuProps {
  onNavigate: (screen: ScreenType) => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onNavigate }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuide, setShowGuide] = useState(false);

  const menuItems: { id: ScreenType; title: string; desc: string; icon: string }[] = [
    {
      id: 'alerts',
      title: '災害速報',
      desc: '最新の地震・津波・気象警報を確認する',
      icon: '🚨',
    },
    {
      id: 'shelters',
      title: '避難場所',
      desc: '現在地からの徒歩ルート・周辺避難所を探す',
      icon: '🏃',
    },
    {
      id: 'hazard',
      title: 'ハザードマップ・リスク確認',
      desc: '洪水・浸水想定深・土砂災害・津波・海抜標高と避難判定',
      icon: '🗺️',
    },
    {
      id: 'checklist',
      title: '防災チェック & 備蓄計算',
      desc: '持ち出し品チェック・家族の必要備蓄量をシミュレーション',
      icon: '🎒',
    },
    {
      id: 'actions',
      title: '災害時の行動',
      desc: '地震・津波・水害・火災時の初動対応マニュアル',
      icon: '📖',
    },
    {
      id: 'family',
      title: '家族との連絡',
      desc: '集合場所や緊急連絡先メモを管理・保存',
      icon: '👨‍👩‍👧',
    },
    {
      id: 'quiz',
      title: '防災クイズ',
      desc: '4択クイズで防災の知識と判断力を身につける',
      icon: '🧠',
    },
  ];

  return (
    <nav className="w-[90%] max-w-[600px] mx-auto my-6 space-y-4" aria-label="メインメニュー">
      {/* PWA & オフライン対応バナー */}
      <div className="bg-gradient-to-r from-red-50 via-white to-amber-50 border border-red-200 rounded-xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs border border-red-100 shrink-0">📲</span>
            <div>
              <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2 flex-wrap">
                <span>ホーム画面に追加して備える</span>
                <span className="text-2xs bg-[#d32f2f] text-white px-2 py-0.5 rounded-full font-bold">PWA対応</span>
                {isInstalled && (
                  <span className="text-2xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">インストール済</span>
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-1 m-0 leading-relaxed">
                通信障害や停電でネットが繋がらない災害時でも、防災マニュアルや備蓄計算、家族メモが即座に開けます。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 flex-wrap gap-2 text-xs">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>通信状態：{isOnline ? 'オンライン（正常）' : 'オフライン（キャッシュ動作中）'}</span>
          </span>

          <button
            type="button"
            onClick={async () => {
              if (isInstallable) {
                const ok = await install();
                if (!ok) setShowGuide(true);
              } else {
                setShowGuide(true);
              }
            }}
            className="py-1.5 px-3 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs text-xs"
          >
            {isInstallable ? 'アプリを保存 ↗' : '追加方法を見る ↗'}
          </button>
        </div>
      </div>

      {/* メインメニュー一覧 */}
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`w-full p-5 rounded-xl text-left cursor-pointer shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex flex-col justify-center focus-visible:outline-2 focus-visible:outline-[#d32f2f] relative ${
            item.id === 'hazard'
              ? 'bg-gradient-to-r from-orange-50/60 via-white to-amber-50/40 border-2 border-orange-300 hover:border-orange-400'
              : 'bg-white border border-neutral-100 hover:bg-neutral-50'
          }`}
        >
          {item.id === 'hazard' && (
            <span className="absolute top-3.5 right-3.5 bg-orange-600 text-white text-2xs font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
              ✨ 新規追加
            </span>
          )}
          <span className="block text-xl font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
            <span>{item.icon}</span>
            <span>{item.title}</span>
          </span>
          <small className="text-sm text-neutral-500 font-normal">
            {item.desc}
          </small>
        </button>
      ))}

      {/* インストール・追加方法モーダル */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-neutral-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-base font-bold text-neutral-900 m-0 flex items-center gap-2">
                <span>📲</span>
                <span>ホーム画面への追加・インストール</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950 font-medium leading-relaxed">
              <strong>💡 オフラインでも利用可能</strong><br />
              ホーム画面に追加すると、災害で電波や通信が途絶えたときでも、防災マニュアルや家族連絡先、備蓄計算を即座に開くことができます。
            </div>

            {/* iOS Safari手順 */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <div className="font-bold text-xs md:text-sm text-neutral-900 flex items-center gap-1.5">
                <span>🍎</span>
                <span>iPhone / iPad（Safari）の場合</span>
              </div>
              <ol className="list-decimal pl-5 text-xs text-neutral-700 space-y-1 leading-relaxed">
                <li>Safari下部の <strong>共有ボタン（⎋）</strong> をタップ</li>
                <li>メニューをスクロールして <strong>「ホーム画面に追加」</strong> を選択</li>
                <li>右上の <strong>「追加」</strong> をタップするとアプリアイコンが作成されます</li>
              </ol>
            </div>

            {/* Android / PC Chrome・Edge手順 */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <div className="font-bold text-xs md:text-sm text-neutral-900 flex items-center gap-1.5">
                <span>🤖</span>
                <span>Android / PC（Chrome・Edge）の場合</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed m-0">
                ブラウザ右上のメニュー（<strong>︙</strong>）から <strong>「ホーム画面に追加」</strong> または <strong>「アプリをインストール」</strong> を選択してください。（PCではURLアドレスバー右端にインストールボタン ⊕ が表示されます）
              </p>
            </div>

            {/* プレビュー環境外で開くリンク */}
            <div className="pt-1">
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs md:text-sm font-bold rounded-lg text-center shadow-xs transition-colors block"
              >
                🌐 実機ブラウザで直接開く ↗
              </a>
              <p className="text-2xs text-neutral-500 text-center mt-1 m-0">
                ※AI Studioプレビュー枠外のSafariやChromeで開くと、直接インストールがスムーズに行えます。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs md:text-sm font-bold rounded-lg transition-colors cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
