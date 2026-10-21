import React, { useState, useEffect } from 'react';

interface EmergencyChecklistProps {
  onBack: () => void;
}

const CHECKLIST_ITEMS = [
  '💧 水・飲料水',
  '🍚 非常食',
  '🔦 懐中電灯',
  '🔋 モバイルバッテリー',
  '🩹 救急用品',
  '🧻 ティッシュ・タオル',
  '🧥 防寒具',
  '😷 マスク',
];

export const EmergencyChecklist: React.FC<EmergencyChecklistProps> = ({ onBack }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => {
    return CHECKLIST_ITEMS.map((_, index) => {
      return localStorage.getItem(`bousai-check-${index}`) === 'true';
    });
  });

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      localStorage.setItem(`bousai-check-${index}`, String(updated[index]));
      return updated;
    });
  };

  const handleReset = () => {
    CHECKLIST_ITEMS.forEach((_, index) => {
      localStorage.removeItem(`bousai-check-${index}`);
    });
    setCheckedItems(new Array(CHECKLIST_ITEMS.length).fill(false));
  };

  const checkedCount = checkedItems.filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2">
            📋 防災用品をチェック
          </h2>
          <span className="text-sm font-semibold text-neutral-600 tabular-nums">
            {checkedCount} / {CHECKLIST_ITEMS.length} 準備完了 ({progressPercent}%)
          </span>
        </div>

        <p className="text-sm md:text-base text-neutral-700">
          災害に備えて、必要なものを確認しましょう。チェックした内容は自動的に保存されます。
        </p>

        {/* Progress bar */}
        <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#28a745] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 pt-2">
          {CHECKLIST_ITEMS.map((item, index) => {
            const isChecked = checkedItems[index];
            return (
              <label
                key={index}
                className={`flex items-center gap-3 p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg cursor-pointer transition-all border border-neutral-200 ${
                  isChecked ? 'line-through opacity-60 bg-emerald-50/50' : 'opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(index)}
                  className="w-5 h-5 rounded text-[#28a745] focus:ring-[#28a745] cursor-pointer"
                />
                <span className="text-base font-medium text-neutral-800 select-none">
                  {item}
                </span>
              </label>
            );
          })}
        </div>

        {checkedCount > 0 && (
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-neutral-500 hover:text-red-600 underline cursor-pointer"
            >
              チェックをすべてリセット
            </button>
          </div>
        )}
      </div>

      {/* ホームに戻る */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3.5 bg-neutral-600 hover:bg-neutral-700 text-white text-center rounded-lg font-bold transition-colors cursor-pointer shadow-sm block focus-visible:outline-2 focus-visible:outline-neutral-600"
      >
        ← ホームに戻る
      </button>
    </div>
  );
};
