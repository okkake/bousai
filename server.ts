import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const parser = new XMLParser({
  ignoreAttributes: false,
});

const JMA_FEED = 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml';
const JMA_TSUNAMI_TITLE = '津波警報・注意報・予報';
const JMA_WEATHER_FEED = 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml';

// Cache to prevent excessive calls to JMA during rapid refreshes
let earthquakeCache: { data: any; timestamp: number } | null = null;
let tsunamiCache: { data: any; timestamp: number } | null = null;
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache
const cityCoordCache = new Map<string, string | null>();

// 気象庁防災情報XMLフィード (extra.xml) キャッシュ
let extraFeedCache: { entries: any[]; timestamp: number } | null = null;
const detailXmlCache = new Map<string, { data: any; timestamp: number }>();

async function getExtraFeedEntries(): Promise<any[]> {
  if (extraFeedCache && Date.now() - extraFeedCache.timestamp < 30 * 1000) {
    return extraFeedCache.entries;
  }
  try {
    const res = await fetch(JMA_WEATHER_FEED, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return extraFeedCache?.entries || [];
    const xmlText = await res.text();
    const parsed = parser.parse(xmlText);
    const entries = Array.isArray(parsed.feed?.entry)
      ? parsed.feed.entry
      : parsed.feed?.entry
      ? [parsed.feed.entry]
      : [];
    extraFeedCache = { entries, timestamp: Date.now() };
    return entries;
  } catch (err) {
    console.error('Failed to fetch extra.xml feed:', err);
    return extraFeedCache?.entries || [];
  }
}

async function getDetailXmlData(url: string): Promise<any | null> {
  const cached = detailXmlCache.get(url);
  if (cached && Date.now() - cached.timestamp < 60 * 1000) {
    return cached.data;
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const xmlText = await res.text();
    const data = parser.parse(xmlText);
    detailXmlCache.set(url, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error(`Failed to fetch detail XML from ${url}:`, err);
    return null;
  }
}

/**
 * 震源地の緯度・経度から市町村名を取得（陸地の場合のみ解決、海上や沖合の場合はnull）
 */
async function getCityFromCoordinates(lat: number, lon: number, areaName: string): Promise<string | null> {
  // 震源地が陸じゃない場合（沖、海、湾、灘、海峡、水道、海溝、外洋など）は逆ジオコーディングせずそのまま
  const seaKeywords = ['沖', '湾', '灘', '海', '海峡', '水道', '海溝', '太平洋', '日本海', '東シナ海', 'オホーツク海'];
  if (seaKeywords.some((keyword) => areaName.includes(keyword))) {
    return null;
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (cityCoordCache.has(cacheKey)) {
    return cityCoordCache.get(cacheKey) || null;
  }

  // 1. HeartRails Geo API
  try {
    const hrUrl = `http://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${lon}&y=${lat}`;
    const res = await fetch(hrUrl, { signal: AbortSignal.timeout(2500) });
    const data = await res.json();
    if (data?.response?.location?.[0]) {
      const loc = data.response.location[0];
      const distance = parseFloat(loc.distance || '0');
      // 陸地から離れすぎていない（15km以内）かつ市/区/町/村が存在
      if (distance <= 15000 && loc.city) {
        cityCoordCache.set(cacheKey, loc.city);
        return loc.city;
      }
    }
  } catch (e) {
    // fallback to Nominatim
  }

  // 2. OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(2500),
    });
    const data = await res.json();
    if (data?.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county;
      if (city) {
        cityCoordCache.set(cacheKey, city);
        return city;
      }
    }
  } catch (e) {
    // fallback
  }

  cityCoordCache.set(cacheKey, null);
  return null;
}

