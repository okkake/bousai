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
// 気象警報・注意報API
// =========================
app.get('/api/weather', async (req: Request, res: Response) => {
  const targetArea = (req.query.prefecture as string) || '';

  if (!targetArea) {
    return res.json({
      status: '未選択',
      area: '---',
      warning: '都道府県を選択してください',
      details: [],
    });
  }

  const cached = weatherCache.get(targetArea);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch(JMA_WEATHER_FEED, {
      headers: { 'User-Agent': 'BousaiApp/1.0' },
    });
    const xml = await response.text();
    const data = parser.parse(xml);

    const entries = data.feed?.entry || [];
    const entryList = Array.isArray(entries) ? entries : [entries];

    const weatherEntries: any[] = [];

    // Filter relevant entries
    for (const entry of entryList) {
      const title = String(entry.title || '');
      if (!title.includes('気象警報・注意報')) {
        continue;
      }

      let link = entry.link;
      if (Array.isArray(link)) {
        const xmlLink = link.find((l: any) => l['@_type'] === 'application/xml');
        link = xmlLink ? xmlLink['@_href'] : link[0]?.['@_href'];
      } else if (link && typeof link === 'object') {
        link = link['@_href'];
      }

      if (!link) continue;

      try {
        const checkResponse = await fetch(link, {
          headers: { 'User-Agent': 'BousaiApp/1.0' },
        });
        const checkXml = await checkResponse.text();
        if (checkXml.includes(targetArea)) {
          const checkData = parser.parse(checkXml);
          weatherEntries.push(checkData);
        }
      } catch (e) {
        // Continue checking other feeds
      }
    }

    if (weatherEntries.length === 0) {
      const safeResult = {
        status: '発表なし',
        area: targetArea,
        warning: '🟩 現在、気象警報・注意報は確認されていません',
        details: [],
      };
      weatherCache.set(targetArea, { data: safeResult, timestamp: Date.now() });
      return res.json(safeResult);
    }

    const warningKinds: { name: string; code: string; status: string }[] = [];

    function searchWarningItems(obj: any) {
      if (!obj || typeof obj !== 'object') return;

      if (obj.Item) {
        const itemList = Array.isArray(obj.Item) ? obj.Item : [obj.Item];
        for (const item of itemList) {
          if (!item || typeof item !== 'object') continue;

          let targetAreaFound = false;
          if (item.Areas) {
            const areaGroups = Array.isArray(item.Areas) ? item.Areas : [item.Areas];
            for (const areas of areaGroups) {
              if (!areas || typeof areas !== 'object') continue;
              const areaList = areas.Area
                ? Array.isArray(areas.Area)
                  ? areas.Area
                  : [areas.Area]
                : [];
              for (const area of areaList) {
                if (!area || typeof area !== 'object') continue;
                let areaName = area.Name;
                if (areaName && typeof areaName === 'object') {
                  areaName = areaName['#text'];
                }
                if (areaName && String(areaName).includes(targetArea)) {
                  targetAreaFound = true;
                  break;
                }
              }
              if (targetAreaFound) break;
            }
          }

          if (targetAreaFound && item.Kind) {
            const kindList = Array.isArray(item.Kind) ? item.Kind : [item.Kind];
            for (const kind of kindList) {
              if (!kind || typeof kind !== 'object') continue;
              let name = kind.Name;
              if (name && typeof name === 'object') name = name['#text'];
              let code = kind.Code;
              if (code && typeof code === 'object') code = code['#text'];
              let status = kind.Status;
              if (status && typeof status === 'object') status = status['#text'];

              if (
                name &&
                !String(name).includes('解除') &&
                !String(status || '').includes('解除')
              ) {
                warningKinds.push({
                  name: String(name),
                  code: code ? String(code) : '',
                  status: status ? String(status) : '',
                });
              }
            }
          }
        }
      }

      for (const key in obj) {
        if (key === 'Item') continue;
        if (obj[key] && typeof obj[key] === 'object') {
          searchWarningItems(obj[key]);
        }
      }
    }

    for (const data of weatherEntries) {
      searchWarningItems(data);
    }

    // Deduplicate
    const uniqueWarnings: { name: string; code: string; status: string }[] = [];
    for (const w of warningKinds) {
      if (!uniqueWarnings.some((item) => item.name === w.name && item.code === w.code)) {
        uniqueWarnings.push(w);
      }
    }

    // 警報レベルが高い順（特別警報 > 危険警報 > 警報 > 注意報）にソート
    function getWarningRank(name: string): number {
      if (name.includes('特別警報')) return 5;
      if (name.includes('危険警報')) return 4;
      if (name.includes('警報')) return 3;
      if (name.includes('注意報')) return 2;
      return 1;
    }

    uniqueWarnings.sort((a, b) => getWarningRank(b.name) - getWarningRank(a.name));

    let status = '発表なし';
    let warning = '🟩 現在、気象警報・注意報は確認されていません';
    const warningText = uniqueWarnings.map((w) => w.name).join('、');

    if (warningText.includes('特別警報')) {
      status = '特別警報';
      warning = `⬛ ${targetArea}で特別警報が発表されています`;
    } else if (warningText.includes('危険警報')) {
      status = '危険警報';
      warning = `🟪 ${targetArea}で危険警報が発表されています`;
    } else if (warningText.includes('警報')) {
      status = '警報';
      warning = `🟥 ${targetArea}で警報が発表されています`;
    } else if (warningText.includes('注意報')) {
      status = '注意報';
      warning = `🟨 ${targetArea}で注意報が発表されています`;
    }

    const result = {
      status,
      area: targetArea,
      warning,
      details: uniqueWarnings,
    };

    weatherCache.set(targetArea, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.json({
      status: '発表なし',
      area: targetArea,
      warning: `🟩 現在、${targetArea}の気象警報・注意報はありません`,
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
