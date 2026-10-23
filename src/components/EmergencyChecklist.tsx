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

type ChecklistTab = 'takeout' | 'stockpile';

export const EmergencyChecklist: React.FC<EmergencyChecklistProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ChecklistTab>('takeout');

  // --- 非常用持ち出し袋チェックリスト ---
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

  // --- 備蓄量シミュレーター ---
  const [adults, setAdults] = useState<number>(() => {
    const val = localStorage.getItem('stockpile_adults');
    return val !== null ? parseInt(val, 10) : 2;
  });
  const [children, setChildren] = useState<number>(() => {
    const val = localStorage.getItem('stockpile_children');
    return val !== null ? parseInt(val, 10) : 1;
  });
  const [infants, setInfants] = useState<number>(() => {
    const val = localStorage.getItem('stockpile_infants');
    return val !== null ? parseInt(val, 10) : 0;
  });
  const [days, setDays] = useState<number>(() => {
    const val = localStorage.getItem('stockpile_days');
    return val !== null ? parseInt(val, 10) : 3;
  });

  // 備蓄品チェック状態
  const [stockpileChecks, setStockpileChecks] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('stockpile_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleStockpileCheck = (key: string) => {
    setStockpileChecks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('stockpile_checks', JSON.stringify(updated));
      return updated;
    });
  };

  // 入力値変更時に保存
  const updateAdults = (val: number) => {
    const v = Math.max(0, Math.min(10, val));
    setAdults(v);
    localStorage.setItem('stockpile_adults', String(v));
  };
  const updateChildren = (val: number) => {
    const v = Math.max(0, Math.min(10, val));
    setChildren(v);
    localStorage.setItem('stockpile_children', String(v));
  };
  const updateInfants = (val: number) => {
    const v = Math.max(0, Math.min(5, val));
    setInfants(v);
    localStorage.setItem('stockpile_infants', String(v));
  };
  const updateDays = (val: number) => {
    setDays(val);
    localStorage.setItem('stockpile_days', String(val));
  };

  // 合計人数
  const totalPeople = adults + children + infants;
  const effectivePeople = Math.max(1, totalPeople);

  // 水 (L): 大人3L, 子ども2L, 乳幼児1.5L
  const waterLiters = (adults * 3 + children * 2 + infants * 1.5) * days;
  const waterBottles2L = Math.ceil(waterLiters / 2);
  const waterCases = (waterBottles2L / 6).toFixed(1);

  // 食料 (食): 1人1日3食
  const mainMeals = (adults + children) * 3 * days;
  const sideDishes = (adults + children) * 3 * days;

  // 非常用トイレ (回): 1人1日5回
  const toiletBags = (adults + children) * 5 * days;

  // カセットガスボンベ (本): 3日分=約3本, 7日分=約6本 (目安)
  const gasCanisters = days === 7 ? Math.max(6, Math.ceil(effectivePeople * 1.5)) : Math.max(3, Math.ceil(effectivePeople * 0.8));

  // 乳幼児用品
  const infantMilk = infants * 5 * days;
  const infantFood = infants * 3 * days;
  const infantDiapers = infants * 6 * days;

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      {/* 上部タブ切り替え */}
      <div className="flex bg-neutral-200/80 p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('takeout')}
          className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeTab === 'takeout'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          🎒 非常持ち出し袋（避難用）
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stockpile')}
          className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeTab === 'stockpile'
              ? 'bg-[#d32f2f] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          🧮 備蓄量計算ツール（在宅用）
        </button>
      </div>

      {/* タブ1: 非常持ち出し品チェックリスト */}
      {activeTab === 'takeout' && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2 m-0">
              📋 非常持ち出し品チェック
            </h2>
            <span className="text-sm font-semibold text-neutral-600 tabular-nums">
              {checkedCount} / {CHECKLIST_ITEMS.length} 準備完了 ({progressPercent}%)
            </span>
          </div>

          <p className="text-xs md:text-sm text-neutral-700 leading-relaxed m-0">
            避難所へ持ち出すリュックの中身を確認しましょう。チェックした内容は自動的に保存されます。
          </p>

          {/* Progress bar */}
          <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#28a745] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2.5 pt-1">
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
                  <span className="text-sm md:text-base font-medium text-neutral-800 select-none">
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
      )}

      {/* タブ2: 家族人数に応じた水・非常食の必要量計算ツール */}
      {activeTab === 'stockpile' && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2 m-0">
              🧮 備蓄量シミュレーター
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 mt-1 leading-relaxed">
              首相官邸・農林水産省ガイドラインに基づき、在宅避難に必要な水・食料・防災消耗品を家族構成に合わせて自動算出します。
            </p>
          </div>

          {/* 家族構成入力エリア */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3.5">
            <div className="font-bold text-xs md:text-sm text-neutral-800">
              1. ご家族の人数を入力してください
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 大人 */}
              <div className="bg-white p-3 rounded-lg border border-neutral-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">🧑 大人</span>
                  <span className="text-2xs text-neutral-500">中学生以上</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => updateAdults(adults - 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={adults <= 0}
                  >
                    −
                  </button>
                  <span className="font-bold text-lg tabular-nums text-neutral-900">{adults} 人</span>
                  <button
                    type="button"
                    onClick={() => updateAdults(adults + 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={adults >= 10}
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* 子ども */}
              <div className="bg-white p-3 rounded-lg border border-neutral-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">👦 子ども</span>
                  <span className="text-2xs text-neutral-500">小学生以下</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => updateChildren(children - 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={children <= 0}
                  >
                    −
                  </button>
                  <span className="font-bold text-lg tabular-nums text-neutral-900">{children} 人</span>
                  <button
                    type="button"
                    onClick={() => updateChildren(children + 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={children >= 10}
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* 乳幼児 */}
              <div className="bg-white p-3 rounded-lg border border-neutral-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">👶 乳幼児</span>
                  <span className="text-2xs text-neutral-500">ミルク・おむつ</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => updateInfants(infants - 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={infants <= 0}
                  >
                    −
                  </button>
                  <span className="font-bold text-lg tabular-nums text-neutral-900">{infants} 人</span>
                  <button
                    type="button"
                    onClick={() => updateInfants(infants + 1)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 text-base"
                    disabled={infants >= 5}
                  >
                    ＋
                  </button>
                </div>
              </div>
            </div>

            {/* 備蓄日数選択 */}
            <div className="pt-1">
              <div className="font-bold text-xs md:text-sm text-neutral-800 mb-1.5">
                2. 備蓄日数を選択してください
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateDays(3)}
                  className={`py-2.5 px-3 rounded-lg text-xs md:text-sm font-bold border transition-all cursor-pointer flex flex-col items-center ${
                    days === 3
                      ? 'bg-[#1976d2] text-white border-[#1976d2] shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>3日分（最低限）</span>
                  <span className="text-2xs opacity-90 mt-0.5">救助・支援物資が届く目安</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateDays(7)}
                  className={`py-2.5 px-3 rounded-lg text-xs md:text-sm font-bold border transition-all cursor-pointer flex flex-col items-center ${
                    days === 7
                      ? 'bg-[#28a745] text-white border-[#28a745] shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>7日分（推奨・安心）</span>
                  <span className="text-2xs opacity-90 mt-0.5">大規模災害時に安心な備蓄量</span>
                </button>
              </div>
            </div>
          </div>

          {/* 計算結果サマリーバナー */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 flex items-center justify-between text-xs md:text-sm">
            <span>
              対象：<strong>ご家族 {totalPeople} 人</strong>（{days}日分）
            </span>
            <span className="font-bold text-amber-800">
              {days === 7 ? '★ 推奨1週間備蓄' : '● 最低3日備蓄'}
            </span>
          </div>

          {/* 算出結果カード一覧 */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-neutral-800 m-0 flex items-center gap-1.5">
              📦 必要な備蓄品と数量の目安
            </h3>

            {/* 水 */}
            <div
              onClick={() => toggleStockpileCheck('water')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                stockpileChecks['water']
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💧</span>
                <div>
                  <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2">
                    <span>飲料水・調理用水</span>
                    {stockpileChecks['water'] && (
                      <span className="text-2xs bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">準備済</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    1人1日3L目安（大人・子ども・調乳用を含む）
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-bold text-blue-600 tabular-nums">{waterLiters}</span>
                <span className="text-xs font-bold text-neutral-600 ml-1">L</span>
                <div className="text-2xs text-neutral-500 font-medium">
                  2Lボトル 約{waterBottles2L}本（約{waterCases}箱）
                </div>
              </div>
            </div>

            {/* 主食 */}
            <div
              onClick={() => toggleStockpileCheck('main_meals')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                stockpileChecks['main_meals']
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🍚</span>
                <div>
                  <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2">
                    <span>主食（ご飯・パン・麺等）</span>
                    {stockpileChecks['main_meals'] && (
                      <span className="text-2xs bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">準備済</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    アルファ化米、レトルトご飯、缶詰パンなど（1日3食）
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-bold text-amber-700 tabular-nums">{mainMeals}</span>
                <span className="text-xs font-bold text-neutral-600 ml-1">食分</span>
              </div>
            </div>

            {/* 副菜・おかず */}
            <div
              onClick={() => toggleStockpileCheck('side_dishes')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                stockpileChecks['side_dishes']
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🥫</span>
                <div>
                  <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2">
                    <span>副菜・おかず缶詰・レトルト</span>
                    {stockpileChecks['side_dishes'] && (
                      <span className="text-2xs bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">準備済</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    肉・魚の缶詰、野菜スープ、レトルトカレーなど
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-bold text-amber-700 tabular-nums">{sideDishes}</span>
                <span className="text-xs font-bold text-neutral-600 ml-1">食分</span>
              </div>
            </div>

            {/* 非常用簡易トイレ */}
            <div
              onClick={() => toggleStockpileCheck('toilet')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                stockpileChecks['toilet']
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🚽</span>
                <div>
                  <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2">
                    <span>非常用簡易トイレ袋・凝固剤</span>
                    {stockpileChecks['toilet'] && (
                      <span className="text-2xs bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">準備済</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    断水・下水破損時に便器に被せて使用（1人1日5回）
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-bold text-indigo-700 tabular-nums">{toiletBags}</span>
                <span className="text-xs font-bold text-neutral-600 ml-1">回分</span>
              </div>
            </div>

            {/* 熱源・カセットボンベ */}
            <div
              onClick={() => toggleStockpileCheck('gas')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                stockpileChecks['gas']
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🔥</span>
                <div>
                  <div className="font-bold text-sm md:text-base text-neutral-900 flex items-center gap-2">
                    <span>カセットコンロ用ガスボンベ</span>
                    {stockpileChecks['gas'] && (
                      <span className="text-2xs bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">準備済</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    温かい食事・お湯の沸騰用（カセットコンロ本体も要準備）
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-bold text-red-600 tabular-nums">約 {gasCanisters}</span>
                <span className="text-xs font-bold text-neutral-600 ml-1">本</span>
              </div>
            </div>

            {/* 乳幼児特有備蓄（乳幼児 > 0 の場合） */}
            {infants > 0 && (
              <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/60 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm md:text-base text-pink-900">
                  <span>🍼</span>
                  <span>乳幼児用備蓄セット（{infants}人分）</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-pink-950 font-medium">
                  <div className="bg-white p-2.5 rounded-lg border border-pink-200">
                    <div>液体ミルク・粉ミルク</div>
                    <div className="text-base font-bold text-pink-700 mt-1">{infantMilk} 回分</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-pink-200">
                    <div>ベビーフード・離乳食</div>
                    <div className="text-base font-bold text-pink-700 mt-1">{infantFood} 食分</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-pink-200">
                    <div>紙おむつ</div>
                    <div className="text-base font-bold text-pink-700 mt-1">{infantDiapers} 枚</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ローリングストック案内 */}
          <div className="p-4 bg-neutral-100 rounded-xl text-neutral-700 text-xs leading-relaxed space-y-1.5">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <span>🔄</span>
              <span>ローリングストック（日常備蓄）のすすめ</span>
            </div>
            <p className="m-0">
              普段食べている缶詰、レトルト食品、ペットボトル飲料を少し多めに買い置きし、賞味期限の近いものから普段の食事で消費して、買い足す習慣をつけると、無理なく非常時の食料を確保できます。
            </p>
          </div>
        </div>
      )}

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