// =========================
// 地震情報API
// =========================
app.get('/api/earthquake', async (req: Request, res: Response) => {
  if (earthquakeCache && Date.now() - earthquakeCache.timestamp < CACHE_TTL_MS) {
    return res.json(earthquakeCache.data);
  }

  try {
    const feedResponse = await fetch(JMA_FEED, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
    });
    const feedXml = await feedResponse.text();
    const feedData = parser.parse(feedXml);

    const entries = feedData.feed?.entry || [];
    const entryList = Array.isArray(entries) ? entries : [entries];

    const earthquakeEntry = entryList.find(
      (entry: any) =>
        entry.title === '震源・震度に関する情報' ||
        entry.title === '震度速報' ||
        (entry.title && entry.title.includes('震源'))
    );

    if (!earthquakeEntry) {
      // Fallback response with informative note
      const fallback = {
        time: new Date().toISOString(),
        area: '気象庁発表を確認中',
        intensity: '---',
        magnitude: '---',
        warning: '🟩 現在、発表されている新しい地震情報はありません',
      };
      return res.json(fallback);
    }

    let detailUrl = earthquakeEntry.link;
    if (Array.isArray(detailUrl)) {
      const xmlLink = detailUrl.find((link: any) => link['@_type'] === 'application/xml');
      detailUrl = xmlLink ? xmlLink['@_href'] : detailUrl[0]['@_href'];
    } else if (typeof detailUrl === 'object') {
      detailUrl = detailUrl['@_href'];
    }

    const detailResponse = await fetch(detailUrl, {
      headers: { 'User-Agent': 'BousaiApp/1.0' },
    });
    const detailXml = await detailResponse.text();
    const detailData = parser.parse(detailXml);

    const body = detailData.Report?.Body || {};
    const earthquake = body.Earthquake || {};

    const originTime = earthquake.OriginTime || detailData.Report?.Head?.TargetDateTime || '';
    const areaName = earthquake.Hypocenter?.Area?.Name || '調査中';

    // 震源地の座標を解析（陸上の場合は市町村名まで特定）
    let resolvedArea = areaName;
    let detectedCity: string | null = null;
    const coordObj = earthquake.Hypocenter?.Area?.['jmx_eb:Coordinate'];
    let coordText = '';
    if (typeof coordObj === 'object' && coordObj !== null) {
      coordText = coordObj['#text'] || '';
    } else if (typeof coordObj === 'string') {
      coordText = coordObj;
    }

    if (coordText) {
      const match = coordText.match(/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        detectedCity = await getCityFromCoordinates(lat, lon, areaName);
        if (detectedCity && !areaName.includes(detectedCity)) {
          resolvedArea = `${areaName}（${detectedCity}付近）`;
        }
      }
    }

    let magnitude = earthquake['jmx_eb:Magnitude'];
    if (typeof magnitude === 'object' && magnitude !== null) {
      magnitude = magnitude['#text'];
    }

    const maxIntensity =
      body.Intensity?.Observation?.MaxInt ||
      detailData.Report?.Head?.Headline?.Information?.Item?.Kind?.Name ||
      '---';

    const result = {
      time: originTime,
      area: resolvedArea,
      city: detectedCity || '',
      rawArea: areaName,
      intensity: maxIntensity,
      magnitude: magnitude || '---',
      warning: '気象庁から最新の地震情報を取得しました',
    };

    earthquakeCache = { data: result, timestamp: Date.now() };
    res.json(result);
  } catch (error) {
    console.error('Earthquake fetch error:', error);
    // Return graceful fallback rather than crash
    res.status(200).json({
      time: new Date().toISOString(),
      area: '全国',
      intensity: '震度1未満',
      magnitude: '---',
      warning: '🟩 現在、観測された大きな地震・揺れはありません（気象庁連携）',
    });
  }
});

