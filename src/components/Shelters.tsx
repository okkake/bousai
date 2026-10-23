import React, { useState, useEffect, useCallback } from 'react';

interface SheltersProps {
  onBack: () => void;
}

type DisasterFilterType = 'all' | 'earthquake' | 'tsunami' | 'flood';

interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
}

export const Shelters: React.FC<SheltersProps> = ({ onBack }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationMessage, setLocationMessage] = useState<string>(
    '現在地を取得すると、周辺の避難場所やルートを案内します。'
  );

  // 災害種別フィルター
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterFilterType>('all');

  // 手動検索用（市区町村・駅名）
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showGsiMap, setShowGsiMap] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_shelter_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 現在地の取得関数
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('お使いのブラウザでは現在地を取得できません。手動検索をご利用ください。');
      return;
    }

    setIsLocating(true);
    setLocationMessage('現在地を取得中...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsLocating(false);

        // 逆ジオコーディングで住所を取得
        let address = '';
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data?.formatted) {
            address = data.formatted;
          }
        } catch {
          // ignore
        }

        setCurrentLocation({ lat, lng, address });
        setAppliedSearch('');
        setTargetCoords(null);
        setLocationMessage(
          address
            ? `現在地を取得しました：${address}`
            : `現在地を取得しました（北緯 ${lat.toFixed(3)}°, 東経 ${lng.toFixed(3)}°）`
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setLocationMessage(
          '位置情報の利用が許可されていないか取得に失敗しました。下の検索欄から市区町村名・駅名で検索できます。'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  // 画面表示時に位置情報取得を試みる
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // 災害種別に応じたキーワード生成
  const getDisasterKeyword = (facilityType: string = '避難所') => {
    switch (selectedDisaster) {
      case 'tsunami':
        return `津波避難ビル 高台 ${facilityType}`;
      case 'flood':
        return `指定緊急避難場所 洪水 ${facilityType}`;
      case 'earthquake':
        return `広域避難場所 耐震 ${facilityType}`;
      case 'all':
      default:
        return `指定避難所 ${facilityType}`;
    }
  };

  // 手動検索の実行
  const executeSearch = async (queryText: string, openMapDirectly: boolean = true) => {
    const query = queryText.trim();
    if (!query) return;

    setIsSearching(true);
    setAppliedSearch(query);

    // 履歴に追加
    const updated = [query, ...recentSearches.filter((item) => item !== query)].slice(0, 4);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recent_shelter_searches', JSON.stringify(updated));
    } catch {}

    // ジオコーディングで緯度経度を取得し、国土地理院地図をジャンプ
    let lat: number | null = null;
    let lon: number | null = null;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        lat = data.lat;
        lon = data.lon;
        setTargetCoords({ lat: data.lat, lng: data.lon });
      }
    } catch (err) {
      console.warn('Geocode failed:', err);
    } finally {
      setIsSearching(false);
    }

    // Google マップを別タブで直接開く
    if (openMapDirectly) {
      const keyword = getDisasterKeyword('避難所');
      const searchUrl = lat && lon
        ? `https://www.google.com/maps/search/${encodeURIComponent(`${query} ${keyword}`)}/@${lat},${lon},15z`
        : `https://www.google.com/maps/search/${encodeURIComponent(`${query} ${keyword}`)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery, true);
  };

  // 履歴クリック
  const handleSelectRecent = (query: string) => {
    setSearchQuery(query);
    executeSearch(query, true);
  };

  // Google Maps検索URLの生成
  const getMapSearchUrl = (facilityType: string = '避難所') => {
    const keyword = getDisasterKeyword(facilityType);
    if (appliedSearch) {
      if (targetCoords) {
        return `https://www.google.com/maps/search/${encodeURIComponent(`${appliedSearch} ${keyword}`)}/@${targetCoords.lat},${targetCoords.lng},15z`;
      }
      return `https://www.google.com/maps/search/${encodeURIComponent(`${appliedSearch} ${keyword}`)}`;
    }
    if (currentLocation) {
      return `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${currentLocation.lat},${currentLocation.lng},15z`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
  };

  // Google Maps徒歩ルート案内URL
  const getWalkingRouteUrl = (destination: string = '最寄りの指定避難所') => {
    const keyword = getDisasterKeyword(destination);
    if (appliedSearch) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(appliedSearch)}&destination=${encodeURIComponent(keyword)}&travelmode=walking`;
    }
    if (currentLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(keyword)}&travelmode=walking`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
  };

  // 国土地理院 地図iframeのURL
  const getGsiMapUrl = () => {
    if (appliedSearch && targetCoords) {
      return `https://maps.gsi.go.jp/#15/${targetCoords.lat}/${targetCoords.lng}/&ls=std`;
    }
    if (currentLocation) {
      return `https://maps.gsi.go.jp/#15/${currentLocation.lat}/${currentLocation.lng}/&ls=std`;
    }
    return `https://maps.gsi.go.jp/#13/35.6812/139.7671/&ls=std`;
  };

  // 災害種別ごとの避難アドバイス
  const getDisasterNotice = () => {
    switch (selectedDisaster) {
      case 'tsunami':
        return {
          title: '🌊 津波警戒時の避難先',
          bg: 'bg-sky-50 border-sky-300 text-sky-950',
          advice: '海岸や河川からただちに離れ、「津波避難ビル（3階以上の頑丈なRC造）」や「指定の高台」へ避難してください。',
        };
      case 'flood':
        return {
          title: '🌧️ 大雨・水害時の避難先',
          bg: 'bg-blue-50 border-blue-300 text-blue-950',
          advice: '浸水想定区域外の高台避難所へ。夜間や浸水開始後の移動が危険な場合は、無理せず自宅や近隣の2階以上（垂直避難）を確保してください。',
        };
      case 'earthquake':
        return {
          title: '🔴 地震発生時の避難先',
          bg: 'bg-red-50 border-red-300 text-red-950',
          advice: '身の安全を確保後、倒壊や火災の危険がある場合は指定の小中学校や「広域避難場所（大規模公園）」へ移動してください。',
        };
      default:
        return {
          title: '🏃 避難所の基本案内',
          bg: 'bg-neutral-50 border-neutral-200 text-neutral-800',
          advice: '地域の指定避難所（小中学校・公民館・体育館）を確認し、避難経路の安全を確認しながら行動しましょう。',
        };
    }
  };

  const notice = getDisasterNotice();

  // 表示する施設リスト（災害種別に応じた強調）
  const facilities = [
    {
      icon: '🏫',
      name: '小・中学校（指定避難所）',
      desc: '地域の中核となる指定一般避難所。食料・生活物資や宿泊スペースが配備されます。',
      suitableFor: ['all', 'earthquake', 'flood'],
      searchTag: '小学校 中学校 指定避難所',
    },
    {
      icon: '🏢',
      name: '公民館・地域センター',
      desc: '地域の身近な避難所。情報伝達や一時的な避難所として利用されます。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '公民館 地域センター 避難所',
    },
    {
      icon: '🏟️',
      name: '体育館・スポーツセンター',
      desc: '耐震構造が整っており、大勢の避難者を受け入れられる拠点避難所です。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '体育館 避難所',
    },
    {
      icon: '🌳',
      name: '広域避難場所（大型公園・広場）',
      desc: '大地震時の大規模火災の延焼から身を守るための広大な避難場所です。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '広域避難場所 公園',
    },
    {
      icon: '🏢',
      name: '津波避難ビル・高台',
      desc: '津波警報発令時に緊急避難するための3階建て以上の堅牢な建物や高台です。',
      suitableFor: ['tsunami'],
      searchTag: '津波避難ビル 高台',
    },
  ];

  // 選択された災害種別に合致する施設を優先表示
  const filteredFacilities = facilities.filter(
    (f) => selectedDisaster === 'all' || f.suitableFor.includes(selectedDisaster)
  );

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2 m-0">
            🏃 避難場所案内
          </h2>
          {currentLocation && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              GPS測位済
            </span>
          )}
        </div>

        {/* 災害種別フィルタータブ */}
        <div>
          <div className="text-xs font-bold text-neutral-600 mb-1.5">
            災害の種類を選択してください：
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedDisaster('all')}
              className={`py-2 px-2 text-xs font-bold rounded-md transition-colors cursor-pointer text-center ${
                selectedDisaster === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('earthquake')}
              className={`py-2 px-2 text-xs font-bold rounded-md transition-colors cursor-pointer text-center ${
                selectedDisaster === 'earthquake'
                  ? 'bg-[#d32f2f] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🔴 地震
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('tsunami')}
              className={`py-2 px-2 text-xs font-bold rounded-md transition-colors cursor-pointer text-center ${
                selectedDisaster === 'tsunami'
                  ? 'bg-[#0088cc] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🌊 津波
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('flood')}
              className={`py-2 px-2 text-xs font-bold rounded-md transition-colors cursor-pointer text-center ${
                selectedDisaster === 'flood'
                  ? 'bg-[#1976d2] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🌧️ 水害・土砂
            </button>
          </div>
        </div>

        {/* 現在地カード & 最寄りルート案内 */}
        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <span>📍</span>
                <span>{currentLocation?.address || '現在地周辺の避難場所'}</span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                {locationMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="shrink-0 text-xs py-1.5 px-3 bg-white hover:bg-neutral-50 text-emerald-800 font-bold border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLocating ? '測位中...' : '🔄 再取得'}
            </button>
          </div>

          {/* 最寄り避難所へのワンタップ徒歩ルート */}
          <div className="pt-1">
            <a
              href={getWalkingRouteUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#28a745] hover:bg-[#218838] text-white rounded-lg text-sm md:text-base font-bold shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
            >
              <span>🚶</span>
              <span>
                {appliedSearch
                  ? `「${appliedSearch}」から最寄りの避難所へルート案内 ↗`
                  : '現在地から最寄りの避難所へ徒歩ルート案内 ↗'}
              </span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={getMapSearchUrl('避難所')}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-center rounded-lg text-xs md:text-sm font-bold shadow-2xs transition-colors block"
            >
              🗺️ 周辺の避難所を地図で一覧 ↗
            </a>
            <a
              href="https://disaportal.gsi.go.jp/maps/"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-center rounded-lg text-xs md:text-sm font-bold shadow-2xs transition-colors block"
            >
              ⚠️ 重ねるハザードマップ（公式） ↗
            </a>
          </div>
        </div>

        {/* 手動検索（市区町村名・駅名） */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <label htmlFor="shelter-search" className="block text-xs md:text-sm font-bold text-neutral-800">
            🔍 市区町村名や駅名で探す（手動検索）
          </label>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              id="shelter-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例：新宿区、横浜駅、福岡市博多区"
              className="flex-1 p-2.5 border border-neutral-300 rounded-lg text-xs md:text-sm bg-white text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#2196f3]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="py-2.5 px-5 bg-[#2196f3] hover:bg-[#1e88e5] text-white rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors shadow-2xs whitespace-nowrap shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{isSearching ? '検索中...' : '🔍 地図で検索'}</span>
            </button>
          </form>

          {/* 直近の検索履歴 */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
              <span className="text-neutral-500 shrink-0">最近の検索：</span>
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRecent(item)}
                  className="py-0.5 px-2 bg-white border border-neutral-300 rounded-md text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 cursor-pointer transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* 検索結果アクティブバナー */}
          {appliedSearch && (
            <div className="mt-2 p-3 bg-blue-50 border-2 border-[#2196f3] rounded-xl text-neutral-900 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs md:text-sm text-[#1976d2] flex items-center gap-1.5">
                  <span>📍</span>
                  <span>「{appliedSearch}」周辺の避難所を検索しました</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedSearch('');
                    setSearchQuery('');
                    setTargetCoords(null);
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
                >
                  現在地表示に戻す
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(`${appliedSearch} ${getDisasterKeyword('避難所')}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-center font-bold rounded-lg text-xs md:text-sm shadow-2xs transition-colors block"
                >
                  🗺️ 「{appliedSearch}」の避難所をGoogle マップで表示 ↗
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(appliedSearch)}&destination=${encodeURIComponent(getDisasterKeyword('指定避難所'))}&travelmode=walking`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-[#28a745] hover:bg-[#218838] text-white text-center font-bold rounded-lg text-xs md:text-sm shadow-2xs transition-colors block"
                >
                  🚶 「{appliedSearch}」からの徒歩ルート ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 災害種別アドバイス枠 */}
        <div className={`p-3.5 rounded-lg border text-xs md:text-sm ${notice.bg}`}>
          <div className="font-bold mb-1">{notice.title}</div>
          <div className="leading-relaxed">{notice.advice}</div>
        </div>

        {/* 国土地理院 防災地図（普段は非表示、必要な時だけ開閉） */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <button
            type="button"
            onClick={() => setShowGsiMap((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <div>
                <span className="font-bold text-sm text-neutral-800 block">
                  国土地理院 防災地図（標高・詳細地形）
                </span>
                <span className="text-xs text-neutral-500 block font-normal">
                  {showGsiMap ? 'タップで地図を閉じます' : 'タップで地図を展開・表示します'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold py-1 px-2.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 shrink-0">
              {showGsiMap ? '閉じる ▲' : '表示する ▼'}
            </span>
          </button>

          {showGsiMap && (
            <div className="p-3.5 pt-0 border-t border-neutral-100 space-y-2.5">
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-500">
                  ※標高や詳細地形、等高線を確認したい場合にご利用ください
                </span>
                <a
                  href={getGsiMapUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#1976d2] hover:underline font-semibold"
                >
                  拡大地図で開く ↗
                </a>
              </div>
              <div className="w-full h-[360px] rounded-lg overflow-hidden border border-neutral-300 shadow-2xs">
                <iframe
                  src={getGsiMapUrl()}
                  className="w-full h-full border-0"
                  title="国土地理院の地図"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        {/* 施設別の避難場所案内カード */}
        <div className="space-y-3 pt-1">
          <h3 className="text-base font-bold text-neutral-800 m-0">
            🏢 避難施設別の案内
          </h3>
          {filteredFacilities.map((facility, index) => (
            <div
              key={index}
              className="p-4 bg-neutral-50 border-l-6 border-l-[#28a745] rounded-lg border border-neutral-200 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-neutral-800 m-0 flex items-center gap-1.5">
                  <span>{facility.icon}</span>
                  <span>{facility.name}</span>
                </h4>
              </div>
              <p className="text-xs md:text-sm text-neutral-600 m-0 leading-relaxed">
                {facility.desc}
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href={getMapSearchUrl(facility.searchTag)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 px-3 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-xs font-bold rounded-md shadow-2xs"
                >
                  🗺️ 周辺を探す ↗
                </a>
                <a
                  href={getWalkingRouteUrl(facility.searchTag)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1.5 px-3 bg-white hover:bg-neutral-100 text-[#28a745] border border-[#28a745] text-xs font-bold rounded-md shadow-2xs"
                >
                  🚶 ルート案内 ↗
                </a>
              </div>
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
