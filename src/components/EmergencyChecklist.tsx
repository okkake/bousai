import React, { useState, useEffect } from 'react';
import { ChecklistIcon, WaterIcon, FoodIcon, ToiletIcon, GasIcon, CheckCircleIcon } from './Icons';

interface EmergencyChecklistProps {
  onBack: () => void;
}

const CHECKLIST_ITEMS = [
  '水・飲料水（1人1日3Lを目安に持ち出し用は500ml複数本）',
  '非常食（加熱不要の缶詰・アルファ米・栄養補助バー）',
  '懐中電灯・LEDランタン（予備の乾電池も準備）',
  'モバイルバッテリー（満充電のスマホ充電器・ケーブル）',
  '救急用品・常備薬（絆創膏・消毒液・処方薬）',
  'ティッシュ・除菌ウェットティッシュ・タオル',
  '防寒具・アルミブランケット・雨具',
  'マスク・使い捨て手袋',
];

type ChecklistTab = 'takeout' | 'stockpile';

export const EmergencyChecklist: React.FC<EmergencyChecklistProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ChecklistTab>('takeout');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

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

  useEffect(() => {
    localStorage.setItem('stockpile_adults', String(adults));
    localStorage.setItem('stockpile_children', String(children));
    localStorage.setItem('stockpile_infants', String(infants));
    localStorage.setItem('stockpile_days', String(days));
  }, [adults, children, infants, days]);

  const totalPeople = adults + children;
  const waterAmount = Math.round((totalPeople * 3 + infants * 1.5) * days);
  const waterBottles = Math.ceil(waterAmount / 2);
  const mealsAmount = (adults + children) * 3 * days;
  const toiletAmount = (adults + children) * 5 * days;
  const gasCartridges = Math.ceil((days / 3) * (totalPeople >= 3 ? 3 : 2));

  return (
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-neutral-200/90 space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-3 m-0">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
            <ChecklistIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <span>防災チェック & 備蓄計算</span>
        </h2>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2 p-1.5 bg-neutral-100 rounded-xl gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('takeout')}
            className={`min-h-[44px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center ${
              activeTab === 'takeout'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            非常持ち出し袋チェック
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stockpile')}
            className={`min-h-[44px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center ${
              activeTab === 'stockpile'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            非常備蓄シミュレーター
          </button>
        </div>

        {activeTab === 'takeout' ? (
          <div className="space-y-4">
            {/* 進捗プログレス */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-700">
                <span>準備完了度</span>
                <span className="font-mono text-emerald-700 text-sm sm:text-base">
                  {checkedCount} / {CHECKLIST_ITEMS.length}品（{progressPercent}%）
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 達成度に応じたアドバイス・完了祝賀メッセージ */}
              {progressPercent === 100 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 mt-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">非常用持ち出し袋の準備が完了しました！</div>
                    <p className="text-2xs text-emerald-900/85 m-0 leading-relaxed">
                      素晴らしい備えです。半年に一度（防災の日など）は飲料水や非常食の賞味期限、モバイルバッテリーや乾電池の残量を定期点検しましょう。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-2xs text-neutral-600 leading-relaxed pt-0.5">
                  残りあと <strong className="text-neutral-900 font-mono">{CHECKLIST_ITEMS.length - checkedCount}</strong> 品目です。まずは命を守る水・非常食・明かりの必需品から優先して揃えましょう。
                </div>
              )}
            </div>

            {/* チェックリスト項目一覧 */}
            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map((item, index) => {
                const isChecked = checkedItems[index];
                return (
                  <label
                    key={index}
                    className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border min-h-[50px] transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-200 text-neutral-600'
                        : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(index)}
                      className="w-5 h-5 rounded accent-emerald-600 cursor-pointer shrink-0"
                    />
                    <span className={`text-xs sm:text-sm font-medium ${isChecked ? 'line-through text-neutral-400' : ''}`}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2">
              {showResetConfirm ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                  <span className="text-red-900 font-bold text-2xs text-center sm:text-left">
                    チェック状態をすべてリセットしますか？
                  </span>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleReset();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 sm:flex-initial py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-2xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs text-center"
                    >
                      リセット実行
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 sm:flex-initial py-1.5 px-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-2xs font-bold rounded-lg cursor-pointer transition-colors text-center"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="py-1 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-2xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    チェックをリセット...
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600 leading-relaxed m-0">
              ご家庭の家族構成に応じた最低限の備蓄量をシミュレーションします。
            </p>

            {/* 人数・日数設定 */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label htmlFor="adults-input" className="font-bold text-neutral-700 block mb-1">大人（中学生以上）</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdults((v) => Math.max(1, v - 1))}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span id="adults-input" className="font-bold font-mono text-sm w-5 text-center">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((v) => v + 1)}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="children-input" className="font-bold text-neutral-700 block mb-1">子ども（小学生）</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChildren((v) => Math.max(0, v - 1))}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span id="children-input" className="font-bold font-mono text-sm w-5 text-center">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((v) => v + 1)}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="infants-input" className="font-bold text-neutral-700 block mb-1">乳幼児（0〜5歳）</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInfants((v) => Math.max(0, v - 1))}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span id="infants-input" className="font-bold font-mono text-sm w-5 text-center">{infants}</span>
                    <button
                      type="button"
                      onClick={() => setInfants((v) => v + 1)}
                      className="w-7 h-7 bg-white border border-neutral-300 rounded font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <span className="text-xs font-bold text-neutral-700 block mb-1.5">備蓄日数目標</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDays(3)}
                    className={`py-1.5 px-2 rounded-lg border font-bold transition-all cursor-pointer text-center ${
                      days === 3
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    3日間（最低限）
                  </button>
                  <button
                    type="button"
                    onClick={() => setDays(7)}
                    className={`py-1.5 px-2 rounded-lg border font-bold transition-all cursor-pointer text-center ${
                      days === 7
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    7日間（推奨）
                  </button>
                </div>
              </div>
            </div>

            {/* 計算結果 */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-neutral-900 block">
                必要備蓄量の目安（{days}日分）：
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-2xs text-neutral-600 font-bold flex items-center gap-1.5 mb-1">
                    <WaterIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>飲料水</span>
                  </span>
                  <div className="font-black text-xl text-neutral-900 font-mono mt-0.5">
                    {waterAmount}<span className="text-xs font-normal text-neutral-500 ml-0.5">L</span>
                  </div>
                  <span className="text-2xs text-neutral-400">（2Lペットボトル約{waterBottles}本）</span>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-2xs text-neutral-600 font-bold flex items-center gap-1.5 mb-1">
                    <FoodIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>非常食</span>
                  </span>
                  <div className="font-black text-xl text-neutral-900 font-mono mt-0.5">
                    {mealsAmount}<span className="text-xs font-normal text-neutral-500 ml-0.5">食</span>
                  </div>
                  <span className="text-2xs text-neutral-400">（1人1日3食分）</span>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-2xs text-neutral-600 font-bold flex items-center gap-1.5 mb-1">
                    <ToiletIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>簡易トイレ</span>
                  </span>
                  <div className="font-black text-xl text-neutral-900 font-mono mt-0.5">
                    {toiletAmount}<span className="text-xs font-normal text-neutral-500 ml-0.5">回分</span>
                  </div>
                  <span className="text-2xs text-neutral-400">（1人1日5回分）</span>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-2xs text-neutral-600 font-bold flex items-center gap-1.5 mb-1">
                    <GasIcon className="w-3.5 h-3.5 text-red-600" />
                    <span>ガスボンベ</span>
                  </span>
                  <div className="font-black text-xl text-neutral-900 font-mono mt-0.5">
                    {gasCartridges}<span className="text-xs font-normal text-neutral-500 ml-0.5">本</span>
                  </div>
                  <span className="text-2xs text-neutral-400">（カセットコンロ用）</span>
                </div>
              </div>

              {/* 算出根拠・目安の内訳解説 */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-3 mt-3">
                <div className="font-bold text-xs text-neutral-900 flex items-center justify-between">
                  <span>なぜこの備蓄量が必要？（国の防災基準に基づく算出根拠）</span>
                  <span className="text-2xs text-neutral-500 font-normal">農水省・内閣府推奨基準</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-2xs leading-relaxed text-neutral-700">
                  <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <WaterIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>飲料水：1人1日3Lの根拠</span>
                    </div>
                    <p className="m-0 text-neutral-600">
                      生命維持に必要な水分（約2L）に加え、最低限の調理や衛生用（約1L）の合計です。乳幼児がいる場合は調乳用等に1人1日1.5Lで加算計算しています。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <FoodIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>非常食：最低3日〜7日分の根拠</span>
                    </div>
                    <p className="m-0 text-neutral-600">
                      発災から行政の公助（救援物資の配布）が本格化するまでに最低3日〜長くて1週間かかります。主食（アルファ米等）と主菜缶詰をローリングストックしましょう。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <ToiletIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>簡易トイレ：1人1日5回分の根拠</span>
                    </div>
                    <p className="m-0 text-neutral-600">
                      下水管破損や停電・断水時は水洗トイレが逆流・使用禁止になります。成人の1日平均排泄回数（約5回）に人数と日数を掛け合わせた必須備蓄数です。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <GasIcon className="w-3.5 h-3.5 text-red-600" />
                      <span>カセットガス：3日あたり約2〜3本の根拠</span>
                    </div>
                    <p className="m-0 text-neutral-600">
                      電気・都市ガス停止時にお湯を沸かし温かいレトルト食品を調理するための熱源です。カセットコンロ1台で約3日に2〜3本を消費します。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ホームに戻る */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-center rounded-xl font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] block text-xs md:text-sm focus-visible:outline-2 focus-visible:outline-neutral-900"
      >
        ← ホームに戻る
      </button>
    </div>
  );
};
