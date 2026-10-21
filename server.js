const http = require("http");
const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser({
    ignoreAttributes: false
});

const JMA_FEED =
    "https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml";

    const JMA_TSUNAMI_TITLE = "津波警報・注意報・予報";

    const JMA_WEATHER_FEED =
    "https://www.data.jma.go.jp/developer/xml/feed/extra.xml";

const server = http.createServer(async (req, res) => {

    // =========================
    // 本物の気象庁 地震情報API
    // =========================
    if (req.url === "/api/earthquake") {

        try {

            // ① 気象庁の一覧XMLを取得
            const feedResponse = await fetch(JMA_FEED);
            const feedXml = await feedResponse.text();

            // ② XMLを解析
            const feedData = parser.parse(feedXml);

            const entries = feedData.feed.entry;

            // ③ 「震源・震度に関する情報」を探す
            const entryList = Array.isArray(entries)
                ? entries
                : [entries];

            const earthquakeEntry = entryList.find(entry =>
                entry.title === "震源・震度に関する情報"
            );

            if (!earthquakeEntry) {
                throw new Error("地震情報が見つかりませんでした");
            }

            // ④ 詳細な地震XMLのURLを取得
            let detailUrl = earthquakeEntry.link;

            if (Array.isArray(detailUrl)) {
                const xmlLink = detailUrl.find(link =>
                    link["@_type"] === "application/xml"
                );

                if (xmlLink) {
                    detailUrl = xmlLink["@_href"];
                }
            } else {
                detailUrl = detailUrl["@_href"];
            }

            // ⑤ 詳細XMLを取得
            const detailResponse = await fetch(detailUrl);
            const detailXml = await detailResponse.text();

            // ⑥ 詳細XMLを解析
            const detailData = parser.parse(detailXml);

            const body = detailData.Report.Body;

            const earthquake = body.Earthquake;

            // 発生時刻
            const originTime = earthquake.OriginTime;

            // 震源地
            const areaName =
                earthquake.Hypocenter.Area.Name;

            // マグニチュード
            let magnitude =
                earthquake["jmx_eb:Magnitude"];

            if (typeof magnitude === "object") {
                magnitude = magnitude["#text"];
            }

            // 最大震度
            let maxIntensity = body.Intensity.Observation.MaxInt;

            // データを返す
            const result = {
                time: originTime,
                area: areaName,
                intensity: maxIntensity,
                magnitude: magnitude,
                warning: "気象庁から最新の地震情報を取得しました"
            };

            res.writeHead(200, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });

            res.end(JSON.stringify(result));

            return;

        } catch (error) {

            console.error(error);

            res.writeHead(500, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                error: "地震情報を取得できませんでした"
            }));

            return;
        }
    }


    // =========================
    // 津波情報API
    // =========================
    if (req.url === "/api/tsunami") {

        try {

            // 気象庁のXML一覧を取得
            const response = await fetch(JMA_FEED);
            const xml = await response.text();

            const data = parser.parse(xml);

            const entries = data.feed.entry || [];

            const entryList = Array.isArray(entries)
                ? entries
                : [entries];

            // 最新の津波警報・注意報を探す
            const tsunamiEntry = entryList.find(entry =>
                entry.title === JMA_TSUNAMI_TITLE
            );

            // 津波情報がない場合
            if (!tsunamiEntry) {

                res.writeHead(200, {
                    "Content-Type":
                        "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    status: "発表なし",
                    area: "---",
                    warning: "🟩 現在、津波警報・注意報はありません",
                }));

                return;
            }

            // 津波情報のXML URLを取得
            let detailUrl = tsunamiEntry.link;

            if (Array.isArray(detailUrl)) {

                const xmlLink = detailUrl.find(link =>
                    link["@_type"] === "application/xml"
                );

                if (xmlLink) {
                    detailUrl = xmlLink["@_href"];
                }

            } else {

                detailUrl = detailUrl["@_href"];

            }

            // 詳細XMLを取得
            const detailResponse = await fetch(detailUrl);
            const detailXml = await detailResponse.text();

            const detailData = parser.parse(detailXml);

            // XMLの中から情報を探す
            const text =
                JSON.stringify(detailData);

            let status = "発表あり";

            if (text.includes("大津波警報")) {
                status = "大津波警報";
            } else if (text.includes("津波警報")) {
                status = "津波警報";
            } else if (text.includes("津波注意報")) {
                status = "津波注意報";
            } else if (text.includes("津波予報")) {
                status = "津波予報";
            }

            let warning = "⚠️ 津波情報が発表されています";

            if (status === "大津波警報") {
                warning =
                    "🚨 大津波警報が発表されています。直ちに安全な場所へ避難してください";
            } else if (status === "津波警報") {
                warning =
                    "🟪 津波警報が発表されています。安全な場所へ避難してください";
            } else if (status === "津波注意報") {
                warning =
                    "🟥 津波注意報が発表されています。海から離れてください";
            } else if (status === "津波予報") {
                warning =
                    "🟨 津波予報が発表されています";
            }

            const result = {
                status: status,
                area: "気象庁の最新情報を確認してください",
                warning: warning
            };

            res.writeHead(200, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });

            res.end(JSON.stringify(result));

            return;

        } catch (error) {

            console.error(error);

            res.writeHead(500, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                status: "取得失敗",
                area: "---",
                warning:
                    "⚠️ 津波情報を取得できませんでした"
            }));

            return;
        }
    }

    // =========================
    // 気象警報・注意報API
    // =========================
    if (req.url.startsWith("/api/weather")) {

        try {

            // 気象庁の最新XML一覧を取得
            const response = await fetch(JMA_WEATHER_FEED);
            const xml = await response.text();

            // XMLを解析
            const data = parser.parse(xml);

            const entries = data.feed.entry || [];

            const entryList = Array.isArray(entries)
                ? entries
                : [entries];

            // =========================
            // 対象都道府県
            // =========================

            const url = new URL(
                req.url,
                "http://localhost:3000"
            );

            const TARGET_AREA =
                url.searchParams.get("prefecture") || "";

            // 都道府県が選択されていない場合
            if (!TARGET_AREA) {

                res.writeHead(200, {
                    "Content-Type":
                        "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    status: "未選択",
                    area: "---",
                    warning:
                        "都道府県を選択してください"
                }));

                return;
            }


            // =========================
            // 対象都道府県の
            // 気象警報・注意報XMLを探す
            // =========================

            let weatherEntry = null;

            // =========================
            // 対象都道府県の
            // 気象警報・注意報XMLを全部探す
            // =========================

            const weatherEntries = [];

            for (const entry of entryList) {

                const title =
                    String(entry.title || "");

                // 気象警報・注意報以外は無視
                if (!title.includes("気象警報・注意報")) {
                    continue;
                }

                // XMLのURLを取得
                let link = entry.link;

                if (Array.isArray(link)) {

                    const xmlLink = link.find(
                        l =>
                            l["@_type"] ===
                            "application/xml"
                    );

                    if (xmlLink) {
                        link = xmlLink["@_href"];
                    }

                } else if (
                    link &&
                    typeof link === "object"
                ) {

                    link = link["@_href"];
                }

                if (!link) {
                    continue;
                }

                // 詳細XMLを取得
                const checkResponse =
                    await fetch(link);

                const checkXml =
                    await checkResponse.text();

                const checkData =
                    parser.parse(checkXml);

                // 都道府県が入っているか確認
                const checkText =
                    JSON.stringify(checkData);

                if (
                    checkText.includes(TARGET_AREA)
                ) {

                    weatherEntries.push(entry);
                }
            }


            // =========================
            // 情報が見つからない場合
            // =========================

            if (weatherEntries.length === 0) {

                res.writeHead(200, {
                    "Content-Type":
                        "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    status: "発表なし",
                    area: TARGET_AREA,
                    warning:
                        "🟩 現在、気象警報・注意報は確認されていません"
                }));

                return;
            }


            // =========================
            // 見つかったすべてのXMLから
            // 警報・注意報を取得
            // =========================

            const detailDataList = [];

            for (const weatherEntry of weatherEntries) {

                let detailUrl =
                    weatherEntry.link;

                if (Array.isArray(detailUrl)) {

                    const xmlLink =
                        detailUrl.find(
                            link =>
                                link["@_type"] ===
                                "application/xml"
                        );

                    if (xmlLink) {
                        detailUrl =
                            xmlLink["@_href"];
                    }

                } else {

                    detailUrl =
                        detailUrl["@_href"];
                }

                if (!detailUrl) {
                    continue;
                }

                // 詳細XMLを取得
                const detailResponse =
                    await fetch(detailUrl);

                const detailXml =
                    await detailResponse.text();

                const detailData =
                    parser.parse(detailXml);

                detailDataList.push(detailData);
            }


            // =========================
            // 警報情報を保存
            // =========================

            const warningKinds = [];


            // =========================
            // XMLから警報を探す
            // =========================

            function searchWarningItems(obj) {

                if (
                    !obj ||
                    typeof obj !== "object"
                ) {
                    return;
                }


                // Itemを発見
                if (obj.Item) {

                    const itemList =
                        Array.isArray(obj.Item)
                            ? obj.Item
                            : [obj.Item];


                    for (const item of itemList) {

                        if (
                            !item ||
                            typeof item !== "object"
                        ) {
                            continue;
                        }


                        // -------------------------
                        // 対象地域を確認
                        // -------------------------

                        let targetAreaFound =
                            false;


                        if (item.Areas) {

                            const areaGroups =
                                Array.isArray(item.Areas)
                                    ? item.Areas
                                    : [item.Areas];


                            for (
                                const areas
                                of areaGroups
                            ) {

                                if (
                                    !areas ||
                                    typeof areas !==
                                    "object"
                                ) {
                                    continue;
                                }


                                const areaList =
                                    areas.Area
                                        ? (
                                            Array.isArray(
                                                areas.Area
                                            )
                                                ? areas.Area
                                                : [areas.Area]
                                        )
                                        : [];


                                for (
                                    const area
                                    of areaList
                                ) {

                                    if (
                                        !area ||
                                        typeof area !==
                                        "object"
                                    ) {
                                        continue;
                                    }


                                    let areaName =
                                        area.Name;


                                    if (
                                        areaName &&
                                        typeof areaName ===
                                        "object"
                                    ) {
                                        areaName =
                                            areaName[
                                                "#text"
                                            ];
                                    }


                                    if (
                                        areaName &&
                                        String(
                                            areaName
                                        ).includes(
                                            TARGET_AREA
                                        )
                                    ) {

                                        targetAreaFound =
                                            true;

                                        break;
                                    }
                                }


                                if (
                                    targetAreaFound
                                ) {
                                    break;
                                }
                            }
                        }


                        // -------------------------
                        // 対象地域ならKindを見る
                        // -------------------------

                        if (
                            targetAreaFound &&
                            item.Kind
                        ) {

                            const kindList =
                                Array.isArray(
                                    item.Kind
                                )
                                    ? item.Kind
                                    : [item.Kind];


                            for (
                                const kind
                                of kindList
                            ) {

                                if (
                                    !kind ||
                                    typeof kind !==
                                    "object"
                                ) {
                                    continue;
                                }


                                let name =
                                    kind.Name;


                                if (
                                    name &&
                                    typeof name ===
                                    "object"
                                ) {

                                    name =
                                        name[
                                            "#text"
                                        ];
                                }


                                let code =
                                    kind.Code;


                                if (
                                    code &&
                                    typeof code ===
                                    "object"
                                ) {

                                    code =
                                        code[
                                            "#text"
                                        ];
                                }


                                let status =
                                    kind.Status;


                                if (
                                    status &&
                                    typeof status ===
                                    "object"
                                ) {

                                    status =
                                        status[
                                            "#text"
                                        ];
                                }


                                // -------------------------
                                // 発表状態を確認
                                // -------------------------




                                // 解除された情報は表示対象から除外
                                if (
                                    name &&
                                    !String(name).includes("解除") &&
                                    !String(status || "").includes("解除")
                                ) {
                                    warningKinds.push({
                                        name: String(name),
                                        code: code ? String(code) : "",
                                        status: status ? String(status) : ""
                                    });
                                }
                            }
                        }
                    }
                }


                // -------------------------
                // 下の階層も調べる
                // -------------------------

                for (
                    const key in obj
                ) {

                    if (
                        key === "Item"
                    ) {
                        continue;
                    }


                    if (
                        obj[key] &&
                        typeof obj[key] ===
                        "object"
                    ) {

                        searchWarningItems(
                            obj[key]
                        );
                    }
                }
            }


            // 見つかったすべてのXMLを検索
            for (const detailData of detailDataList) {
                searchWarningItems(detailData);
            }


            // =========================
            // 重複を削除
            // =========================

            const uniqueWarnings = [];

            for (
                const warning
                of warningKinds
            ) {

                const exists =
                    uniqueWarnings.some(
                        item =>
                            item.name ===
                            warning.name &&
                            item.code ===
                            warning.code
                    );


                if (!exists) {
                    uniqueWarnings.push(
                        warning
                    );
                }
            }


            // =========================
            // 警報レベルを判定
            // =========================

            let status =
                "発表なし";

            let warning =
                "🟩 現在、気象警報・注意報は確認されていません";


            // 取得した警報を文字列化
            const warningText =
                uniqueWarnings
                    .map(item => item.name)
                    .join("、");


            // =========================
            // レベル5
            // 特別警報
            // =========================

            if (
                warningText.includes(
                    "特別警報"
                )
            ) {

                status =
                    "特別警報";

                warning =
                    `⬛ ${TARGET_AREA}で特別警報が発表されています`;
            }


            // =========================
            // レベル4
            // 危険警報
            // =========================

            else if (
                warningText.includes(
                    "危険警報"
                )
            ) {

                status =
                    "危険警報";

                warning =
                    `🟪 ${TARGET_AREA}で危険警報が発表されています`;
            }


            // =========================
            // レベル3
            // 警報
            // =========================

            else if (
                warningText.includes(
                    "警報"
                )
            ) {

                status =
                    "警報";

                warning =
                    `🟥 ${TARGET_AREA}で警報が発表されています`;
            }


            // =========================
            // レベル2
            // 注意報
            // =========================

            else if (
                warningText.includes(
                    "注意報"
                )
            ) {

                status =
                    "注意報";

                warning =
                    `🟨 ${TARGET_AREA}で注意報が発表されています`;
            }


            // =========================
            // 結果
            // =========================

            const result = {

                status:
                    status,

                area:
                    TARGET_AREA,

                warning:
                    warning,

                details:
                    uniqueWarnings
            };


            // JSONを返す
            res.writeHead(200, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });


            res.end(
                JSON.stringify(result)
            );


            return;


        } catch (error) {

            console.error(error);


            res.writeHead(500, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });


            res.end(JSON.stringify({

                status:
                    "取得失敗",

                area:
                    "---",

                warning:
                    "⚠️ 気象警報・注意報を取得できませんでした"

            }));


            return;
        }
    }

    // =========================
    // HTML・CSS・JavaScript・画像
    // =========================

    let filePath = req.url === "/"
        ? path.join(__dirname, "index.html")
        : path.join(__dirname, req.url);

    filePath = path.normalize(filePath);

    fs.readFile(filePath, (err, data) => {

        if (err) {

            res.writeHead(404, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end("ページが見つかりません");

            return;
        }

        const ext = path.extname(filePath);

        const contentTypes = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg"
        };

        res.writeHead(200, {
            "Content-Type":
                contentTypes[ext] ||
                "application/octet-stream"
        });

        res.end(data);
    });
});

server.listen(3000, () => {

    console.log(
        "防災アプリのサーバーが起動しました！"
    );

    console.log(
        "http://localhost:3000"
    );
});