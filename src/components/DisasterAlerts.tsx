import React, { useState, useEffect, useCallback } from 'react';
import { EarthquakeData, TsunamiData, WeatherData, ScreenType } from '../types';

interface DisasterAlertsProps {
  onBack: () => void;
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export const DisasterAlerts: React.FC<DisasterAlertsProps> = ({ onBack }) => {
  const [earthquake, setEarthquake] = useState<EarthquakeData | null>(null);
  const [earthquakeLoading, setEarthquakeLoading] = useState(false);
  const [earthquakeLastChecked, setEarthquakeLastChecked] = useState<string>('まだ確認していません');

  const [tsunami, setTsunami] = useState<TsunamiData | null>(null);

  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>({
    status: '未選択',
    area: '---',
    warning: '都道府県を選択してください',
    details: [],
  });
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch Earthquake
  const fetchEarthquake = useCallback(async () => {
    setEarthquakeLoading(true);
    try {
      const res = await fetch('/api/earthquake');
      const data = await res.json();
      setEarthquake(data);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setEarthquakeLastChecked(timeStr);
    } catch (err) {
      console.error(err);
      setEarthquake({
        time: new Date().toISOString(),
        area: '取得エラー',
        intensity: '---',
        magnitude: '---',
        warning: '⚠️ 災害情報を取得できませんでした',
      });
      setEarthquakeLastChecked('取得失敗');
    } finally {
      setEarthquakeLoading(false);
    }
  }, []);

  // Fetch Tsunami
  const fetchTsunami = useCallback(async () => {
    try {
      const res = await fetch('/api/tsunami');
      const data = await res.json();
      setTsunami(data);
    } catch (err) {
      console.error(err);
      setTsunami({
        status: '取得失敗',
        area: '---',
        warning: '⚠️ 津波情報を取得できませんでした',
      });
    }
  }, []);

  // Fetch Weather
  const fetchWeather = useCallback(async (pref: string) => {
    if (!pref) {
      setWeather({
        status: '未選択',
        area: '---',
        warning: '都道府県を選択してください',
        details: [],
      });
      return;
    }
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?prefecture=${encodeURIComponent(pref)}`);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      console.error(err);
      setWeather({
        status: '取得失敗',
        area: pref,
        warning: '⚠️ 気象警報・注意報を取得できませんでした',
        details: [],
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Initial load & 5 minute interval
  useEffect(() => {
    fetchEarthquake();
    fetchTsunami();
    fetchWeather(selectedPrefecture);

    const interval = setInterval(() => {
      fetchEarthquake();
      fetchTsunami();
      fetchWeather(selectedPrefecture);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchEarthquake, fetchTsunami, fetchWeather, selectedPrefecture]);

  // Overall status styling
  const getOverallStatus = () => {
    const status = weather?.status || '';
    if (status === '特別警報') {
      return {
        className: 'overall-emergency',
        text: '⬛ 現在、特別警報が発表されています',
      };
    } else if (status === '危険警報') {
      return {
        className: 'overall-critical',
        text: '🟪 現在、危険警報が発表されています',
      };
    } else if (status === '警報') {
      return {
        className: 'overall-danger',
        text: '🟥 現在、警報が発表されています',
      };
    } else if (status === '注意報') {
      return {
        className: 'overall-warning',
        text: '🟨 現在、注意報が発表されています',
      };
    }
    return {
      className: 'overall-safe',
      text: '🟩 現在、気象警報・注意報はありません',
    };
  };

  const overall = getOverallStatus();

  // Earthquake card border class
  const getEarthquakeCardClass = () => {
    const intensity = String(earthquake?.intensity || '');
    if (intensity.includes('7')) return 'earthquake-emergency';
    if (intensity.includes('6')) return 'earthquake-red';
    if (intensity.includes('5')) return 'earthquake-orange';
    if (intensity.includes('4')) return 'earthquake-yellow';
    return 'earthquake-safe';
  };

  // Earthquake warning message
  const getEarthquakeWarningText = () => {
    if (!earthquake) return '情報を確認してください';
    const intensity = String(earthquake.intensity);
    if (intensity.includes('7')) return '🚨 非常に強い揺れです！安全な場所へ避難してください';
    if (intensity.includes('6')) return '🟪 強い揺れに注意してください';
    if (intensity.includes('5')) return '🟥 強い揺れに注意してください';
    if (intensity.includes('4')) return '🟨 揺れに注意してください';
    return earthquake.warning || '🟩 現在、大きな揺れは確認されていません';
  };

  // Weather card border class
  const getWeatherCardClass = () => {
    const status = weather?.status;
    if (status === '特別警報') return 'weather-emergency';
    if (status === '危険警報') return 'weather-critical';
    if (status === '警報') return 'weather-danger';
    if (status === '注意報') return 'weather-warning';
    return 'weather-safe';
  };

  // Weather warning box style
  const getWeatherWarningBoxStyle = () => {
    const status = weather?.status;
    if (status === '特別警報') {
      return 'bg-neutral-900 border-2 border-neutral-800 text-white';
    } else if (status === '危険警報') {
      return 'bg-purple-50 border-2 border-[#8000cc] text-[#5a008f]';
    } else if (status === '警報') {
      return 'bg-red-50 border-2 border-[#dc3545] text-[#b00000]';
    } else if (status === '注意報') {
      return 'bg-amber-50 border-2 border-[#ffc107] text-amber-950';
    } else if (status === '発表なし') {
      return 'bg-emerald-50 border-2 border-[#28a745] text-emerald-950';
    }
    return 'bg-amber-50 border border-amber-200 text-amber-950';
  };

  // Format date
  const formatEarthquakeDate = (timeStr?: string) => {
    if (!timeStr) return '---';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="w-[90%] max-w-[600px] mx-auto my-6 space-y-6">
      {/* ページ上部の危険度表示 */}
      <div className={`p-4 rounded-xl text-center text-base md:text-lg font-bold shadow-md transition-colors ${overall.className}`}>
        {overall.text}
      </div>

      {/* 地震情報 */}
      <div className={`bg-white rounded-xl p-5 shadow-md border-y border-r border-neutral-100 ${getEarthquakeCardClass()}`}>
        <h2 className="text-xl font-bold text-[#d32f2f] mb-3 flex items-center gap-2">
          🟥 地震
        </h2>

        <div className="space-y-2 text-neutral-800 text-sm md:text-base">
          <p className="my-1">
            <strong className="text-neutral-900">発生時刻：</strong>
            <span>{formatEarthquakeDate(earthquake?.time)}</span>
          </p>
          <p className="my-1">
            <strong className="text-neutral-900">震源地：</strong>
            <span>{earthquake?.area || '---'}</span>
          </p>
          <p className="my-1">
            <strong className="text-neutral-900">最大震度：</strong>
            <span className="font-semibold text-red-600">{earthquake?.intensity || '---'}</span>
          </p>
          <p className="my-1">
            <strong className="text-neutral-900">マグニチュード：</strong>
            <span>{earthquake?.magnitude || '---'}</span>
          </p>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm md:text-base font-bold text-amber-900">
          {getEarthquakeWarningText()}
        </div>

        <button
          type="button"
          onClick={fetchEarthquake}
          disabled={earthquakeLoading}
          className="w-full mt-4 py-3 px-4 bg-[#1976d2] hover:bg-[#1565c0] disabled:bg-neutral-400 text-white rounded-lg text-base font-bold cursor-pointer transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-[#1976d2]"
        >
          {earthquakeLoading ? '🔄 最新情報を確認中...' : '🔄 最新情報を確認'}
        </button>

        <p className="text-center text-xs text-neutral-500 mt-2">
          最終確認：{earthquakeLastChecked}
        </p>
      </div>

      {/* 津波情報 */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-neutral-100 border-l-6 border-l-[#0088cc]">
        <h2 className="text-xl font-bold text-[#0088cc] mb-3 flex items-center gap-2">
          🌊 津波情報
        </h2>

        <div className="space-y-2 text-neutral-800 text-sm md:text-base">
          <p className="my-1">
            <strong className="text-neutral-900">発表状況：</strong>
            <span className="font-semibold">{tsunami?.status || '確認中...'}</span>
          </p>
          <p className="my-1">
            <strong className="text-neutral-900">対象地域：</strong>
            <span>{tsunami?.area || '---'}</span>
          </p>
        </div>

        <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm md:text-base font-bold text-sky-950">
          {tsunami?.warning || '津波情報を確認しています'}
        </div>
      </div>

      {/* 気象警報・注意報 */}
      <div className={`bg-white rounded-xl p-5 shadow-md border-y border-r border-neutral-100 relative ${getWeatherCardClass()}`}>
        <h2 className="text-xl font-bold text-[#d32f2f] flex items-center gap-2 mb-4">
          🌧️ 気象警報・注意報
        </h2>

        {/* 都道府県・発表状況・対象地域・発表内容（左側）と 警報レベル凡例（右側） */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
          {/* 左側：都道府県選択、発表状況、対象地域、発表内容 */}
          <div className="flex-1 space-y-2 text-neutral-800 text-sm md:text-base">
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="prefecture-select" className="shrink-0 font-bold text-neutral-900 cursor-pointer">
                都道府県：
              </label>
              <select
                id="prefecture-select"
                value={selectedPrefecture}
                onChange={(e) => {
                  const pref = e.target.value;
                  setSelectedPrefecture(pref);
                  fetchWeather(pref);
                }}
                className="py-1 px-2.5 border border-neutral-300 rounded-lg bg-white text-neutral-800 text-sm md:text-base focus-visible:outline-2 focus-visible:outline-[#d32f2f]"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>

            <p className="my-1">
              <strong className="text-neutral-900">発表状況：</strong>
              <span className="font-semibold">{weatherLoading ? '確認中...' : weather?.status || '確認中...'}</span>
            </p>
            <p className="my-1">
              <strong className="text-neutral-900">対象地域：</strong>
              <span>{weather?.area || '---'}</span>
            </p>

            {/* 警告メッセージボックス（対象地域のすぐ下に自然な間隔で配置） */}
            <div className={`!mt-2 p-2.5 rounded-lg text-sm md:text-base font-bold transition-colors ${getWeatherWarningBoxStyle()}`}>
              {weather?.warning || '気象警報・注意報を確認しています'}
            </div>
          </div>

          {/* 右側：危険度レベルの凡例 */}
          <div className="sm:w-[210px] shrink-0 p-3 bg-neutral-50 sm:bg-white border border-neutral-200 sm:border-neutral-300 rounded-lg text-xs shadow-xs space-y-1.5 self-start">
            <div className="font-bold text-neutral-700 pb-1 border-b border-neutral-100">
              【警報レベル凡例】
            </div>
            <div className="space-y-1.5 text-neutral-700">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#222222] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap">レベル5 特別警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#8000cc] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap">レベル4 危険警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#dc3545] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap">レベル3 警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#ffc107] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap">レベル2 注意報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#28a745] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap">発表なし</span>
              </div>
            </div>
          </div>
        </div>

        {weather?.details && weather.details.length > 0 && (
          <div className="mt-2.5 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div className="font-bold text-xs text-neutral-600 mb-2">発表内容詳細：</div>
            <div className="flex flex-wrap gap-2">
              {[...weather.details]
                .sort((a, b) => {
                  const getRank = (name: string) => {
                    if (name.includes('特別警報')) return 5;
                    if (name.includes('危険警報')) return 4;
                    if (name.includes('警報')) return 3;
                    if (name.includes('注意報')) return 2;
                    return 1;
                  };
                  return getRank(b.name) - getRank(a.name);
                })
                .map((item, idx) => {
                  let badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
                  let icon = '🟨';
                  if (item.name.includes('特別警報')) {
                    badgeClass = 'bg-neutral-900 text-white border-neutral-800';
                    icon = '⬛';
                  } else if (item.name.includes('危険警報')) {
                    badgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
                    icon = '🟪';
                  } else if (item.name.includes('警報')) {
                    badgeClass = 'bg-red-100 text-red-900 border-red-300';
                    icon = '🟥';
                  }
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border font-medium ${badgeClass}`}
                    >
                      <span>{icon}</span>
                      <span>{item.name}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {weather?.headline && (
          <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-neutral-800 leading-relaxed">
            <span className="font-bold text-amber-950 block mb-0.5">📢 気象庁発表サマリー：</span>
            <span>{weather.headline}</span>
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
