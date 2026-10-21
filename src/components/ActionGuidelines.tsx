import React from 'react';

interface ActionGuidelinesProps {
  onBack: () => void;
}

export const ActionGuidelines: React.FC<ActionGuidelinesProps> = ({ onBack }) => {
  const actions = [
    {
      title: '🔴 地震',
      borderColor: 'border-l-[#dc3545]',
      steps: [
        'まず身の安全を確保する',
        '机の下などに入り、頭を守る',
        '揺れがおさまってから周囲を確認する',
        '必要に応じて安全な場所へ避難する',
      ],
    },
    {
      title: '🌊 津波',
      borderColor: 'border-l-[#0088cc]',
      steps: [
        '強い揺れや長い揺れを感じたら警戒する',
        '海や川から離れる',
        '高い場所など安全な場所へ避難する',
        '津波警報・注意報が解除されるまで戻らない',
      ],
    },
    {
      title: '🌧️ 大雨・洪水',
      borderColor: 'border-l-[#2196f3]',
      steps: [
        '気象警報や避難情報を確認する',
        '危険な場所には近づかない',
        '必要に応じて早めに避難する',
        '安全な場所で最新の情報を確認する',
      ],
    },
    {
      title: '🔥 火災',
      borderColor: 'border-l-[#ff6600]',
      steps: [
        '周囲に火災を知らせる',
        '安全を確認して避難する',
        '煙を吸わないよう低い姿勢をとる',
        'エレベーターは使わず階段で避難する',
      ],
    },
  ];

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
        <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2">
          🚨 災害が起きたら
        </h2>

        <p className="text-sm md:text-base text-neutral-700 leading-relaxed">
          災害の種類によって、取るべき行動が変わります。落ち着いて安全を確保しましょう。
        </p>

        <div className="space-y-4 pt-2">
          {actions.map((action, idx) => (
            <div
              key={idx}
              className={`p-4 bg-neutral-50 rounded-lg border-l-6 ${action.borderColor} border border-neutral-200 shadow-xs`}
            >
              <h3 className="text-base md:text-lg font-bold text-neutral-800 m-0 mb-2">
                {action.title}
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-sm md:text-base text-neutral-700">
                {action.steps.map((step, sIdx) => (
                  <li key={sIdx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
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
