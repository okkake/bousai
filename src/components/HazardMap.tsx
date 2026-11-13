import React, { useState, useCallback, useMemo } from 'react';
import {
  HazardMapIcon,
  LocationPinIcon,
  InfoIcon,
  SearchIcon,
  MapFoldIcon,
  RefreshIcon,
  RainIcon,
  EarthquakeIcon,
  HomeIcon,
  WarningIcon,
} from './Icons';

interface HazardMapProps {
  onBack: () => void;
}

interface RiskDiagnosis {
  buildingType: 'wood_house' | 'steel_house' | 'rc_mansion';
  floorLevel: '1f' | '2f' | '3f_plus';
  floodDepth: 'none' | 'shallow' | 'medium' | 'deep'; // none, 0.5m未満, 0.5~3m(1階没), 3m以上(2階没)
  sedimentZone: 'none' | 'yellow' | 'red'; // なし, イエロー(警戒), レッド(特別警戒)
  hasVulnerablePeople: boolean; // 高齢者・乳幼児等
}

export const HazardMap: React.FC<HazardMapProps> = ({ onBack }) => {
  // 緯度・経度・住所・標高ステート（初期値：東京都江東区周辺 - 代表的な低地・水害警戒地域）
  const [lat, setLat] = useState<number>(35.6728);
  const [lng, setLng] = useState<number>(139.8174);
  const [locationName, setLocationName] = useState<string>('東京都江東区東陽（江東ゼロメートル地帯周辺）');
  const [elevation, setElevation] = useState<number | null>(1.2);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationMsg, setLocationMsg] = useState<string>('現在地を取得するか、市区町村名・駅名で検索してください。');

  // 手動検索
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hazard_recent_searches');
      return saved ? JSON.parse(saved) : ['東京都江東区', '大阪市此花区', '広島市安佐南区', '熱海市伊豆山'];
    } catch {
      return ['東京都江東区', '大阪市此花区', '広島市安佐南区', '熱海市伊豆山'];
    }
  });

  // 重ねるハザードマップ再読み込みキー
  const [iframeKey, setIframeKey] = useState<number>(0);

  // 避難判定シミュレーター
  const [diagnosis, setDiagnosis] = useState<RiskDiagnosis>({
    buildingType: 'wood_house',
    floorLevel: '2f',
    floodDepth: 'medium',
    sedimentZone: 'none',
    hasVulnerablePeople: false,
  });

  // 標高取得関数
  const fetchElevation = useCallback(async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(`/api/elevation?lat=${targetLat}&lon=${targetLng}`);
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.elevation === 'number') {
        setElevation(Math.round(data.elevation * 10) / 10);
      } else {
        setElevation(null);
      }
    } catch (e) {
      console.error('Failed to get elevation:', e);
      setElevation(null);
    }
  }, []);

  // 現在地取得
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMsg('お使いのブラウザでは現在地を取得できません。手動検索をご利用ください。');
      return;
    }

    setIsLocating(true);
    setLocationMsg('現在地と標高を取得中...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;
        setLat(curLat);
        setLng(curLng);
        setIsLocating(false);

        // 標高取得
        fetchElevation(curLat, curLng);

        // 住所逆ジオコーディング
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${curLat}&lon=${curLng}`);
          const data = await res.json();
          const name = data.formatted || `${curLat.toFixed(3)}°, ${curLng.toFixed(3)}°周辺`;
          setLocationName(name);
          setLocationMsg(`現在地を取得しました：${name}`);
        } catch {
          setLocationName(`北緯${curLat.toFixed(3)}°, 東経${curLng.toFixed(3)}°周辺`);
          setLocationMsg('現在地を取得しました。');
        }
      },
      (err) => {
        setIsLocating(false);
        console.error(err);
        setLocationMsg('現在地を取得できませんでした。ブラウザの位置情報許可を確認するか、手動で検索してください。');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [fetchElevation]);

  // 地名・駅名検索
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setLocationMsg(`「${query}」を検索中...`);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Location not found');
      const data = await res.json();

      setLat(data.lat);
      setLng(data.lon);
      setLocationName(data.displayName || query);
      setLocationMsg(`「${query}」のハザードマップを表示中`);

      // 標高取得
      fetchElevation(data.lat, data.lon);

      // 検索履歴保存
      const updated = [query, ...recentSearches.filter((item) => item !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('hazard_recent_searches', JSON.stringify(updated));
    } catch {
      setLocationMsg(`「${query}」が見つかりませんでした。別の地名や市区町村名をお試しください。`);
    } finally {
      setIsSearching(false);
    }
  };

  // 代表エリアクイック選択
  const quickLocations = [
    { label: '荒川・江東低地帯', query: '東京都江東区南砂', desc: '海抜ゼロメートル地帯・大規模水害' },
    { label: '多摩川低地', query: '川崎市中原区武蔵小杉', desc: '内水氾濫・都市型水害' },
    { label: '大阪・淀川周辺', query: '大阪市此花区', desc: '海抜ゼロメートル・津波浸水' },
    { label: '広島・土砂警戒', query: '広島市安佐南区八木', desc: '土石流・急傾斜危険区域' },
    { label: '熱海・急傾斜地', query: '静岡県熱海市伊豆山', desc: '土石流災害危険エリア' },
  ];

  // 国土交通省 重ねるハザードマップ（disaportal.gsi.go.jp）URL生成
  const { embedUrl, externalUrl } = useMemo(() => {
    const layerList = [
      'flood_list_l2,0.8',
      'flood_list,0.8',
      'dosha_keikai_kyukeisha,0.8',
      'dosha_keikai_dosekiryu,0.8',
      'dosha_keikai_jisuberi,0.8',
      'tsunamishinsui_raster,0.8',
    ];
    const lsQuery = `&ls=${encodeURIComponent(layerList.join('|'))}`;
    const roundLat = Math.round(lat * 1000000) / 1000000;
    const roundLng = Math.round(lng * 1000000) / 1000000;

    const baseDisaportal = `https://disaportal.gsi.go.jp/hazardmap/maps/index.html?ll=${roundLat},${roundLng}&z=15&base=pale${lsQuery}&disp=1`;

    return {
      embedUrl: baseDisaportal,
      externalUrl: baseDisaportal,
    };
  }, [lat, lng]);

  // わが家の避難判定ロジック
  const evaluateEvacuation = () => {
    const { buildingType, floorLevel, floodDepth, sedimentZone, hasVulnerablePeople } = diagnosis;

    // 1. 土砂災害レッドゾーン・イエローゾーン
    if (sedimentZone === 'red') {
      return {
        level: 'danger',
        badge: '即時立退き避難（極めて危険）',
        color: 'bg-red-700 text-white',
        border: 'border-red-600 bg-red-50',
        action: '警戒レベル3（高齢者等避難）または豪雨の予兆時点で、安全な親戚宅や避難所へ立ち退き避難してください。',
        reason: '土砂災害特別警戒区域（レッドゾーン）では、木造住宅だけでなく鉄筋RC造でも建物ごと倒壊・埋没するリスクがあります。家の中にとどまる垂直避難は命に関わります。',
      };
    }

    if (sedimentZone === 'yellow') {
      return {
        level: 'danger',
        badge: '早期の立退き避難を強く推奨',
        color: 'bg-orange-600 text-white',
        border: 'border-orange-500 bg-orange-50',
        action: '崖や斜面から離れた2階以上の部屋に待避するか、大雨が激しくなる前に安全な避難所へ移動してください。',
        reason: '土砂災害警戒区域（イエローゾーン）では、土石流やがけ崩れの恐れがあります。夜間の外出は危険を伴うため明るいうちの移動が鉄則です。',
      };
    }

    // 2. 洪水・浸水深 3m以上（2階軒下以上水没）
    if (floodDepth === 'deep') {
      if (buildingType === 'rc_mansion' && floorLevel === '3f_plus') {
        return {
          level: 'caution',
          badge: '垂直避難（自宅待避）可能・孤立注意',
          color: 'bg-blue-600 text-white',
          border: 'border-blue-500 bg-blue-50',
          action: '3階以上の頑丈なマンションであれば浸水を免れる可能性が高いですが、水没による停電・断水・数日間の孤立に備えて備蓄を万全にしてください。',
          reason: '浸水深が3m〜5mを超える場合でも、RC造の上層階であれば水没は免れます。ただしライフライン途絶を想定した準備が必要です。',
        };
      } else {
        return {
          level: 'danger',
          badge: '事前立退き避難が必須（2階水没リスク）',
          color: 'bg-red-600 text-white',
          border: 'border-red-500 bg-red-50',
          action: '警戒レベル3〜4までに、水害リスクのない高台や広域避難場所へ立ち退き避難してください。',
          reason: '想定浸水深が3m〜5m以上の場合、木造住宅や2階建ての家は2階部分まで水没し溺死する恐れがあります。自宅にとどまる垂直避難は極めて危険です。',
        };
      }
    }

    // 3. 洪水・浸水深 0.5m〜3m（1階床上浸水）
    if (floodDepth === 'medium') {
      if (floorLevel === '1f') {
        return {
          level: 'danger',
          badge: '立退き避難または2階以上へ移動',
          color: 'bg-amber-600 text-white',
          border: 'border-amber-500 bg-amber-50',
          action: hasVulnerablePeople
            ? '高齢者や小さなお子様がいる場合は、警戒レベル3で早めに指定避難所やホテルへ立ち退き避難してください。'
            : '2階以上の居室へ貴重品・水・食料・モバイルバッテリーを上げて待避（垂直避難）するか、早めに避難所へ移動してください。',
          reason: '1階床上に浸水（0.5m〜3m）すると、家具が浮き、玄関ドアが水圧で開かなくなります。1階での就寝や待避は避けましょう。',
        };
      } else {
        return {
          level: 'safe',
          badge: '垂直避難（2階・上層階待機）可能',
          color: 'bg-emerald-600 text-white',
          border: 'border-emerald-500 bg-emerald-50',
          action: '2階以上の安全な部屋で待避可能です。停電や断水に備え、水・食料・充電器を2階に確保しておきましょう。',
          reason: '2階以上であれば水没は免れます。豪雨で外の水位が上がってからの外出避難は流される危険があるため、家の上層階にとどまる方が安全な場合があります。',
        };
      }
    }

    // 4. 0.5m未満（床下浸水程度）
    if (floodDepth === 'shallow') {
      return {
        level: 'safe',
        badge: '自宅2階待避または警戒待機',
        color: 'bg-emerald-600 text-white',
        border: 'border-emerald-500 bg-emerald-50',
        action: '床下浸水の恐れがあります。貴重品や電化製品を少し高い場所に移動し、外出を控えて最新の気象情報を確認してください。',
        reason: '0.5m未満の浸水では建物倒壊の危険は低いため、むやみな外出よりも屋内での待機が推奨されます。',
      };
    }

    // 5. 浸水想定なし
    return {
      level: 'safe',
      badge: '自宅待機可能（想定浸水深なし）',
      color: 'bg-emerald-600 text-white',
      border: 'border-emerald-500 bg-emerald-50',
      action: '現在の想定では直接の水没リスクは低いです。河川水位の増水や周辺道路の冠水に注意し、最新の警戒レベルを注視してください。',
      reason: '浸水想定・土砂災害区域外ですが、想定を超える未曾有の豪雨時には周囲の排水溝の溢水（内水氾濫）に注意が必要です。',
    };
  };

  const evalResult = evaluateEvacuation();

  return (
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      {/* メインカード */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-neutral-200/90">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-3 m-0">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
              <HazardMapIcon className="w-5 h-5 text-amber-600" />
            </div>
            <span>ハザードマップ・リスク確認</span>
          </h2>
          <span className="text-2xs text-neutral-500 font-medium">国土交通省・国土地理院連携</span>
        </div>

        <p className="text-xs md:text-sm text-neutral-600 m-0 mb-4 leading-relaxed">
          現在地や自宅周辺の「浸水想定深」「土砂災害警戒区域」「海抜（標高）」を重ね合わせて確認し、垂直避難や事前立ち退き避難の判断に役立てられます。
        </p>

        {/* 現在地取得ボタン */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={isLocating}
          className="w-full py-3 px-4 bg-[#e65100] hover:bg-[#ef6c00] text-white rounded-lg text-sm md:text-base font-bold cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LocationPinIcon className="w-4 h-4 shrink-0 text-white" />
          <span>{isLocating ? '現在地・標高を取得中...' : '現在地でハザードマップを確認'}</span>
        </button>

        {/* 状態・案内メッセージ */}
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg text-xs md:text-sm text-neutral-700 flex items-start gap-2 border border-neutral-200">
          <InfoIcon className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{locationMsg}</span>
        </div>

        {/* 手動検索 */}
        <div className="mt-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
          <label htmlFor="hazard-search" className="block text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <SearchIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
            <span>市区町村名や駅名で検索</span>
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              id="hazard-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例：江東区南砂、武蔵小杉駅、広島市安佐南区"
              className="flex-1 p-2 border border-neutral-300 rounded-lg text-xs md:text-sm bg-white text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#e65100]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="py-2 px-4 bg-[#e65100] hover:bg-[#ef6c00] text-white rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors shadow-2xs shrink-0 disabled:opacity-50"
            >
              {isSearching ? '検索中...' : '検索'}
            </button>
          </form>

          {/* 代表エリアクイック選択 */}
          <div className="space-y-1.5 pt-1">
            <div className="text-2xs text-neutral-500 font-bold">注目・代表的な災害リスク地域：</div>
            <div className="flex flex-wrap gap-1.5">
              {quickLocations.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item.query);
                    handleSearch(undefined, item.query);
                  }}
                  className="py-1 px-2 bg-white border border-neutral-300 hover:border-[#e65100] hover:text-[#e65100] rounded-md text-2xs md:text-xs text-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                  title={item.desc}
                >
                  <LocationPinIcon className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 現在の表示地点 & 標高・海抜メーター */}
        <div className="mt-4 p-4 rounded-xl border-2 border-amber-400 bg-amber-50/50 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-amber-900 block">対象地点</span>
              <div className="font-extrabold text-sm md:text-base text-neutral-900 truncate">
                {locationName}
              </div>
              <div className="text-2xs text-neutral-500 font-mono mt-0.5">
                緯度: {lat.toFixed(4)}° / 経度: {lng.toFixed(4)}°
              </div>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-amber-200 text-center shrink-0">
              <span className="text-2xs text-neutral-500 block font-bold">海抜（標高）</span>
              <div className="text-2xl font-black text-[#e65100] font-mono leading-none mt-0.5">
                {elevation !== null ? elevation : '---'}
                <span className="text-xs text-neutral-500 font-normal ml-0.5">m</span>
              </div>
            </div>
          </div>

          {elevation !== null && elevation <= 3.0 && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950 font-medium flex items-start gap-1.5 leading-relaxed">
              <WarningIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>低地・ゼロメートル警戒：</strong>
                海抜3m以下の低地帯です。高潮・津波・大河川氾濫時の浸水深が大きくなりやすい地形です。
              </span>
            </div>
          )}
        </div>

        {/* 重ねるハザードマップ（地図表示） */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-xs md:text-sm text-neutral-900 flex items-center gap-1.5">
              <MapFoldIcon className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>国土交通省 重ねるハザードマップ</span>
            </span>
            <button
              type="button"
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer text-neutral-700 border border-neutral-300"
              title="地図を再読み込み"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <span>再読み込み</span>
            </button>
          </div>

          {/* 地図埋め込みエリア（国土交通省 重ねるハザードマップ公式GIS） */}
          <div className="relative border-2 border-neutral-300 rounded-xl overflow-hidden bg-neutral-100 shadow-inner">
            <iframe
              key={iframeKey}
              title="国土交通省 重ねるハザードマップ"
              src={embedUrl}
              className="w-full h-[380px] sm:h-[460px] md:h-[520px] border-none"
              loading="lazy"
            />
            {/* 地図中央ピンインジケーター */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none drop-shadow-md z-10 flex flex-col items-center">
              <LocationPinIcon className="w-8 h-8 text-red-600 drop-shadow-md" />
            </div>
          </div>

          {/* 重ねるハザードマップの凡例ガイド */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-neutral-800 flex items-center justify-between">
              <span>地図の色の見方（凡例）：</span>
              <span className="text-2xs text-neutral-500">国土交通省 統一規格</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs md:text-xs">
              {/* 洪水凡例 */}
              <div className="space-y-1 bg-white p-2 rounded-lg border border-neutral-200">
                <div className="font-bold text-blue-900 border-b border-neutral-100 pb-0.5 flex items-center gap-1.5">
                  <RainIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>洪水浸水想定区域（浸水深）</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ff28ff] rounded-xs shrink-0"></span>
                    <span><strong>5.0m以上：</strong> 2階軒下以上水没（即時立退き）</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ff80ff] rounded-xs shrink-0"></span>
                    <span><strong>3.0〜5.0m：</strong> 2階床面水没（2階床上浸水）</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ffc800] rounded-xs shrink-0"></span>
                    <span><strong>0.5〜3.0m：</strong> 1階床上〜1階天井水没</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ffff00] rounded-xs shrink-0"></span>
                    <span><strong>0.5m未満：</strong> 床下浸水・道路冠水</span>
                  </div>
                </div>
              </div>

              {/* 土砂災害凡例 */}
              <div className="space-y-1 bg-white p-2 rounded-lg border border-neutral-200">
                <div className="font-bold text-amber-900 border-b border-neutral-100 pb-0.5 flex items-center gap-1.5">
                  <EarthquakeIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>土砂災害警戒区域</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ff0000] rounded-xs shrink-0"></span>
                    <span><strong>特別警戒区域（レッド）：</strong> 建物倒壊・生命に著しい危害</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#ffcc00] rounded-xs shrink-0"></span>
                    <span><strong>警戒区域（イエロー）：</strong> 土石流・急傾斜地崩壊の恐れ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-[#0088cc] rounded-xs shrink-0"></span>
                    <span><strong>津波浸水想定：</strong> 津波による浸水深</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 避難判定シミュレーター */}
        <div className="mt-5 p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3.5">
          <div>
            <h3 className="font-bold text-sm md:text-base text-neutral-900 m-0 flex items-center gap-1.5">
              <HomeIcon className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>自宅にとどまれる？避難判定シミュレーター</span>
            </h3>
            <p className="text-2xs md:text-xs text-neutral-600 m-0 mt-0.5">
              上の地図で確認した浸水深や土砂リスクと、住まいの条件から「垂直避難」か「立ち退き避難」かを判断します。
            </p>
          </div>

          {/* 1. 建物構造 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5 text-xs">
              1. 自宅の建物の構造
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, buildingType: 'wood_house' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.buildingType === 'wood_house'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                木造戸建て
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, buildingType: 'steel_house' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.buildingType === 'steel_house'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                鉄骨プレハブ
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, buildingType: 'rc_mansion' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.buildingType === 'rc_mansion'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                RC造マンション
              </button>
            </div>
          </div>

          {/* 2. 居室の階数 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5 text-xs">
              2. 主に過ごす居室・就寝階
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floorLevel: '1f' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.floorLevel === '1f'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                1階
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floorLevel: '2f' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.floorLevel === '2f'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                2階
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floorLevel: '3f_plus' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.floorLevel === '3f_plus'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                3階以上
              </button>
            </div>
          </div>

          {/* 3. 周辺の想定浸水深 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5 text-xs">
              3. 上の地図で確認した周辺の想定浸水深
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floodDepth: 'none' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.floodDepth === 'none'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2] font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                色なし（想定浸水深なし）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floodDepth: 'shallow' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.floodDepth === 'shallow'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2] font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                黄色（0.5m未満・床下）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floodDepth: 'medium' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.floodDepth === 'medium'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2] font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                橙色〜赤（0.5〜3m・1階水没）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, floodDepth: 'deep' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.floodDepth === 'deep'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2] font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                ピンク〜紫（3m以上・2階水没）
              </button>
            </div>
          </div>

          {/* 4. 土砂災害警戒区域 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5 text-xs">
              4. 土砂災害警戒区域（レッド・イエロー）
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'none' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.sedimentZone === 'none'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2] font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                区域外（色なし）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'yellow' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.sedimentZone === 'yellow'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                警戒区域（イエロー）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'red' }))}
                className={`p-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                  diagnosis.sedimentZone === 'red'
                    ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                特別警戒（レッド）
              </button>
            </div>
          </div>

          {/* 5. 高齢者・乳幼児の同居 */}
          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-300 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={diagnosis.hasVulnerablePeople}
              onChange={(e) =>
                setDiagnosis((prev) => ({ ...prev, hasVulnerablePeople: e.target.checked }))
              }
              className="w-4 h-4 rounded text-[#1976d2] cursor-pointer"
            />
            <span className="font-bold text-neutral-800">
              高齢者、乳幼児、要介護者など避難に時間のかかる人が同居している
            </span>
          </label>

          {/* 判定結果 */}
          <div className={`p-4 rounded-xl border-2 space-y-2 ${evalResult.border}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-neutral-800">避難行動の判定結果：</span>
              <span className={`text-2xs font-extrabold px-2.5 py-1 rounded-full ${evalResult.color}`}>
                {evalResult.badge}
              </span>
            </div>

            <div className="font-bold text-sm text-neutral-900 leading-snug">
              {evalResult.action}
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed m-0 border-t border-neutral-200/60 pt-2">
              {evalResult.reason}
            </p>
          </div>
        </div>

        {/* 外部リンク案内 */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-neutral-500">国土交通省 ハザードマップポータルサイト</span>
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#1976d2] hover:underline font-bold"
          >
            公式ポータルを別画面で開く ↗
          </a>
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
