import React, { useState, useEffect, useCallback } from 'react';
import { EarthquakeData, TsunamiData, WeatherData } from '../types';
import {
  EarthquakeIcon,
  TsunamiIcon,
  WeatherIcon,
  MegaphoneIcon,
  WarningIcon,
  LocationPinIcon,
} from './Icons';

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

  const [selectedPrefecture, setSelectedPrefecture] = useState<string>(() => {
    return localStorage.getItem('selected-prefecture') || '東京都';
  });
  const [isLocatingPref, setIsLocatingPref] = useState<boolean>(false);
  const [locatingMsg, setLocatingMsg] = useState<string>('');
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
        warning: '災害情報を取得できませんでした',
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
        warning: '津波情報を取得できませんでした',
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
        warning: '気象警報・注意報を取得できませんでした',
        details: [],
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // 現在地のGPSから都道府県を特定
  const detectCurrentPrefecture = useCallback(() => {
    if (!navigator.geolocation) {
      setLocatingMsg('お使いの環境では位置情報がサポートされていません');
      setTimeout(() => setLocatingMsg(''), 4000);
      return;
    }

    setIsLocatingPref(true);
    setLocatingMsg('現在地を取得中...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error('Geocode failed');
          const data = await res.json();
          const detectedPref = data.prefecture || '';
          const matched = PREFECTURES.find((p) => detectedPref.includes(p) || p.includes(detectedPref));
          if (matched) {
            setSelectedPrefecture(matched);
            localStorage.setItem('selected-prefecture', matched);
            fetchWeather(matched);
            setLocatingMsg(`現在地（${matched}）を選択しました`);
          } else {
            setLocatingMsg('現在地の都道府県を特定できませんでした');
          }
        } catch {
          setLocatingMsg('位置情報の取得に失敗しました');
        } finally {
          setIsLocatingPref(false);
          setTimeout(() => setLocatingMsg(''), 4000);
        }
      },
      (err) => {
        setIsLocatingPref(false);
        console.warn('Geolocation error:', err);
        setLocatingMsg('位置情報の利用を許可してください');
        setTimeout(() => setLocatingMsg(''), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [fetchWeather]);

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

  // Overall status styling（index.cssのクラスを使用）
  const getOverallStatus = () => {
    const status = weather?.status || '';
    if (status === '特別警報') {
      return {
        className: 'overall-emergency',
        text: '現在、特別警報が発表されています',
      };
    } else if (status === '危険警報') {
      return {
        className: 'overall-critical',
        text: '現在、危険警報が発表されています',
      };
    } else if (status === '警報') {
      return {
        className: 'overall-danger',
        text: '現在、警報が発表されています',
      };
    } else if (status === '注意報') {
      return {
        className: 'overall-warning',
        text: '現在、注意報が発表されています',
      };
    }
    return {
      className: 'overall-safe',
      text: '現在、気象警報・注意報はありません',
    };
  };

  const overall = getOverallStatus();

  // Earthquake card border class（index.cssのクラスを使用）
  const getEarthquakeCardClass = () => {
    const intensity = String(earthquake?.intensity || '');
    if (intensity.includes('7')) return 'earthquake-emergency';
    if (intensity.includes('6')) return 'earthquake-red';
    if (intensity.includes('5')) return 'earthquake-orange';
    if (intensity.includes('4')) return 'earthquake-yellow';
    return 'earthquake-safe';
  };

  // Weather card border class（index.cssのクラスを使用）
  const getWeatherCardClass = () => {
    const status = weather?.status;
    if (status === '特別警報') return 'weather-emergency';
    if (status === '危険警報') return 'weather-critical';
    if (status === '警報') return 'weather-danger';
    if (status === '注意報') return 'weather-warning';
    return 'weather-safe';
  };

  // Earthquake warning message
  const getEarthquakeWarningText = () => {
    if (!earthquake) return '情報を確認してください';
    const intensity = String(earthquake.intensity);
    if (intensity.includes('7')) return '非常に強い揺れです！安全な場所へ避難してください';
    if (intensity.includes('6')) return '強い揺れに注意してください';
    if (intensity.includes('5')) return '強い揺れに注意してください';
    if (intensity.includes('4')) return '揺れに注意してください';
    return earthquake.warning || '現在、大きな揺れは確認されていません';
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
    <div className="w-[94%] max-w-5xl mx-auto my-5 md:my-6 space-y-4 md:space-y-5">
      {/* ページ上部の総合危険度表示 */}
      <div className={`p-4 rounded-2xl text-center text-sm md:text-base font-bold shadow-2xs transition-colors ${overall.className}`}>
        {overall.text}
      </div>

      {/* 地震情報カード */}
      <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-2xs ${getEarthquakeCardClass()} space-y-3.5`}>
        <h2 className="text-base md:text-lg font-bold text-neutral-900 mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
            <EarthquakeIcon className="w-5 h-5 text-rose-600" />
          </div>
          <span>地震情報</span>
        </h2>

        <div className="space-y-2 text-neutral-800 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-600">最新情報：</span>
            <span>{formatEarthquakeDate(earthquake?.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-600">震源地：</span>
            <span className="font-bold text-neutral-900">{earthquake?.area || '情報なし'}</span>
            {earthquake?.city && <span className="text-neutral-500">({earthquake.city})</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-600">最大震度：</span>
            <span className="inline-block py-0.5 px-2.5 bg-red-600 text-white font-black text-lg rounded-md font-mono">
              {earthquake?.intensity || '---'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-600">マグニチュード：</span>
            <span className="font-mono font-bold text-neutral-900">
              {earthquake?.magnitude ? `M ${earthquake.magnitude}` : '---'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
          {getEarthquakeWarningText()}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-2xs text-neutral-500">
          <span>確認時刻: {earthquakeLastChecked}</span>
          <button
            type="button"
            onClick={fetchEarthquake}
            disabled={earthquakeLoading}
            className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {earthquakeLoading ? '更新中...' : '最新情報に更新'}
          </button>
        </div>
      </div>

      {/* 津波情報カード */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border border-neutral-200/90 space-y-3.5">
        <h2 className="text-base md:text-lg font-bold text-neutral-900 mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
            <TsunamiIcon className="w-5 h-5 text-sky-600" />
          </div>
          <span>津波情報</span>
        </h2>

        <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs md:text-sm text-sky-950 font-medium leading-relaxed">
          {tsunami?.warning || '現在、津波警報・注意報は発表されていません。'}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={fetchTsunami}
            className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-2xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            津波情報を再確認
          </button>
        </div>
      </div>

      {/* 気象警報・注意報カード */}
      <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-2xs ${getWeatherCardClass()} space-y-4`}>
        <h2 className="text-base md:text-lg font-bold text-neutral-900 mb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
            <WeatherIcon className="w-5 h-5 text-amber-600" />
          </div>
          <span>気象警報・注意報</span>
        </h2>

        {/* 都道府県選択・警報状況（左） と 警戒レベル凡例（右・赤枠の位置）の2列配置 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
          {/* 左側：都道府県選択 & 選択地域の警報状況 */}
          <div className="space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="pref-select" className="block text-xs font-bold text-neutral-700">
                  都道府県を選択：
                </label>
                <button
                  type="button"
                  onClick={detectCurrentPrefecture}
                  disabled={isLocatingPref}
                  className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-2xs font-bold rounded-lg border border-neutral-300 transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                  title="現在地を測位して都道府県を自動選択"
                >
                  <LocationPinIcon className="w-3 h-3 text-neutral-600 shrink-0" />
                  <span>{isLocatingPref ? '取得中...' : '現在地から選択'}</span>
                </button>
              </div>

              {locatingMsg && (
                <div className="text-2xs text-neutral-600 mb-1 font-medium bg-neutral-100 px-2 py-0.5 rounded">
                  {locatingMsg}
                </div>
              )}

              <select
                id="pref-select"
                value={selectedPrefecture}
                onChange={(e) => {
                  const pref = e.target.value;
                  setSelectedPrefecture(pref);
                  if (pref) localStorage.setItem('selected-prefecture', pref);
                  fetchWeather(pref);
                }}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 font-medium"
              >
                <option value="">都道府県を選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {weather && (
              <div className="p-3 bg-neutral-50 border border-neutral-200/90 rounded-xl space-y-1.5 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs md:text-sm text-neutral-900 truncate">
                    {weather.area} の警報状況
                  </span>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    weather.status === '特別警報'
                      ? 'bg-neutral-900 text-white'
                      : weather.status === '危険警報'
                      ? 'bg-purple-700 text-white'
                      : weather.status === '警報'
                      ? 'bg-red-600 text-white'
                      : weather.status === '注意報'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {weatherLoading ? '確認中...' : weather.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-700 leading-snug font-medium">
                  <span className="truncate">{weather.warning}</span>
                </div>
              </div>
            )}
          </div>

          {/* 右側（赤枠の位置）：警戒レベル別の色の見方（凡例） */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs flex flex-col justify-center">
            <div className="font-bold text-neutral-700">警戒レベル別の色の見方（凡例）：</div>
            <div className="space-y-1.5 text-2xs md:text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-neutral-900 border border-neutral-700 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap font-medium">レベル5 特別警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#6f42c1] border border-neutral-700 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap font-medium">レベル4 危険警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#dc3545] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap font-medium">レベル3 警報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#ffc107] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap font-medium">レベル2 注意報</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#28a745] border border-neutral-500 inline-block rounded-xs shrink-0"></span>
                <span className="whitespace-nowrap font-medium">発表なし</span>
              </div>
            </div>
          </div>
        </div>

        {/* 発表内容詳細バッジ一覧 */}
        {weather?.details && weather.details.length > 0 && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
            <div className="font-bold text-xs text-neutral-600">発表内容詳細：</div>
            <div className="flex flex-wrap gap-1.5">
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
                  if (item.name.includes('特別警報')) {
                    badgeClass = 'bg-neutral-900 text-white border-neutral-800';
                  } else if (item.name.includes('危険警報')) {
                    badgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
                  } else if (item.name.includes('警報')) {
                    badgeClass = 'bg-red-100 text-red-900 border-red-300';
                  }
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-2xs md:text-xs rounded-md border font-medium ${badgeClass}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span>{item.name}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {weather?.headline && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-neutral-800 leading-relaxed">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
              <MegaphoneIcon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>気象庁発表サマリー：</span>
            </span>
            <span>{weather.headline}</span>
          </div>
        )}
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