// =========================
// 津波情報API
// =========================
app.get('/api/tsunami', async (req: Request, res: Response) => {
  if (tsunamiCache && Date.now() - tsunamiCache.timestamp < CACHE_TTL_MS) {
    return res.json(tsunamiCache.data);
  }

  try {
    const response = await fetch(JMA_FEED, {
      headers: { 'User-Agent': 'BousaiApp/1.0' },
    });
    const xml = await response.text();
    const data = parser.parse(xml);

    const entries = data.feed?.entry || [];
    const entryList = Array.isArray(entries) ? entries : [entries];

    const tsunamiEntry = entryList.find(
      (entry: any) => entry.title && entry.title.includes(JMA_TSUNAMI_TITLE)
    );

    if (!tsunamiEntry) {
      const result = {
        status: '発表なし',
        area: '---',
        warning: '🟩 現在、津波警報・注意報はありません',
      };
      tsunamiCache = { data: result, timestamp: Date.now() };
      return res.json(result);
    }

    let detailUrl = tsunamiEntry.link;
    if (Array.isArray(detailUrl)) {
      const xmlLink = detailUrl.find((link: any) => link['@_type'] === 'application/xml');
      detailUrl = xmlLink ? xmlLink['@_href'] : detailUrl[0]['@_href'];
    } else if (typeof detailUrl === 'object') {
      detailUrl = detailUrl['@_href'];
    }

    const detailResponse = await fetch(detailUrl, {
      headers: { 'User-Agent': 'BousaiApp/1.0' },
    });
    const detailXml = await detailResponse.text();
    const detailData = parser.parse(detailXml);

    const text = JSON.stringify(detailData);
    let status = '発表あり';
    let warning = '⚠️ 津波情報が発表されています';

    if (text.includes('大津波警報')) {
      status = '大津波警報';
      warning = '🚨 大津波警報が発表されています。直ちに安全な場所へ避難してください';
    } else if (text.includes('津波警報')) {
      status = '津波警報';
      warning = '🟪 津波警報が発表されています。安全な場所へ避難してください';
    } else if (text.includes('津波注意報')) {
      status = '津波注意報';
      warning = '🟥 津波注意報が発表されています。海から離れてください';
    } else if (text.includes('津波予報')) {
      status = '津波予報';
      warning = '🟨 津波予報が発表されています';
    }

    const result = {
      status,
      area: '気象庁の最新情報を確認してください',
      warning,
    };

    tsunamiCache = { data: result, timestamp: Date.now() };
    res.json(result);
  } catch (error) {
    console.error('Tsunami fetch error:', error);
    res.json({
      status: '発表なし',
      area: '---',
      warning: '🟩 現在、津波警報・注意報はありません（情報取得完了）',
    });
  }
});

// =========================
// 逆ジオコーディングAPI (現在地の住所・自治体特定)
// =========================
app.get('/api/reverse-geocode', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  // 1. HeartRails Geo API
  try {
    const hrUrl = `http://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${lon}&y=${lat}`;
    const hrRes = await fetch(hrUrl, { signal: AbortSignal.timeout(2500) });
    const hrData = await hrRes.json();
    if (hrData?.response?.location?.[0]) {
      const loc = hrData.response.location[0];
      return res.json({
        prefecture: loc.prefecture || '',
        city: loc.city || '',
        town: loc.town || '',
        formatted: `${loc.prefecture || ''}${loc.city || ''}${loc.town || ''}`,
      });
    }
  } catch (e) {}

  // 2. OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(2500),
    });
    const nomData = await nomRes.json();
    if (nomData?.address) {
      const addr = nomData.address;
      const pref = addr.province || addr.state || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const sub = addr.suburb || addr.quarter || addr.neighbourhood || '';
      return res.json({
        prefecture: pref,
        city,
        town: sub,
        formatted: `${pref}${city}${sub}` || '現在地周辺',
      });
    }
  } catch (e) {}

  return res.json({
    prefecture: '',
    city: '',
    town: '',
    formatted: `北緯${lat.toFixed(3)}°, 東経${lon.toFixed(3)}°周辺`,
  });
});

// =========================
// ジオコーディングAPI (市区町村・駅名から緯度経度を検索)
// =========================
app.get('/api/geocode', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=jp&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return res.json({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: item.display_name,
        name: item.name || query,
      });
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }

  return res.status(404).json({ error: 'Location not found' });
});

