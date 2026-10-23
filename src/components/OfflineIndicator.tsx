import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-neutral-900/95 text-white px-4 py-3 shadow-xl border border-neutral-700 backdrop-blur-sm max-w-md animate-fade-in">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <div className="text-xs md:text-sm">
          <span className="font-bold block">通信が切断されています（オフライン中）</span>
          <span className="text-neutral-300 text-2xs block">
            端末に保存されたデータ（行動・家族メモ・備蓄）を利用できます
          </span>
        </div>
      </div>
    </div>
  );
};
