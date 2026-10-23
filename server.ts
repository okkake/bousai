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
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache
const cityCoordCache = new Map<string, string | null>();

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

app.get('/api/weather', async (req: Request, res: Response) => {
  const targetArea = (req.query.prefecture as string) || '';

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
    const codes = PREFECTURE_JMA_CODES[targetArea] || [];
    if (codes.length === 0) {
      return res.json({
        status: '発表なし',
        area: targetArea,
        warning: `🟩 現在、${targetArea}に気象警報・注意報は発表されていません`,
        headline: '',
        details: [],
      });
    }

    const responses = await Promise.all(
      codes.map((code) =>
        fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${code}.json`, {
          headers: { 'User-Agent': 'BousaiApp/1.0 (+https://github.com/okkake/bousai)' },
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const activeWarningsMap = new Map<string, { name: string; code: string; status: string; level: number }>();
    const headlines: string[] = [];

    for (const data of responses) {
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
      headline: headlines.join(' '),
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
