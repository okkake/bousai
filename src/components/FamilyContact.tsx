import React, { useState, useEffect } from 'react';

interface FamilyContactProps {
  onBack: () => void;
}

export const FamilyContact: React.FC<FamilyContactProps> = ({ onBack }) => {
  const [meetingPlace, setMeetingPlace] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [familyMemo, setFamilyMemo] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setMeetingPlace(localStorage.getItem('meeting-place') || '');
    setFamilyContact(localStorage.getItem('family-contact') || '');
    setHomeAddress(localStorage.getItem('home-address') || '');
    setFamilyMemo(localStorage.getItem('family-memo') || '');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('meeting-place', meetingPlace);
    localStorage.setItem('family-contact', familyContact);
    localStorage.setItem('home-address', homeAddress);
    localStorage.setItem('family-memo', familyMemo);

    setSaveMessage('✅ 保存しました！');
    setTimeout(() => {
      setSaveMessage('');
    }, 4000);
  };

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
        <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2">
          📋 家族の防災情報
        </h2>

        <p className="text-sm md:text-base text-neutral-700 leading-relaxed">
          災害が起きたときに確認できるよう、家族との連絡方法や集合場所を登録しておきましょう。入力内容は端末内に安全に保存されます。
        </p>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm md:text-base font-bold text-neutral-800 mb-1">
              📍 集合場所
            </label>
            <input
              type="text"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
              placeholder="例：○○小学校"
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm md:text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745]"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-bold text-neutral-800 mb-1">
              📞 家族の連絡先
            </label>
            <input
              type="text"
              value={familyContact}
              onChange={(e) => setFamilyContact(e.target.value)}
              placeholder="例：家族の電話番号など"
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm md:text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745]"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-bold text-neutral-800 mb-1">
              🏠 自宅の住所
            </label>
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="例：○○市○○町"
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm md:text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745]"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-bold text-neutral-800 mb-1">
              📝 その他のメモ
            </label>
            <textarea
              value={familyMemo}
              onChange={(e) => setFamilyMemo(e.target.value)}
              placeholder="災害時に家族で決めておくことなど"
              rows={4}
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm md:text-base text-neutral-900 resize-y focus-visible:outline-2 focus-visible:outline-[#28a745]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#28a745] hover:bg-[#218838] text-white rounded-lg text-base font-bold cursor-pointer transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-[#28a745]"
          >
            💾 保存する
          </button>

          {saveMessage && (
            <p className="text-center font-bold text-emerald-700 text-sm md:text-base py-1 transition-all">
              {saveMessage}
            </p>
          )}
        </form>
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
