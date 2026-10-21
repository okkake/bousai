import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface DisasterQuizProps {
  onBack: () => void;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: '地震が起きたとき、まずすることは？',
    answers: ['外へ走って出る', '身の安全を確保する', 'エレベーターに乗る'],
    correct: 1,
  },
  {
    question: '津波警報が発表されたら、どうする？',
    answers: [
      '海を見に行く',
      '海の近くで待つ',
      '海や川から離れて安全な場所へ避難する',
    ],
    correct: 2,
  },
  {
    question: '大雨のとき、危険な場所は？',
    answers: ['川や水路の近く', '安全な建物の中', '高い場所'],
    correct: 0,
  },
  {
    question: '災害に備えて準備しておくとよいものは？',
    answers: ['防災用品', '使わないゲーム機だけ', '何も準備しない'],
    correct: 0,
  },
];

export const DisasterQuiz: React.FC<DisasterQuizProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUESTIONS[currentQuestionIndex];

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);

    if (index === currentQ.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!isAnswered) return;

    if (currentQuestionIndex + 1 >= QUESTIONS.length) {
      setIsFinished(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
        <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2">
          📚 防災について学ぼう！
        </h2>

        {!isFinished ? (
          <>
            <p className="text-base md:text-lg font-bold text-neutral-800 leading-relaxed pt-1">
              第{currentQuestionIndex + 1}問　{currentQ.question}
            </p>

            {/* Answer buttons */}
            <div className="space-y-3 pt-2">
              {currentQ.answers.map((answer, index) => {
                let btnStyle = 'bg-[#2196f3] hover:bg-[#1e88e5] text-white';

                if (isAnswered) {
                  if (index === currentQ.correct) {
                    btnStyle = 'bg-[#28a745] text-white ring-2 ring-green-600 font-bold';
                  } else if (index === selectedIndex) {
                    btnStyle = 'bg-[#dc3545] text-white';
                  } else {
                    btnStyle = 'bg-neutral-300 text-neutral-700 opacity-60';
                  }
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectAnswer(index)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-lg text-sm md:text-base text-left transition-all cursor-pointer shadow-sm focus-visible:outline-2 focus-visible:outline-[#2196f3] ${btnStyle}`}
                  >
                    {answer}
                  </button>
                );
              })}
            </div>

            {/* Result message */}
            {isAnswered && (
              <div className="text-center pt-2">
                <p className="text-xl font-bold">
                  {selectedIndex === currentQ.correct ? (
                    <span className="text-[#28a745]">⭕ 正解！</span>
                  ) : (
                    <span className="text-[#dc3545]">❌ 不正解！</span>
                  )}
                </p>
              </div>
            )}

            {/* Current score */}
            <p className="text-center font-bold text-sm md:text-base text-neutral-600 tabular-nums">
              {score} / {QUESTIONS.length} 問正解
            </p>

            {/* Next question button */}
            {isAnswered && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 bg-[#28a745] hover:bg-[#218838] text-white rounded-lg text-base font-bold cursor-pointer transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-[#28a745]"
              >
                {currentQuestionIndex + 1 >= QUESTIONS.length ? '結果を見る 🎉' : '次の問題 →'}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <h3 className="text-2xl font-bold text-neutral-900">
              🎉 クイズ終了！
            </h3>
            <p className="text-lg md:text-xl font-semibold text-neutral-800">
              あなたの得点は <span className="text-[#d32f2f] text-2xl font-bold tabular-nums">{score}</span> / {QUESTIONS.length} 問です！
            </p>
            <p className="text-sm text-neutral-600">
              {score === QUESTIONS.length
                ? '素晴らしい！防災知識はバッチリです！'
                : '定期的にクイズを復習して、もしもの時に備えましょう！'}
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="py-3 px-6 bg-[#2196f3] hover:bg-[#1e88e5] text-white rounded-lg text-base font-bold transition-colors cursor-pointer shadow-sm"
            >
              🔄 もう一度挑戦する
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
