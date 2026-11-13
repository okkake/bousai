import React from 'react';
import { ManualIcon, EarthquakeIcon, TsunamiIcon, RainIcon, FireIcon } from './Icons';

interface ActionGuidelinesProps {
  onBack: () => void;
}

export const ActionGuidelines: React.FC<ActionGuidelinesProps> = ({ onBack }) => {
  const actions = [
    {
      title: '地震',
      icon: <EarthquakeIcon className="w-4 h-4 text-[#dc3545] shrink-0" />,
      borderColor: 'border-l-[#dc3545]',
      steps: [
        'まず身の安全を確保する',
        '机の下などに入り、頭を守る',
        '揺れがおさまってから周囲を確認する',
        '必要に応じて安全な場所へ避難する',
      ],
    },
    {
      title: '津波',
      icon: <TsunamiIcon className="w-4 h-4 text-[#0088cc] shrink-0" />,
      borderColor: 'border-l-[#0088cc]',
      steps: [
        '強い揺れや長い揺れを感じたら警戒する',
        '海や川から離れる',
        '高い場所など安全な場所へ避難する',
        '津波警報・注意報が解除されるまで戻らない',
      ],
    },
    {
      title: '大雨・洪水',
      icon: <RainIcon className="w-4 h-4 text-[#2196f3] shrink-0" />,
      borderColor: 'border-l-[#2196f3]',
      steps: [
        '気象警報や避難情報を確認する',
        '危険な場所には近づかない',
        '必要に応じて早めに避難する',
        '安全な場所で最新の情報を確認する',
      ],
    },
    {
      title: '火災',
      icon: <FireIcon className="w-4 h-4 text-[#ff6600] shrink-0" />,
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
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-neutral-200/90 space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-3 m-0">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
            <ManualIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <span>災害時の行動マニュアル</span>
        </h2>

        <p className="text-xs md:text-sm text-neutral-500 leading-relaxed m-0">
          災害の種類によって、取るべき行動が変わります。落ち着いて安全を最優先に確保しましょう。
        </p>

        <div className="space-y-4 pt-1">
          {actions.map((item, index) => (
            <div
              key={index}
              className={`p-4 bg-neutral-50/80 rounded-xl border-l-4 ${item.borderColor} border border-neutral-200/70 space-y-2`}
            >
              <h3 className="font-bold text-sm md:text-base text-neutral-900 m-0 flex items-center gap-2">
                {item.icon}
                <span>{item.title}</span>
              </h3>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-neutral-700 leading-relaxed m-0">
                {item.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="font-medium">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
