import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  // すでにPWA（ホーム画面からスタンドアロン起動中）なら完了バッジを表示
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-2.5 py-1 text-xs font-bold border border-white/30">
        <span>✅</span>
        <span>アプリ版で起動中</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/25 hover:bg-white/35 active:scale-95 text-white px-3 py-1.5 text-xs font-bold border border-white/50 shadow-xs transition-all cursor-pointer whitespace-nowrap"
      >
        <span>📲</span>
        <span>{isInstallable ? 'アプリを保存' : 'ホーム画面に追加'}</span>
      </button>

      {/* インストール・ホーム画面追加案内モーダル */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-neutral-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-base font-bold text-neutral-900 m-0 flex items-center gap-2">
                <span>📲</span>
                <span>アプリをホーム画面に追加（PWA）</span>
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
                🌐 外部ブラウザで直接開く ↗
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
    </>
  );
};