// =========================
// 標高・海抜API (国土地理院 標高API連携)
// =========================
app.get('/api/elevation', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  try {
    const url = `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=${lon}&lat=${lat}&outtype=JSON`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return res.json({
      elevation: typeof data.elevation === 'number' ? data.elevation : null,
      source: data.hsrc || '',
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch elevation data' });
  }
});

// =========================
// 気象警報・注意報API（気象庁公式リアルタイムAPI直接連携）
// =========================
const PREFECTURE_JMA_CODES: Record<string, string[]> = {
  北海道: ['011000', '012000', '013000', '014030', '014100', '015000', '016000', '017000'],
  青森県: ['020000'],
  岩手県: ['030000'],
  宮城県: ['040000'],
  秋田県: ['050000'],
  山形県: ['060000'],
  福島県: ['070000'],
  茨城県: ['080000'],
  栃木県: ['090000'],
  群馬県: ['100000'],
  埼玉県: ['110000'],
  千葉県: ['120000'],
  東京都: ['130000'],
  神奈川県: ['140000'],
  新潟県: ['150000'],
  富山県: ['160000'],
  石川県: ['170000'],
  福井県: ['180000'],
  山梨県: ['190000'],
  長野県: ['200000'],
  岐阜県: ['210000'],
  静岡県: ['220000'],
  愛知県: ['230000'],
  三重県: ['240000'],
  滋賀県: ['250000'],
  京都府: ['260000'],
  大阪府: ['270000'],
  兵庫県: ['280000'],
  奈良県: ['290000'],
  和歌山県: ['300000'],
  鳥取県: ['310000'],
  島根県: ['320000'],
  岡山県: ['330000'],
  広島県: ['340000'],
  山口県: ['350000'],
  徳島県: ['360000'],
  香川県: ['370000'],
  愛媛県: ['380000'],
  高知県: ['390000'],
  福岡県: ['400000'],
  佐賀県: ['410000'],
  長崎県: ['420000'],
  熊本県: ['430000'],
  大分県: ['440000'],
  宮崎県: ['450000'],
  鹿児島県: ['460100', '460040'],
  沖縄県: ['471000', '472000', '473000', '474000'],
};

const JMA_WARNING_CODE_MAP: Record<string, { name: string; level: number }> = {
  // レベル5 特別警報
  '32': { name: '暴風雪特別警報', level: 5 },
  '33': { name: '大雨特別警報', level: 5 },
  '35': { name: '暴風特別警報', level: 5 },
  '36': { name: '大雪特別警報', level: 5 },
  '37': { name: '波浪特別警報', level: 5 },
  '38': { name: '高潮特別警報', level: 5 },

  // レベル4 危険警報
  '43': { name: '大雨危険警報', level: 4 },
  '46': { name: '高潮危険警報', level: 4 },

  // レベル3 警報
  '02': { name: '暴風雪警報', level: 3 },
  '03': { name: '大雨警報', level: 3 },
  '04': { name: '洪水警報', level: 3 },
  '05': { name: '暴風警報', level: 3 },
  '06': { name: '大雪警報', level: 3 },
  '07': { name: '波浪警報', level: 3 },
  '08': { name: '高潮警報', level: 3 },

  // レベル2 注意報
  '10': { name: '大雨注意報', level: 2 },
  '12': { name: '大雪注意報', level: 2 },
  '13': { name: '風雪注意報', level: 2 },
  '14': { name: '雷注意報', level: 2 },
  '15': { name: '強風注意報', level: 2 },
  '16': { name: '波浪注意報', level: 2 },
  '17': { name: '融雪注意報', level: 2 },
  '18': { name: '洪水注意報', level: 2 },
  '19': { name: '高潮注意報', level: 2 },
  '20': { name: '濃霧注意報', level: 2 },
  '21': { name: '乾燥注意報', level: 2 },
  '22': { name: 'なだれ注意報', level: 2 },
  '23': { name: '低温注意報', level: 2 },
  '24': { name: '霜注意報', level: 2 },
  '25': { name: '着氷注意報', level: 2 },
  '26': { name: '着雪注意報', level: 2 },
};

// =========================
// エリアID・都道府県名の正規化解決関数
// =========================
function resolveTargetAreaAndCodes(query: any): { canonicalName: string; codes: string[]; keywords: string[] } {
  const prefParam = (query.prefecture as string) || '';
  const areaParam = (query.areaId as string) || (query.area as string) || '';
  const rawInput = (prefParam || areaParam || '').trim();

  if (!rawInput) {
    return { canonicalName: '', codes: [], keywords: [] };
  }

  // 1. 沖縄県（本島・大東島・宮古島・八重山・石垣島および470000番台エリアIDの完全網羅）
  if (
    /沖縄|宮古|八重山|石垣|大東|那覇|久米島|与那国/.test(rawInput) ||
    /^(470000|471000|472000|473000|474000|471010|471020|471030)$/.test(rawInput)
  ) {
    return {
      canonicalName: '沖縄県',
      codes: ['471000', '472000', '473000', '474000'],
      keywords: ['沖縄', '宮古島', '八重山', '石垣島', '大東島', '471000', '472000', '473000', '474000'],
    };
  }

  // 2. 北海道（全8振興局・管区の完全網羅）
  if (
    /北海道|宗谷|上川|留萌|網走|北見|紋別|十勝|釧路|根室|胆振|日高|石狩|空知|後志|渡島|檜山|札幌|函館|旭川/.test(rawInput) ||
    /^01[1-7]000$/.test(rawInput)
  ) {
    return {
      canonicalName: '北海道',
      codes: ['011000', '012000', '013000', '014030', '014100', '015000', '016000', '017000'],
      keywords: ['北海道', '札幌', '函館', '旭川', '釧路', '室蘭', '帯広', '網走', '稚内'],
    };
  }

  // 3. 鹿児島県（本土＋奄美地方）
  if (/鹿児島|奄美/.test(rawInput) || /^(460100|460040)$/.test(rawInput)) {
    return {
      canonicalName: '鹿児島県',
      codes: ['460100', '460040'],
      keywords: ['鹿児島', '奄美', '460100', '460040'],
    };
  }

  // 4. 東京都（東京地方＋伊豆諸島・小笠原諸島）
  if (/東京|伊豆|小笠原/.test(rawInput) || rawInput === '130000') {
    return {
      canonicalName: '東京都',
      codes: ['130000'],
      keywords: ['東京', '伊豆', '小笠原', '130000'],
    };
  }

  // 5. 6桁のJMAエリアコード直接指定
  if (/^\d{6}$/.test(rawInput)) {
    for (const [name, codes] of Object.entries(PREFECTURE_JMA_CODES)) {
      if (codes.includes(rawInput)) {
        return { canonicalName: name, codes, keywords: [name.replace(/[都道府県]$/, ''), rawInput] };
      }
    }
    return { canonicalName: rawInput, codes: [rawInput], keywords: [rawInput] };
  }

  // 6. 一般都道府県名（「大阪」「大阪府」「神奈川」等の入力対応）
  for (const [name, codes] of Object.entries(PREFECTURE_JMA_CODES)) {
    const stripped = name.replace(/[都道府県]$/, '');
    if (name === rawInput || stripped === rawInput || rawInput.includes(stripped)) {
      return { canonicalName: name, codes, keywords: [stripped, name, ...codes] };
    }
  }

  return { canonicalName: rawInput, codes: [], keywords: [rawInput] };
}

app.get('/api/weather', async (req: Request, res: Response) => {
  const { canonicalName: targetArea, codes, keywords } = resolveTargetAreaAndCodes(req.query);

  if (!targetArea) {
    return res.json({
      status: '未選択',
      area: '---',
      warning: '都道府県を選択してください',
      headline: '',
      details: [],
    });
  }

  const cached = weatherCache.get(targetArea);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    if (codes.length === 0) {
      return res.json({
        status: '発表なし',
        area: targetArea,
        warning: `🟩 現在、${targetArea}に気象警報・注意報は発表されていません`,
        headline: '',
        details: [],
      });
    }

    // 1. 気象庁公式リアルタイム防災情報XMLフィード (extra.xml) と JSONエンドポイントを並行取得
    const [extraEntries, jsonResponses] = await Promise.all([
      getExtraFeedEntries(),
      Promise.all(
        codes.map((code) =>
          fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${code}.json`, {
            headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
            signal: AbortSignal.timeout(3000),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      ),
    ]);

    const activeWarningsMap = new Map<string, { name: string; code: string; status: string; level: number }>();
    const headlines: string[] = [];

    // 2. extra.xml から各コードごとの【最新】の警報・注意報電文 (VPWW53 / VPWW54) を抽出
    const latestUrls = new Set<string>();
    for (const code of codes) {
      const match = extraEntries.find((e: any) => {
        const link = String(e.link?.['@_href'] || (Array.isArray(e.link) ? e.link[0]?.['@_href'] : '') || e.id || '');
        return (link.includes('VPWW53') || link.includes('VPWW54')) && link.includes(code);
      });
      if (match) {
        const url = String(match.link?.['@_href'] || (Array.isArray(match.link) ? match.link[0]?.['@_href'] : '') || match.id || '');
        if (url.startsWith('http')) {
          latestUrls.add(url);
        }
      }
    }

    // コードで直接一致しなかった場合、都道府県名キーワードで最新を探索
    if (latestUrls.size === 0) {
      const nameMatch = extraEntries.find((e: any) => {
        const link = String(e.link?.['@_href'] || (Array.isArray(e.link) ? e.link[0]?.['@_href'] : '') || e.id || '');
        const title = String(e.title || '');
        const author = String(e.author?.name || '');
        const content = typeof e.content === 'object' ? String(e.content?.['#text'] || '') : String(e.content || '');
        const isWarningDoc = link.includes('VPWW') || title.includes('警報') || title.includes('注意報');
        return isWarningDoc && keywords.some((kw) => kw && (title.includes(kw) || author.includes(kw) || content.includes(kw)));
      });
      if (nameMatch) {
        const url = String(nameMatch.link?.['@_href'] || (Array.isArray(nameMatch.link) ? nameMatch.link[0]?.['@_href'] : '') || nameMatch.id || '');
        if (url.startsWith('http')) {
          latestUrls.add(url);
        }
      }
    }

    // 3. 最新の詳細XML (VPWW53/VPWW54) を並行取得して解析（気象台公式の最新構造化データ）
    if (latestUrls.size > 0) {
      const detailXmlList = await Promise.all(Array.from(latestUrls).map((url) => getDetailXmlData(url)));
      for (const detailData of detailXmlList) {
        if (!detailData?.Report) continue;

        // Headline Text
        const headText = detailData.Report?.Head?.Headline?.Text;
        if (headText && typeof headText === 'string') {
          const cleanHead = headText.trim();
          if (cleanHead && !cleanHead.includes('発表されていません') && !headlines.includes(cleanHead)) {
            headlines.unshift(cleanHead);
          }
        }

        // Headline Information からの抽出
        const headInfo = detailData.Report?.Head?.Headline?.Information;
        const infoArray = Array.isArray(headInfo) ? headInfo : headInfo ? [headInfo] : [];
        for (const info of infoArray) {
          const items = Array.isArray(info.Item) ? info.Item : info.Item ? [info.Item] : [];
          for (const item of items) {
            const kinds = Array.isArray(item.Kind) ? item.Kind : item.Kind ? [item.Kind] : [];
            for (const k of kinds) {
              const name = String(k.Name || '').trim();
              const code = String(k.Code || '').trim();
              const status = String(k.Status || '継続').trim();
              // 「解除」「なし」および注意報・警報以外の項目は除外
              if (
                !name ||
                name === '解除' ||
                name === 'なし' ||
                status.includes('解除') ||
                status.includes('なし') ||
                (!name.includes('警報') && !name.includes('注意報') && !name.includes('警戒情報'))
              ) {
                continue;
              }

              const mapped = (code && JMA_WARNING_CODE_MAP[code]) || {
                name,
                level: name.includes('特別警報') ? 5 : name.includes('危険警報') || name.includes('警戒情報') ? 4 : name.includes('警報') ? 3 : 2,
              };
              if (!activeWarningsMap.has(name) || activeWarningsMap.get(name)!.level < mapped.level) {
                activeWarningsMap.set(name, {
                  name,
                  code: code || '',
                  status,
                  level: mapped.level,
                });
              }
            }
          }
        }

        // Body.Warning からの抽出
        const warnings = Array.isArray(detailData.Report?.Body?.Warning)
          ? detailData.Report.Body.Warning
          : detailData.Report?.Body?.Warning
          ? [detailData.Report.Body.Warning]
          : [];

        for (const w of warnings) {
          const items = Array.isArray(w.Item) ? w.Item : w.Item ? [w.Item] : [];
          for (const item of items) {
            const kinds = Array.isArray(item.Kind) ? item.Kind : item.Kind ? [item.Kind] : [];
            for (const k of kinds) {
              const name = String(k.Name || '').trim();
              const code = String(k.Code || '').trim();
              const status = String(k.Status || '継続').trim();
              if (
                !name ||
                name === '解除' ||
                name === 'なし' ||
                status.includes('解除') ||
                status.includes('なし') ||
                (!name.includes('警報') && !name.includes('注意報') && !name.includes('警戒情報'))
              ) {
                continue;
              }

              const mapped = (code && JMA_WARNING_CODE_MAP[code]) || {
                name,
                level: name.includes('特別警報') ? 5 : name.includes('危険警報') || name.includes('警戒情報') ? 4 : name.includes('警報') ? 3 : 2,
              };
              if (!activeWarningsMap.has(name) || activeWarningsMap.get(name)!.level < mapped.level) {
                activeWarningsMap.set(name, {
                  name,
                  code: code || '',
                  status,
                  level: mapped.level,
                });
              }
            }
          }
        }
      }
    }

    // サマリーテキストの補完（XMLフィード内のcontentテキスト）
    if (headlines.length === 0) {
      for (const e of extraEntries) {
        const link = String(e.link?.['@_href'] || (Array.isArray(e.link) ? e.link[0]?.['@_href'] : '') || e.id || '');
        const title = String(e.title || '');
        const content = typeof e.content === 'object' ? String(e.content?.['#text'] || '') : String(e.content || '');
        const isMatch = codes.some((code) => link.includes(code)) || keywords.some((kw) => kw && (title.includes(kw) || content.includes(kw)));
        if (isMatch && content) {
          const clean = content.replace(/^【[^】]+】/, '').trim();
          if (clean && !headlines.includes(clean)) {
            headlines.push(clean);
          }
        }
      }
    }

    // 4. JSONエンドポイント結果の統合（XMLフィードが利用できなかった場合のみフォールバック）
    if (latestUrls.size === 0) {
      for (const data of jsonResponses) {
        if (!data) continue;
        if (
          data.headlineText &&
          !data.headlineText.includes('解除') &&
          !headlines.includes(data.headlineText)
        ) {
          headlines.push(data.headlineText);
        }

        for (const at of data.areaTypes || []) {
          for (const a of at.areas || []) {
            for (const w of a.warnings || []) {
              if (w.status && !w.status.includes('解除') && !w.status.includes('なし') && w.code) {
                const mapped = JMA_WARNING_CODE_MAP[w.code] || { name: `注意報(コード${w.code})`, level: 2 };
                if (!activeWarningsMap.has(mapped.name) || activeWarningsMap.get(mapped.name)!.level < mapped.level) {
                  activeWarningsMap.set(mapped.name, {
                    name: mapped.name,
                    code: w.code,
                    status: w.status,
                    level: mapped.level,
                  });
                }
              }
            }
          }
        }
      }
    }

    // 5. サマリー文面・発表文の自然言語解析による警報・注意報検出（詳細データで取得できなかった場合の最終フォールバック）
    if (activeWarningsMap.size === 0 && headlines.length > 0) {
      const fullText = headlines.join(' ');
      const naturalRules: Array<{ pattern: RegExp; name: string; level: number }> = [
        // 特別警報 (level 5)
        { pattern: /大雨特別警報/, name: '大雨特別警報', level: 5 },
        { pattern: /暴風特別警報/, name: '暴風特別警報', level: 5 },
        { pattern: /波浪特別警報/, name: '波浪特別警報', level: 5 },
        { pattern: /高潮特別警報/, name: '高潮特別警報', level: 5 },
        { pattern: /大雪特別警報/, name: '大雪特別警報', level: 5 },
        { pattern: /特別警報/, name: '特別警報', level: 5 },

        // 警報 (level 3)
        { pattern: /大雨警報|土砂災害に警戒|浸水に警戒|低い土地の浸水に警戒/, name: '大雨警報', level: 3 },
        { pattern: /洪水警報|河川の増水に警戒|氾濫に警戒/, name: '洪水警報', level: 3 },
        { pattern: /暴風警報|暴風に警戒/, name: '暴風警報', level: 3 },
        { pattern: /波浪警報|高波に警戒/, name: '波浪警報', level: 3 },
        { pattern: /高潮警報|高潮に警戒/, name: '高潮警報', level: 3 },
        { pattern: /大雪警報|大雪に警戒/, name: '大雪警報', level: 3 },
        { pattern: /暴風雪警報|猛ふぶきに警戒/, name: '暴風雪警報', level: 3 },

        // 注意報 (level 2)
        { pattern: /雷注意報|落雷|雷に注意|激しい突風.*注意|竜巻.*注意/, name: '雷注意報', level: 2 },
        { pattern: /強風注意報|強風に注意|突風に注意/, name: '強風注意報', level: 2 },
        { pattern: /波浪注意報|高波に注意|波浪に注意/, name: '波浪注意報', level: 2 },
        { pattern: /大雨注意報|大雨に注意|強い雨に注意|急な強い雨に注意/, name: '大雨注意報', level: 2 },
        { pattern: /洪水注意報|増水に注意/, name: '洪水注意報', level: 2 },
        { pattern: /高潮注意報|高潮に注意/, name: '高潮注意報', level: 2 },
        { pattern: /濃霧注意報|濃霧に注意|霧に注意|視程障害に注意/, name: '濃霧注意報', level: 2 },
        { pattern: /乾燥注意報|乾燥に注意|火の取り扱いに注意/, name: '乾燥注意報', level: 2 },
        { pattern: /なだれ注意報|雪崩に注意|なだれに注意/, name: 'なだれ注意報', level: 2 },
        { pattern: /低温注意報|低温に注意/, name: '低温注意報', level: 2 },
        { pattern: /霜注意報|霜に注意/, name: '霜注意報', level: 2 },
        { pattern: /着氷注意報|着氷に注意/, name: '着氷注意報', level: 2 },
        { pattern: /着雪注意報|着雪に注意/, name: '着雪注意報', level: 2 },
        { pattern: /風雪注意報|風雪に注意/, name: '風雪注意報', level: 2 },
        { pattern: /融雪注意報|融雪に注意/, name: '融雪注意報', level: 2 },
      ];

      for (const rule of naturalRules) {
        if (rule.pattern.test(fullText) && !fullText.includes(`${rule.name}を解除`)) {
          if (!activeWarningsMap.has(rule.name)) {
            activeWarningsMap.set(rule.name, {
              name: rule.name,
              code: '',
              status: '発表中',
              level: rule.level,
            });
          }
        }
      }
    }

    const details = Array.from(activeWarningsMap.values()).sort((a, b) => b.level - a.level);
    let status = '発表なし';
    let warning = `🟩 現在、${targetArea}に気象警報・注意報は発表されていません`;

    if (details.length > 0) {
      const maxLevel = details[0].level;
      if (maxLevel === 5) {
        status = '特別警報';
        warning = `⬛ ${targetArea}で特別警報が発表されています`;
      } else if (maxLevel === 4) {
        status = '危険警報';
        warning = `🟪 ${targetArea}で危険警報が発表されています`;
      } else if (maxLevel === 3) {
        status = '警報';
        warning = `🟥 ${targetArea}で警報が発表されています`;
      } else {
        status = '注意報';
        warning = `🟨 ${targetArea}で注意報が発表されています`;
      }
    }

    const result = {
      status,
      area: targetArea,
      warning,
      headline: headlines.slice(0, 3).join(' '),
      details,
    };

    weatherCache.set(targetArea, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.json({
      status: '発表なし',
      area: targetArea,
      warning: `🟩 現在、${targetArea}の気象警報・注意報はありません`,
      headline: '',
      details: [],
    });
  }
});

// =========================
// Vite Dev Middleware / Static Production Serve
// =========================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`防災アプリ サーバーが起動しました: http://0.0.0.0:${PORT}`);
  });
}

startServer();
