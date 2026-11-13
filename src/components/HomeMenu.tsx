import React, { useState } from 'react';
import { ScreenType } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HomeMenuProps {
  onNavigate: (screen: ScreenType) => void;
}

interface MenuItemConfig {
  id: ScreenType;
  title: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  iconSvg: React.ReactNode;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onNavigate }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuide, setShowGuide] = useState(false);

  const menuItems: MenuItemConfig[] = [
    {
      id: 'alerts',
      title: '災害速報',
      desc: '地震・津波・気象警報のリアルタイム速報',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      iconBorder: 'border-rose-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      ),
    },
    {
      id: 'shelters',
      title: '避難場所',
      desc: '開設状況・現在地周辺の指定緊急避難所',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      iconBorder: 'border-sky-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      ),
    },
    {
      id: 'hazard',
      title: 'ハザードマップ・リスク確認',
      desc: '浸水深・土砂災害・標高の重ね合わせと避難判定',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      iconBorder: 'border-amber-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.2L12 16z" />
        </svg>
      ),
    },
    {
      id: 'checklist',
      title: '防災チェック & 備蓄計算',
      desc: '持ち出し品チェック・家族の必要備蓄シミュレーション',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      iconBorder: 'border-emerald-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
    },
    {
      id: 'actions',
      title: '災害時の行動マニュアル',
      desc: '地震・台風・火災時の適切な初動対応手順',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      iconBorder: 'border-indigo-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
      ),
    },
    {
      id: 'family',
      title: '家族の安否・連絡先',
      desc: '集合場所・緊急連絡メモ・災害用伝言ダイヤル',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      iconBorder: 'border-violet-100',
      iconSvg: (
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5" aria-label="メインメニュー">
      {/* 状況ステータスバナー */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="font-semibold text-neutral-800 truncate">
            現在、全国で特別警報・津波警報は発表されていません
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('alerts')}
          className="shrink-0 text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
        >
          詳細確認 →
        </button>
      </div>

      {/* コンパクトなオフライン対応バー */}
      <div className="bg-white border border-neutral-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-neutral-700">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>{isOnline ? 'オンライン' : 'オフライン動作中'}</span>
          </span>
          <span className="text-neutral-300 hidden sm:inline">|</span>
          <span className="text-neutral-500 text-2xs md:text-xs">
            📡 オフライン対応（通信切断時もマニュアル・家族連絡・備蓄計算を利用可能）
          </span>
          {isInstalled && (
            <span className="text-2xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
              保存済
            </span>
          )}
        </div>

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
          className="py-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors cursor-pointer text-2xs md:text-xs shadow-2xs shrink-0"
        >
          {isInstallable ? 'アプリを保存 ↗' : '追加方法 ↗'}
        </button>
      </div>

      {/* メインメニュー一覧（PC 3列×2段・スマホ 1〜2列の均等配置） */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="bg-white rounded-2xl border border-neutral-200/90 p-5 md:p-6 text-center hover:border-neutral-300 hover:shadow-xs active:scale-[0.99] transition-all flex flex-col items-center justify-between cursor-pointer group focus-visible:outline-2 focus-visible:outline-neutral-900 min-h-[170px]"
          >
              <div className="w-full flex flex-col items-center">
                {/* 丸型アイコンバッジ */}
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${item.iconBg} ${item.iconColor} border ${item.iconBorder} flex items-center justify-center shrink-0 mx-auto transition-transform group-hover:scale-105 shadow-2xs`}
                >
                  {item.iconSvg}
                </div>

                {/* タイトル */}
                <div className="font-bold text-base md:text-lg text-neutral-900 group-hover:text-red-700 transition-colors mt-3 md:mt-3.5 leading-snug">
                  {item.title}
                </div>

                {/* サブタイトル / 説明文 */}
                <p className="text-xs text-neutral-500 font-normal m-0 mt-1.5 leading-relaxed text-center">
                  {item.desc}
                </p>
              </div>
            </button>
        ))}
      </div>

      {/* 緊急ダイヤルガイド（119・110・171） */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs md:text-sm text-neutral-900 m-0">
            緊急ダイヤルガイド
          </h3>
          <span className="text-2xs text-neutral-400">タップして直接発信</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 md:gap-3 text-center">
          <a
            href="tel:119"
            className="p-3 md:p-4 bg-red-50/70 hover:bg-red-100/80 rounded-xl border border-red-100/90 transition-all block text-decoration-none group hover:scale-[1.01]"
          >
            <div className="text-xl md:text-2xl font-black text-red-700 tracking-tight font-mono">119</div>
            <div className="text-2xs md:text-xs text-neutral-700 font-semibold mt-1">消防・救急</div>
          </a>
          <a
            href="tel:110"
            className="p-3 md:p-4 bg-blue-50/70 hover:bg-blue-100/80 rounded-xl border border-blue-100/90 transition-all block text-decoration-none group hover:scale-[1.01]"
          >
            <div className="text-xl md:text-2xl font-black text-blue-700 tracking-tight font-mono">110</div>
            <div className="text-2xs md:text-xs text-neutral-700 font-semibold mt-1">警察</div>
          </a>
          <a
            href="tel:171"
            className="p-3 md:p-4 bg-neutral-100/80 hover:bg-neutral-200/70 rounded-xl border border-neutral-200 transition-all block text-decoration-none group hover:scale-[1.01]"
          >
            <div className="text-xl md:text-2xl font-black text-neutral-800 tracking-tight font-mono">171</div>
            <div className="text-2xs md:text-xs text-neutral-700 font-semibold mt-1">災害用伝言</div>
          </a>
        </div>
      </div>

      {/* インストール・追加方法モーダル */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-neutral-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-base font-bold text-neutral-900 m-0 flex items-center gap-2">
                <span>📲</span>
                <span>SafeNow をホーム画面に追加</span>
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
