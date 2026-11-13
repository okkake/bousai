import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  FamilyIcon,
  SaveIcon,
  QrIcon,
  CopyIcon,
  ChatIcon,
  LocationPinIcon,
  PhoneCallIcon,
  HomeIcon,
  MemoIcon,
  CheckCircleIcon,
} from './Icons';

interface FamilyContactProps {
  onBack: () => void;
}

export const FamilyContact: React.FC<FamilyContactProps> = ({ onBack }) => {
  const [meetingPlace, setMeetingPlace] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [familyMemo, setFamilyMemo] = useState('');
  const [saveMessage, setSaveMessage] = useState(false);

  // 共有・QRコード用ステート
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');

  useEffect(() => {
    setMeetingPlace(localStorage.getItem('meeting-place') || '');
    setFamilyContact(localStorage.getItem('family-contact') || '');
    setHomeAddress(localStorage.getItem('home-address') || '');
    setFamilyMemo(localStorage.getItem('family-memo') || '');
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('meeting-place', meetingPlace);
    localStorage.setItem('family-contact', familyContact);
    localStorage.setItem('home-address', homeAddress);
    localStorage.setItem('family-memo', familyMemo);

    setSaveMessage(true);
    setTimeout(() => {
      setSaveMessage(false);
    }, 4000);
  };

  // 共有用テキストの生成
  const getShareText = () => {
    const lines = [
      '【我が家の防災連絡メモ】',
      meetingPlace ? `📍 集合場所: ${meetingPlace}` : '',
      familyContact ? `📞 家族連絡先: ${familyContact}` : '',
      homeAddress ? `🏠 自宅住所: ${homeAddress}` : '',
      familyMemo ? `📝 特記事項: ${familyMemo}` : '',
      '',
      '※通信途絶時は「災害用伝言ダイヤル 171」も活用しましょう。',
    ].filter(Boolean);
    return lines.join('\n');
  };

  // LINE共有リンク
  const handleLineShare = () => {
    handleSave();
    const text = getShareText();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  };

  // クリップボードへコピー
  const handleCopy = async () => {
    handleSave();
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('連絡メモをコピーしました');
      setTimeout(() => setCopyMessage(''), 3000);
    } catch {
      setCopyMessage('コピーに失敗しました');
    }
  };

  // QRコード生成
  const handleGenerateQr = async () => {
    handleSave();
    const text = getShareText();
    try {
      const url = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-neutral-200/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-3 m-0">
            <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0 shadow-2xs">
              <FamilyIcon className="w-5 h-5 text-violet-600" />
            </div>
            <span>家族の安否・連絡先</span>
          </h2>
          <span className="text-2xs bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded">
            端末内保存
          </span>
        </div>

        <p className="text-xs text-neutral-500 m-0 leading-relaxed">
          災害時に家族が離れ離れになった際の集合場所や連絡先を事前に決めて保存しておきましょう。
        </p>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label htmlFor="meeting-place-input" className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 mb-1">
              <LocationPinIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>集合場所（避難所や目印となる公園など）</span>
            </label>
            <input
              id="meeting-place-input"
              type="text"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
              placeholder="例：〇〇小学校、〇〇公園の時計台前"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="family-contact-input" className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 mb-1">
              <PhoneCallIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>家族の緊急連絡先（電話番号・名前）</span>
            </label>
            <input
              id="family-contact-input"
              type="text"
              value={familyContact}
              onChange={(e) => setFamilyContact(e.target.value)}
              placeholder="例：父 090-XXXX-XXXX、母 080-XXXX-XXXX"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="home-address-input" className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 mb-1">
              <HomeIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>自宅住所</span>
            </label>
            <input
              id="home-address-input"
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="例：東京都江東区東陽〇-〇-〇"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="family-memo-input" className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 mb-1">
              <MemoIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>特記事項・健康メモ（持病、アレルギー、避難カード）</span>
            </label>
            <textarea
              id="family-memo-input"
              rows={3}
              value={familyMemo}
              onChange={(e) => setFamilyMemo(e.target.value)}
              placeholder="例：長男に卵アレルギーあり、母の常用薬〇〇、ペット同伴避難希望"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 resize-none"
            />
          </div>

          {saveMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>端末内に保存しました！</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs md:text-sm font-bold transition-colors cursor-pointer shadow-2xs text-center flex items-center justify-center gap-1.5"
            >
              <SaveIcon className="w-4 h-4 shrink-0" />
              <span>端末に保存</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateQr}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs md:text-sm font-bold transition-colors cursor-pointer shadow-2xs text-center flex items-center justify-center gap-1.5"
            >
              <QrIcon className="w-4 h-4 shrink-0" />
              <span>QRコードで共有</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[40px] py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <CopyIcon className="w-3.5 h-3.5 shrink-0" />
              <span>テキストをコピー</span>
            </button>
            <button
              type="button"
              onClick={handleLineShare}
              className="flex-1 min-h-[40px] py-2 px-3 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-lg text-2xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <ChatIcon className="w-3.5 h-3.5 shrink-0" />
              <span>LINEで家族に送信</span>
            </button>
          </div>

          {copyMessage && (
            <div className="text-2xs text-neutral-600 text-center font-bold flex items-center justify-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{copyMessage}</span>
            </div>
          )}
        </form>

        {/* 災害用伝言ダイヤル「171」利用案内 */}
        <div className="pt-3 border-t border-neutral-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
              <PhoneCallIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <span>災害用伝言ダイヤル「171」</span>
            </span>
            <a
              href="tel:171"
              className="text-2xs text-red-600 font-bold hover:underline"
            >
              直接発信: 171
            </a>
          </div>
          <p className="text-2xs text-neutral-500 m-0 leading-relaxed">
            電話回線がパンクした際、被災地内の電話番号をキーにして音声を録音・再生できます。
          </p>
          <div className="grid grid-cols-2 gap-2 text-2xs text-neutral-700">
            <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <strong>録音：</strong> 171 → 1 → 電話番号
            </div>
            <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <strong>再生：</strong> 171 → 2 → 電話番号
            </div>
          </div>
        </div>
      </div>

      {/* QRコード表示モーダル */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-sm font-bold text-neutral-900 m-0 flex items-center gap-1.5">
                <QrIcon className="w-4 h-4 text-violet-600 shrink-0" />
                <span>家族のスマホでQRをスキャン</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-2xs text-neutral-500 m-0 leading-relaxed">
              電波やネット通信が届かない被災地でも、家族のスマホカメラでこのQRコードを読み取るだけで、防災連絡メモを一瞬で手元に控えられます。
            </p>

            {qrDataUrl && (
              <div className="flex justify-center p-2 bg-white rounded-xl border border-neutral-200 inline-block mx-auto">
                <img src={qrDataUrl} alt="防災連絡先QRコード" className="w-52 h-52" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

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
