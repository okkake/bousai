import React, { useState, useCallback } from 'react';

interface HazardMapProps {
  onBack: () => void;
}

type HazardLayerType = 'flood' | 'sediment' | 'tsunami' | 'elevation';

interface RiskDiagnosis {
  buildingType: 'wood_house' | 'steel_house' | 'rc_mansion';
  floorLevel: '1f' | '2f' | '3f_plus';
  floodDepth: 'none' | 'shallow' | 'medium' | 'deep'; // none, 0.5m未満, 0.5~3m(1階没), 3m以上(2階没)
  sedimentZone: 'none' | 'yellow' | 'red'; // なし, イエロー(警戒), レッド(特別警戒)
  hasVulnerablePeople: boolean; // 高齢者・乳幼児等
}

export const HazardMap: React.FC<HazardMapProps> = ({ onBack }) => {
  // 緯度・経度・住所・標高ステート（初期値：東京都庁周辺）
  const [lat, setLat] = useState<number>(35.6895);
  const [lng, setLng] = useState<number>(139.6917);
  const [locationName, setLocationName] = useState<string>('東京都新宿区西新宿２丁目（東京都庁周辺）');
  const [elevation, setElevation] = useState<number | null>(38.5);
  
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationMsg, setLocationMsg] = useState<string>('現在地を取得するか、市区町村名・駅名で検索してください。');

  // 手動検索
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hazard_recent_searches');
      return saved ? JSON.parse(saved) : ['東京都荒川区', '大阪市此花区', '広島市安佐南区', '熱海市伊豆山'];
    } catch {
      return ['東京都荒川区', '大阪市此花区', '広島市安佐南区', '熱海市伊豆山'];
    }
  });

  // レイヤー
  const [activeLayer, setActiveLayer] = useState<HazardLayerType>('flood');
  const [mapZoom, setMapZoom] = useState<number>(15);

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

  // 国土交通省 重ねるハザードマップ公式URL（新タブ用）
  const getDisaportalUrl = () => {
    return `https://disaportal.gsi.go.jp/hazardmap/maps/index.html?ll=${lat},${lng}&z=${mapZoom}&base=pale&vs=c1j0l0u0t0h0z0`;
  };

  // 国土地理院・国交省 防災タイル埋め込みURL
  const getEmbedMapUrl = () => {
    let layerCode = 'std';
    if (activeLayer === 'elevation') {
      layerCode = 'relief';
    }
    return `https://maps.gsi.go.jp/?ll=${lat},${lng}&z=${mapZoom}&base=${layerCode}#${mapZoom}/${lat}/${lng}/&ls=${layerCode}&disp=1`;
  };

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
        level: 'warning',
        badge: '事前立退き避難を推奨',
        color: 'bg-amber-600 text-white',
        border: 'border-amber-500 bg-amber-50',
        action: '大雨警報や警戒レベル3が発表された段階で、明るいうちに安全な場所へ避難してください。',
        reason: '土砂災害警戒区域（イエローゾーン）は土石流やがけ崩れが到達する恐れがあります。夜間や豪雨ピーク時の避難は危険なため、早めの立ち退きが原則です。',
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
        badge: '自宅待機・垂直避難で安全確保',
        color: 'bg-emerald-600 text-white',
        border: 'border-emerald-500 bg-emerald-50',
        action: '床下浸水や道路冠水の恐れがありますが、自宅上階で待避可能です。排水溝の逆流や側溝への転落に注意してください。',
        reason: '0.5m未満の浸水深であれば、建物倒壊や溺水のリスクは極めて低いです。無理に浸水した道路へ出るより自宅待機が安全です。',
      };
    }

    // 5. 浸水・土砂想定なし
    return {
      level: 'safe',
      badge: '在宅避難（自宅待避）が基本',
      color: 'bg-emerald-700 text-white',
      border: 'border-emerald-500 bg-emerald-50',
      action: '現在の場所は主要な水害・土砂災害の危険区域外です。自宅が倒壊・延焼する危険がない限り、在宅避難を継続してください。',
      reason: '避難所の過密を防ぐためにも、ハザードマップで安全な地域に住んでいる方は、備蓄を用意して自宅で安全を確保することが推奨されています。',
    };
  };

  const evalResult = evaluateEvacuation();

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-5">
      {/* 画面ヘッダー */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-colors"
        >
          ← ホームに戻る
        </button>
        <div className="text-xs text-neutral-500 font-medium">国土交通省・国土地理院 連携</div>
      </div>

      {/* メインカード */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 border-l-6 border-l-[#e65100]">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold text-[#e65100] flex items-center gap-2 m-0">
            <span>🗺️</span>
            <span>ハザードマップ・リスク確認</span>
          </h1>
          <span className="text-2xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
            浸水・土砂・標高
          </span>
        </div>

        <p className="text-xs md:text-sm text-neutral-600 m-0 mb-4 leading-relaxed">
          現在地や自宅周辺の「浸水想定深」「土砂災害警戒区域」「海抜（標高）」を確認し、災害時に立ち退くべきか、垂直避難が可能かをシミュレーションできます。
        </p>

        {/* 現在地取得ボタン */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={isLocating}
          className="w-full py-3 px-4 bg-[#e65100] hover:bg-[#ef6c00] text-white rounded-lg text-sm md:text-base font-bold cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isLocating ? '📍 現在地・標高を取得中...' : '📍 現在地でハザードマップを確認'}</span>
        </button>

        {/* 状態・案内メッセージ */}
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg text-xs md:text-sm text-neutral-700 flex items-start gap-2 border border-neutral-200">
          <span className="shrink-0 mt-0.5">ℹ️</span>
          <span className="leading-relaxed">{locationMsg}</span>
        </div>

        {/* 手動検索 */}
        <div className="mt-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
          <label htmlFor="hazard-search" className="block text-xs font-bold text-neutral-800">
            🔍 市区町村名や駅名で検索
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

          {/* 最近の検索・クイックリンク */}
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
                  className="py-1 px-2 bg-white border border-neutral-300 hover:border-[#e65100] hover:text-[#e65100] rounded-md text-2xs md:text-xs text-neutral-700 transition-colors cursor-pointer"
                  title={item.desc}
                >
                  📍 {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 現在の表示地点 & 標高・海抜メーター */}
        <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-2xs font-bold text-amber-800 uppercase tracking-wide">対象地点</div>
              <div className="font-bold text-sm md:text-base text-neutral-900 leading-snug">
                {locationName}
              </div>
              <div className="text-2xs text-neutral-500 mt-0.5">
                緯度: {lat.toFixed(4)}° / 経度: {lng.toFixed(4)}°
              </div>
            </div>

            {/* 標高バッジ */}
            <div className="shrink-0 text-right bg-white px-3 py-2 rounded-xl border border-amber-300 shadow-2xs">
              <div className="text-2xs text-neutral-500 font-medium">海抜（標高）</div>
              <div className="text-lg md:text-xl font-black text-[#e65100] flex items-baseline justify-end gap-0.5">
                <span>{elevation !== null ? elevation : '---'}</span>
                <span className="text-xs text-neutral-700 font-normal">m</span>
              </div>
              {elevation !== null && elevation <= 0 && (
                <span className="text-2xs bg-red-600 text-white px-1.5 py-0.2 rounded font-bold inline-block mt-0.5 animate-pulse">
                  海抜ゼロm地帯
                </span>
              )}
            </div>
          </div>

          {elevation !== null && elevation <= 3 && (
            <div className="p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 font-medium flex items-center gap-1.5">
              <span>⚠️</span>
              <span>
                <strong>低地・ゼロメートル警戒：</strong>
                海抜3m以下の低地帯です。高潮・津波・大河川氾濫時の浸水深が大きくなりやすい地形です。
              </span>
            </div>
          )}
        </div>

        {/* 災害種別タブ & 公式ハザードマップ連携 */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-xs md:text-sm text-neutral-800">
              🗾 地図レイヤーの切り替え：
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMapZoom((prev) => Math.max(prev - 1, 10))}
                className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-md font-bold text-sm flex items-center justify-center cursor-pointer"
                title="縮小"
              >
                −
              </button>
              <span className="text-xs text-neutral-600 font-medium px-1">Lv.{mapZoom}</span>
              <button
                type="button"
                onClick={() => setMapZoom((prev) => Math.min(prev + 1, 18))}
                className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 rounded-md font-bold text-sm flex items-center justify-center cursor-pointer"
                title="拡大"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveLayer('flood')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeLayer === 'flood'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              🌊 洪水・浸水
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('sediment')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeLayer === 'sediment'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              ⛰️ 土砂災害
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('tsunami')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeLayer === 'tsunami'
                  ? 'bg-cyan-700 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              🌊 津波・高潮
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('elevation')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                activeLayer === 'elevation'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              📈 色別標高図
            </button>
          </div>

          {/* 地図埋め込みエリア（国土地理院・国交省 防災GIS） */}
          <div className="relative border border-neutral-300 rounded-xl overflow-hidden bg-neutral-100 shadow-inner">
            <iframe
              title="国土地理院 防災地形マップ"
              src={getEmbedMapUrl()}
              className="w-full h-[320px] md:h-[380px] border-none"
              loading="lazy"
            />
            {/* 地図中央ピンインジケーター */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none drop-shadow-md">
              <span className="text-3xl">📍</span>
            </div>
          </div>

          {/* 国交省 重ねるハザードマップ（全画面ポータル直通リンク） */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="text-xs text-blue-900 font-bold flex items-center gap-1.5">
              <span>🏛️</span>
              <span>国土交通省「重ねるハザードマップ」公式ポータル</span>
            </div>
            <p className="text-xs text-neutral-600 m-0 leading-relaxed">
              全域の浸水想定区域図や各自治体が発行する防災印刷用PDFハザードマップを、この地点の座標で直接開きます。
            </p>
            <a
              href={getDisaportalUrl()}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 bg-[#1976d2] hover:bg-[#1565c0] text-white text-center font-bold rounded-lg text-xs md:text-sm block shadow-2xs transition-colors"
            >
              🌐 国土交通省 重ねるハザードマップで詳しく開く ↗
            </a>
          </div>
        </div>
      </div>

      {/* わが家の避難判定シミュレーター */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 border-l-6 border-l-[#1976d2] space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 m-0">
              わが家の避難判定シミュレーター
            </h2>
            <p className="text-xs text-neutral-500 m-0">
              住まいの条件から「在宅垂直避難」か「事前立退き避難」かを自動判定
            </p>
          </div>
        </div>

        {/* 診断入力フォーム */}
        <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs md:text-sm">
          {/* 1. 建物の構造 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5">
              1. お住まいの建物構造
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
            <label className="font-bold text-neutral-800 block mb-1.5">
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
            <label className="font-bold text-neutral-800 block mb-1.5">
              3. ハザードマップ上の想定浸水深
            </label>
            <select
              value={diagnosis.floodDepth}
              onChange={(e) =>
                setDiagnosis((prev) => ({
                  ...prev,
                  floodDepth: e.target.value as RiskDiagnosis['floodDepth'],
                }))
              }
              className="w-full p-2 border border-neutral-300 rounded-lg bg-white text-neutral-800 text-xs md:text-sm font-medium"
            >
              <option value="none">浸水の想定なし（着色なし）</option>
              <option value="shallow">0.5m未満（大人の膝下・床下浸水）</option>
              <option value="medium">0.5m〜3.0m（1階床上〜1階水没）</option>
              <option value="deep">3.0m〜5.0m以上（2階軒下〜2階水没）</option>
            </select>
          </div>

          {/* 4. 土砂災害警戒区域 */}
          <div>
            <label className="font-bold text-neutral-800 block mb-1.5">
              4. 土砂災害警戒区域（急傾斜・土石流等）
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'none' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.sedimentZone === 'none'
                    ? 'border-[#1976d2] bg-blue-50 text-[#1976d2]'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                区域外（安全）
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'yellow' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.sedimentZone === 'yellow'
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                イエロー区域
              </button>
              <button
                type="button"
                onClick={() => setDiagnosis((prev) => ({ ...prev, sedimentZone: 'red' }))}
                className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer text-xs ${
                  diagnosis.sedimentZone === 'red'
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                レッド特別警戒
              </button>
            </div>
          </div>

          {/* 5. 配慮が必要な家族 */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={diagnosis.hasVulnerablePeople}
                onChange={(e) =>
                  setDiagnosis((prev) => ({ ...prev, hasVulnerablePeople: e.target.checked }))
                }
                className="w-4 h-4 text-[#1976d2] rounded border-neutral-300"
              />
              <span className="font-bold text-neutral-800">
                高齢者・乳幼児・自力避難が困難な家族がいる
              </span>
            </label>
          </div>
        </div>

        {/* 判定結果ボックス */}
        <div className={`p-4 rounded-xl border-2 space-y-2.5 ${evalResult.border}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-neutral-600">判定結果：</span>
            <span className={`py-1 px-3 rounded-full text-xs font-black shadow-2xs ${evalResult.color}`}>
              {evalResult.badge}
            </span>
          </div>

          <div className="text-sm md:text-base font-bold text-neutral-900 leading-snug">
            {evalResult.action}
          </div>

          <p className="text-xs text-neutral-700 m-0 leading-relaxed border-t border-neutral-200 pt-2">
            <strong>判定の根拠：</strong> {evalResult.reason}
          </p>
        </div>
      </div>

      {/* 浸水深ビジュアル解説 */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-3">
        <h3 className="text-base md:text-lg font-bold text-neutral-900 flex items-center gap-2 m-0">
          <span>📏</span>
          <span>浸水深と危険度（目安メーター）</span>
        </h3>

        <div className="space-y-2 text-xs md:text-sm">
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-red-50 border-l-4 border-l-red-600">
            <div className="w-16 shrink-0 font-black text-red-700">5.0m〜</div>
            <div>
              <div className="font-bold text-red-900">2階の軒下以上（2階水没）</div>
              <div className="text-neutral-600 text-xs">木造家屋は流出・水没。自宅待機は命に関わるため事前避難必須。</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50 border-l-4 border-l-orange-500">
            <div className="w-16 shrink-0 font-black text-orange-700">3.0m〜</div>
            <div>
              <div className="font-bold text-orange-900">2階の床面（1階天井水没）</div>
              <div className="text-neutral-600 text-xs">1階部分は完全に水没。2階以上へ垂直避難、または高台へ移動。</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50 border-l-4 border-l-amber-500">
            <div className="w-16 shrink-0 font-black text-amber-700">0.5m〜</div>
            <div>
              <div className="font-bold text-amber-900">大人の膝上〜1階床上浸水</div>
              <div className="text-neutral-600 text-xs">水圧でドアが開かなくなる。車は水没・走行不能。歩行避難は極めて危険。</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-sky-50 border-l-4 border-l-sky-500">
            <div className="w-16 shrink-0 font-black text-sky-700">〜0.5m</div>
            <div>
              <div className="font-bold text-sky-900">床下浸水・道路冠水</div>
              <div className="text-neutral-600 text-xs">側溝やマンホールのフタ外れに警戒。早めの備えで自宅待機可能。</div>
            </div>
          </div>
        </div>
      </div>

      {/* 土砂災害の前兆チェックリスト */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 space-y-3">
        <h3 className="text-base md:text-lg font-bold text-neutral-900 flex items-center gap-2 m-0">
          <span>⚠️</span>
          <span>土砂災害の危険な前兆サイン（直ちに避難！）</span>
        </h3>

        <ul className="space-y-2 text-xs md:text-sm text-neutral-800 m-0 p-0 list-none">
          <li className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <span className="text-red-600 font-bold">1.</span>
            <span>崖や斜面から小石がパラパラと落ちてくる</span>
          </li>
          <li className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <span className="text-red-600 font-bold">2.</span>
            <span>今まで湧いていなかった斜面から急に水が吹き出している、または湧き水が濁る</span>
          </li>
          <li className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <span className="text-red-600 font-bold">3.</span>
            <span>地面や擁壁、自宅の基礎に亀裂（ひび割れ）やズレが生じている</span>
          </li>
          <li className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <span className="text-red-600 font-bold">4.</span>
            <span>山鳴り（ゴロゴロという地鳴り）や、木が裂けるバキバキという音がする</span>
          </li>
          <li className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <span className="text-red-600 font-bold">5.</span>
            <span>川の水位が急激に下がる、または土の強い腐敗臭・焦げたような臭いが漂う</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
