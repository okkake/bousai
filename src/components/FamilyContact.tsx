import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface FamilyContactProps {
  onBack: () => void;
}

export const FamilyContact: React.FC<FamilyContactProps> = ({ onBack }) => {
  const [meetingPlace, setMeetingPlace] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [familyMemo, setFamilyMemo] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

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

    setSaveMessage('✅ 端末内に保存しました！');
    setTimeout(() => {
      setSaveMessage('');
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

  // Web Share API または クリップボードコピー
  const handleCopyOrShare = async () => {
    handleSave();
    const text = getShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: '我が家の防災連絡メモ',
          text: text,
        });
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('📋 メモをクリップボードにコピーしました！');
      setTimeout(() => setCopyMessage(''), 3000);
    } catch {
      setCopyMessage('コピーに失敗しました');
    }
  };

  // QRコードモーダルを開く
  const handleOpenQr = async () => {
    handleSave();
    const text = getShareText();
    try {
      const url = await QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  // QRコード画像をダウンロード
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'bousai-family-memo-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasData = Boolean(meetingPlace || familyContact || homeAddress || familyMemo);

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2 m-0">
            👨‍👩‍👧 家族の防災情報・連絡メモ
          </h2>
          <p className="text-xs md:text-sm text-neutral-600 mt-1 leading-relaxed">
            災害発生時に家族が迷わず合流できるよう、事前に集合場所や連絡先を登録しておきましょう。入力内容は端末内に安全に保存され、オフラインでも閲覧できます。
          </p>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-800 mb-1">
              📍 家族の集合場所
            </label>
            <input
              type="text"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
              placeholder="例：○○小学校の校庭、○○公園の時計台前"
              className="w-full p-3 border border-neutral-300 rounded-lg text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-800 mb-1">
              📞 家族の電話番号・緊急連絡先
            </label>
            <input
              type="text"
              value={familyContact}
              onChange={(e) => setFamilyContact(e.target.value)}
              placeholder="例：父 090-xxxx-xxxx / 母 080-xxxx-xxxx"
              className="w-full p-3 border border-neutral-300 rounded-lg text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-800 mb-1">
              🏠 自宅の住所
            </label>
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="例：東京都千代田区○○ 1-2-3"
              className="w-full p-3 border border-neutral-300 rounded-lg text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#28a745] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-bold text-neutral-800 mb-1">
              📝 特記事項・家族間の約束
            </label>
            <textarea
              value={familyMemo}
              onChange={(e) => setFamilyMemo(e.target.value)}
              placeholder="例：大地震時はまず指定小学校へ向かう。連絡は災害用伝言ダイヤル171を使用。ペット（犬）を連れて避難する。"
              rows={3}
              className="w-full p-3 border border-neutral-300 rounded-lg text-xs md:text-sm text-neutral-900 resize-y focus-visible:outline-2 focus-visible:outline-[#28a745] bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#28a745] hover:bg-[#218838] text-white rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>💾</span>
              <span>端末に保存する</span>
            </button>
          </div>

          {saveMessage && (
            <p className="text-center font-bold text-emerald-700 text-xs md:text-sm py-1 transition-all m-0">
              {saveMessage}
            </p>
          )}
        </form>

        {/* 家族との共有エリア */}
        <div className="pt-3 border-t border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs md:text-sm text-neutral-900 flex items-center gap-1.5">
              <span>📤</span>
              <span>家族とこのメモを共有する</span>
            </span>
            <span className="text-2xs text-neutral-500">ワンタップで共有可能</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* LINE共有 */}
            <button
              type="button"
              onClick={handleLineShare}
              disabled={!hasData}
              className="py-2.5 px-3 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>💬</span>
              <span>LINEで送る</span>
            </button>

            {/* QRコード表示 */}
            <button
              type="button"
              onClick={handleOpenQr}
              disabled={!hasData}
              className="py-2.5 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>📲</span>
              <span>QRコードを表示</span>
            </button>

            {/* コピー / シェア */}
            <button
              type="button"
              onClick={handleCopyOrShare}
              disabled={!hasData}
              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>📋</span>
              <span>メモをコピー</span>
            </button>
          </div>

          {copyMessage && (
            <p className="text-center font-bold text-blue-700 text-xs py-1 transition-all m-0">
              {copyMessage}
            </p>
          )}

          {!hasData && (
            <p className="text-2xs text-neutral-500 m-0">
              ※集合場所や連絡先を入力・保存すると、LINE送信やQRコード表示が可能になります。
            </p>
          )}
        </div>

        {/* 災害用伝言ダイヤルの案内 */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <span>📞</span>
            <span>災害用伝言ダイヤル「171」の使い方</span>
          </div>
          <p className="m-0 leading-relaxed text-neutral-700">
            通信混雑時は「171」へ発信し、音声ガイダンスに従って録音（1）または再生（2）してください。連絡を取りたい家族の固定電話番号や携帯電話番号を入力してメッセージを残せます。
          </p>
        </div>
      </div>

      {/* QRコードモーダル */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-neutral-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-base font-bold text-neutral-900 m-0 flex items-center gap-1.5">
                <span>📲</span>
                <span>家族の防災メモ QRコード</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 m-0 leading-relaxed text-center">
              家族のスマートフォンのカメラ（標準カメラアプリ）でこのQRコードをかざすと、登録した防災情報が表示されます。
            </p>

            {/* QRコード画像 */}
            {qrDataUrl && (
              <div className="flex justify-center p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <img
                  src={qrDataUrl}
                  alt="家族連絡メモQRコード"
                  className="w-56 h-56 object-contain rounded-lg shadow-2xs"
                />
              </div>
            )}

            {/* メモ要約プレビュー */}
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-2xs text-neutral-700 space-y-1">
              <div className="font-bold text-neutral-800">【QRコード内の登録情報】</div>
              <div>📍 集合場所: {meetingPlace || '未登録'}</div>
              <div>📞 家族連絡先: {familyContact || '未登録'}</div>
              <div>🏠 自宅住所: {homeAddress || '未登録'}</div>
            </div>

            {/* ダウンロード & 閉じる */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full py-2.5 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs md:text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>💾</span>
                <span>QRコード画像を保存（PNG）</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs md:text-sm font-bold rounded-lg transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
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
