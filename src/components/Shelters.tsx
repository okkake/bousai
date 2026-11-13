import React, { useState, useEffect, useCallback } from 'react';
import {
  ShelterIcon,
  EarthquakeIcon,
  TsunamiIcon,
  RainIcon,
  LocationPinIcon,
  SearchIcon,
  WalkIcon,
  MapFoldIcon,
  LightbulbIcon,
  SchoolIcon,
  CommunityIcon,
  GymIcon,
  ParkIcon,
  TsunamiBuildingIcon,
} from './Icons';

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

  // 地理院地図URL生成
  const getGsiMapUrl = () => {
    const lat = targetCoords?.lat ?? currentLocation?.lat ?? 35.6812;
    const lng = targetCoords?.lng ?? currentLocation?.lng ?? 139.7671;
    return `https://maps.gsi.go.jp/?ll=${lat},${lng}&z=15#15/${lat}/${lng}/&base=std&ls=std%7Cskhb01%7Cskhb02%7Cskhb03&blend=0&disp=1111`;
  };

  const getDisasterNotice = () => {
    switch (selectedDisaster) {
      case 'tsunami':
        return {
          title: '津波警戒時の避難先',
          icon: <TsunamiIcon className="w-4 h-4 text-[#0088cc] shrink-0" />,
          bg: 'bg-sky-50 border-sky-300 text-sky-950',
          advice: '海岸や河川からただちに離れ、「津波避難ビル（3階以上の頑丈なRC造）」や「指定の高台」へ避難してください。',
        };
      case 'flood':
        return {
          title: '大雨・水害時の避難先',
          icon: <RainIcon className="w-4 h-4 text-[#2196f3] shrink-0" />,
          bg: 'bg-blue-50 border-blue-300 text-blue-950',
          advice: '浸水想定区域外の高台避難所へ。夜間や浸水開始後の移動が危険な場合は、無理せず自宅や近隣の2階以上（垂直避難）を確保してください。',
        };
      case 'earthquake':
        return {
          title: '地震発生時の避難先',
          icon: <EarthquakeIcon className="w-4 h-4 text-[#d32f2f] shrink-0" />,
          bg: 'bg-red-50 border-red-300 text-red-950',
          advice: '身の安全を確保後、倒壊や火災の危険がある場合は指定の小中学校や「広域避難場所（大規模公園）」へ移動してください。',
        };
      default:
        return {
          title: '避難所の基本案内',
          icon: <ShelterIcon className="w-4 h-4 text-neutral-700 shrink-0" />,
          bg: 'bg-neutral-50 border-neutral-200 text-neutral-800',
          advice: '地域の指定避難所（小中学校・公民館・体育館）を確認し、避難経路の安全を確認しながら行動しましょう。',
        };
    }
  };

  const notice = getDisasterNotice();

  // 表示する施設リスト
  const facilities = [
    {
      icon: <SchoolIcon className="w-4.5 h-4.5 text-neutral-700" />,
      name: '小・中学校（指定避難所）',
      desc: '地域の中核となる指定一般避難所。食料・生活物資や宿泊スペースが配備されます。',
      suitableFor: ['all', 'earthquake', 'flood'],
      searchTag: '小学校 中学校 指定避難所',
    },
    {
      icon: <CommunityIcon className="w-4.5 h-4.5 text-neutral-700" />,
      name: '公民館・地域センター',
      desc: '地域の身近な避難所。情報伝達や一時的な避難所として利用されます。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '公民館 地域センター 避難所',
    },
    {
      icon: <GymIcon className="w-4.5 h-4.5 text-neutral-700" />,
      name: '体育館・スポーツセンター',
      desc: '耐震構造が整っており、大勢の避難者を受け入れられる拠点避難所です。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '体育館 避難所',
    },
    {
      icon: <ParkIcon className="w-4.5 h-4.5 text-neutral-700" />,
      name: '広域避難場所（大型公園・広場）',
      desc: '大地震時の大規模火災の延焼から身を守るための広大な避難場所です。',
      suitableFor: ['all', 'earthquake'],
      searchTag: '広域避難場所 公園',
    },
    {
      icon: <TsunamiBuildingIcon className="w-4.5 h-4.5 text-neutral-700" />,
      name: '津波避難ビル・高台避難場所',
      desc: '3階以上の鉄筋コンクリート造建物。津波発生時の緊急退避用です。',
      suitableFor: ['all', 'tsunami'],
      searchTag: '津波避難ビル 高台',
    },
  ];

  // 選択された災害種別に合致する施設を優先表示
  const filteredFacilities = facilities.filter(
    (f) => selectedDisaster === 'all' || f.suitableFor.includes(selectedDisaster)
  );

  return (
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-neutral-200/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-3 m-0">
            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
              <ShelterIcon className="w-5 h-5 text-sky-600" />
            </div>
            <span>避難場所・ルート案内</span>
          </h2>
          {currentLocation && (
            <span className="text-2xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
              GPS測位済
            </span>
          )}
        </div>

        {/* 災害種別フィルタータブ */}
        <div>
          <div className="text-xs font-bold text-neutral-700 mb-1.5">
            災害の種類を選択してください：
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedDisaster('all')}
              className={`min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center ${
                selectedDisaster === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('earthquake')}
              className={`min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                selectedDisaster === 'earthquake'
                  ? 'bg-[#d32f2f] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <EarthquakeIcon className="w-4 h-4 shrink-0" />
              <span>地震</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('tsunami')}
              className={`min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                selectedDisaster === 'tsunami'
                  ? 'bg-[#0088cc] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <TsunamiIcon className="w-4 h-4 shrink-0" />
              <span>津波</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDisaster('flood')}
              className={`min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                selectedDisaster === 'flood'
                  ? 'bg-[#2196f3] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <RainIcon className="w-4 h-4 shrink-0" />
              <span>水害</span>
            </button>
          </div>
        </div>

        {/* 災害種別に応じた注意書き・アドバイス */}
        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${notice.bg}`}>
          <div className="font-bold mb-1 flex items-center gap-1.5">
            {notice.icon}
            <span>{notice.title}</span>
          </div>
          <div>{notice.advice}</div>
        </div>

        {/* 現在地取得セクション */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs md:text-sm text-neutral-800 flex items-center gap-1.5">
              <LocationPinIcon className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>現在地から避難所を探す</span>
            </span>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isLocating ? '測位中...' : '現在地を取得'}
            </button>
          </div>

          <p className="text-2xs md:text-xs text-neutral-600 m-0 leading-relaxed">
            {locationMessage}
          </p>

          {/* 現在地からのワンタップアクション */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <a
              href={getMapSearchUrl('指定避難所')}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs md:text-sm font-bold rounded-xl text-center shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <SearchIcon className="w-4 h-4 shrink-0" />
              <span>Googleマップで周辺避難所を開く ↗</span>
            </a>
            <a
              href={getWalkingRouteUrl('最寄りの指定避難所')}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs md:text-sm font-bold rounded-xl text-center shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <WalkIcon className="w-4 h-4 shrink-0" />
              <span>最寄りの避難所へ徒歩ルート ↗</span>
            </a>
          </div>
        </div>

        {/* 市区町村・駅名での手動検索セクション */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-3">
          <label htmlFor="manual-search-input" className="font-bold text-xs md:text-sm text-neutral-800 flex items-center gap-1.5">
            <SearchIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
            <span>市区町村名や駅名で探す</span>
          </label>
          <p className="text-2xs text-neutral-500 m-0 leading-relaxed">
            家族の職場・学校や、離れて暮らす実家周辺の避難所を検索できます。
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              id="manual-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例：渋谷区、横浜駅、大阪市北区"
              className="flex-1 p-2.5 border border-neutral-300 rounded-xl text-xs md:text-sm bg-white text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#1976d2]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs md:text-sm font-bold cursor-pointer transition-colors shadow-2xs shrink-0 disabled:opacity-50"
            >
              {isSearching ? '検索中' : '検索'}
            </button>
          </form>

          {/* 検索履歴 / クイック選択 */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-2xs text-neutral-600">
              <span className="font-semibold text-neutral-500">最近の検索：</span>
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRecent(item)}
                  className="py-0.5 px-2 bg-white border border-neutral-300 rounded-md hover:border-[#1976d2] hover:text-[#1976d2] transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {appliedSearch && (
            <div className="pt-2 border-t border-neutral-200/80 flex flex-col sm:flex-row gap-2">
              <a
                href={getMapSearchUrl('指定避難所')}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-bold rounded-lg text-center transition-colors block"
              >
                「{appliedSearch}」周辺の避難所を地図で開く ↗
              </a>
              <a
                href={getWalkingRouteUrl('最寄りの指定避難所')}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-lg text-center transition-colors block"
              >
                「{appliedSearch}」からの徒歩ルート ↗
              </a>
            </div>
          )}
        </div>

        {/* 国土地理院・指定緊急避難場所マップ展開 */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGsiMap(!showGsiMap)}
            className="w-full p-3 bg-neutral-100 hover:bg-neutral-200/80 text-left font-bold text-xs md:text-sm text-neutral-800 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MapFoldIcon className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>国土地理院 指定緊急避難場所マップを表示（ブラウザ内地図）</span>
            </span>
            <span className="text-xs">{showGsiMap ? '▲ 閉じる' : '▼ 表示する'}</span>
          </button>

          {showGsiMap && (
            <div className="p-3 bg-white space-y-2">
              <p className="text-2xs text-neutral-500 m-0">
                国土地理院の公的データベースに基づく全国の指定緊急避難場所マップです。
              </p>
              <div className="w-full h-80 sm:h-96 md:h-[460px] rounded-xl overflow-hidden border border-neutral-300 relative bg-neutral-100">
                <iframe
                  title="国土地理院 指定緊急避難場所マップ"
                  src={getGsiMapUrl()}
                  className="w-full h-full border-none"
                  loading="lazy"
                />
              </div>
              <div className="text-right">
                <a
                  href={getGsiMapUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs text-[#1976d2] hover:underline font-bold"
                >
                  国土地理院地図を別画面で全画面表示 ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 施設種別ごとの検索リスト */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold text-neutral-800 flex items-center justify-between">
            <span>施設種別から直接探す：</span>
            <span className="text-2xs text-neutral-400 font-normal">
              {selectedDisaster !== 'all' && '※選択中の災害に適した施設を優先表示'}
            </span>
          </div>

          <div className="space-y-2">
            {filteredFacilities.map((fac, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                      {fac.icon}
                    </div>
                    <span className="truncate">{fac.name}</span>
                  </div>
                  <p className="text-2xs text-neutral-500 m-0 leading-relaxed truncate pl-9">
                    {fac.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={getMapSearchUrl(fac.searchTag)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-2xs font-bold transition-colors block text-center"
                  >
                    探す ↗
                  </a>
                  <a
                    href={getWalkingRouteUrl(fac.searchTag)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-2xs font-medium transition-colors block text-center"
                  >
                    ルート ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 避難時のチェック事項 */}
        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2 text-xs text-amber-950">
          <div className="font-bold flex items-center gap-1.5">
            <LightbulbIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>避難所へ向かう前の重要チェック</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-2xs leading-relaxed m-0 text-neutral-700">
            <li>ブレーカーを落とし、ガスの元栓を閉める（通電火災防止）</li>
            <li>底の厚い靴（スニーカー）を履く（長靴は水が入ると脱げなくなるため危険）</li>
            <li>玄関に避難先と日時を書いたメモを残す</li>
            <li>一人で行動せず、近所と声を掛け合い複数人で避難する</li>
          </ul>
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
