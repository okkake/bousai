const updateButton = document.getElementById("update-button");
const updateTime = document.getElementById("update-time");

if (updateButton && updateTime) {

    updateButton.addEventListener("click", async function () {

        try {
            updateTime.textContent = "🔄 最新情報を確認中...";

            const response = await fetch("/api/earthquake");

            // JSONに変換
            const data = await response.json();

            // 画面に表示
            // 発生時刻を見やすく表示

            const earthquakeDate = new Date(data.time);

            const formattedEarthquakeTime =
                earthquakeDate.getFullYear() + "年" +
                (earthquakeDate.getMonth() + 1) + "月" +
                earthquakeDate.getDate() + "日 " +
                String(earthquakeDate.getHours()).padStart(2, "0") + ":" +
                String(earthquakeDate.getMinutes()).padStart(2, "0") + ":" +
                String(earthquakeDate.getSeconds()).padStart(2, "0");

            document.getElementById("earthquake-time").textContent =
                formattedEarthquakeTime;
            document.getElementById("earthquake-area").textContent = data.area;
            document.getElementById("earthquake-intensity").textContent = data.intensity;
            document.getElementById("earthquake-magnitude").textContent = data.magnitude;

            document.getElementById("earthquake-warning").textContent =
                data.warning;

            // 震度に応じて注意表示を変更
            const warningBox = document.getElementById("earthquake-warning");
            const intensity = data.intensity;

            const earthquakeCard =
                document.querySelector(".earthquake-card");

            if (earthquakeCard) {

                earthquakeCard.classList.remove(
                    "earthquake-safe",
                    "earthquake-yellow",
                    "earthquake-orange",
                    "earthquake-red",
                    "earthquake-emergency"
                );

                const intensityText = String(intensity);

                if (intensityText.includes("7")) {

                    earthquakeCard.classList.add(
                        "earthquake-emergency"
                    );

                } else if (intensityText.includes("6")) {

                    earthquakeCard.classList.add(
                        "earthquake-red"
                    );

                } else if (intensityText.includes("5")) {

                    earthquakeCard.classList.add(
                        "earthquake-orange"
                    );

                } else if (intensityText.includes("4")) {

                    earthquakeCard.classList.add(
                        "earthquake-yellow"
                    );

                } else {

                    earthquakeCard.classList.add(
                        "earthquake-safe"
                    );
                }
            }

            if (String(intensity).includes("7")) {
                warningBox.textContent = "🚨 非常に強い揺れです！安全な場所へ避難してください";
            } else if (String(intensity).includes("6")) {
                warningBox.textContent = "🟪 強い揺れに注意してください";
            } else if (String(intensity).includes("5")) {
                warningBox.textContent = "🟥 強い揺れに注意してください";
            } else if (String(intensity).includes("4")) {
                warningBox.textContent = "🟨 揺れに注意してください";
            } else {
                warningBox.textContent = "🟩 現在、大きな揺れは確認されていません";
            }

            // 確認した時刻
            const now = new Date();

            const time =
                now.getHours().toString().padStart(2, "0") + ":" +
                now.getMinutes().toString().padStart(2, "0") + ":" +
                now.getSeconds().toString().padStart(2, "0");

            updateTime.textContent = "最終確認：" + time;

            // ページ上部の危険度を更新
            updateOverallStatus();

        } catch (error) {
            console.error(error);

            document.getElementById("earthquake-warning").textContent =
                "⚠️ 災害情報を取得できませんでした";

            updateTime.textContent =
                "❌ 情報の取得に失敗しました";
        }
    });
}

// 5分ごとに最新の地震情報を確認
setInterval(() => {
    if (updateButton) {
        updateButton.click();
    }
}, 5 * 60 * 1000);

// ページを開いたときにも一度確認
if (updateButton) {
    updateButton.click();
}


// 津波情報を取得
async function updateTsunami() {

    const statusElement =
        document.getElementById("tsunami-status");

    const areaElement =
        document.getElementById("tsunami-area");

    const warningElement =
        document.getElementById("tsunami-warning");

    // 津波カードがないページでは何もしない
    if (!statusElement || !areaElement || !warningElement) {
        return;
    }

    try {

        const response = await fetch("/api/tsunami");
        const data = await response.json();

        statusElement.textContent =
            data.status;

        areaElement.textContent =
            data.area;

        warningElement.textContent =
            data.warning;

        // ページ上部の危険度を更新
        updateOverallStatus();

    } catch (error) {

        console.error(error);

        warningElement.textContent =
            "⚠️ 津波情報を取得できませんでした";
    }
}

// ページを開いたときに確認
updateTsunami();

// 5分ごとに確認
setInterval(updateTsunami, 5 * 60 * 1000);


// ↓↓↓ ここから追加 ↓↓↓

// =========================
// 気象警報・注意報を取得
// =========================
async function updateWeather() {

    const statusElement =
        document.getElementById("weather-status");

    const areaElement =
        document.getElementById("weather-area");

    const warningElement =
        document.getElementById("weather-warning");

    // 気象カードがないページでは何もしない
    if (!statusElement || !areaElement || !warningElement) {
        return;
    }

    try {

const prefectureSelect =
    document.getElementById("prefecture-select");

const prefecture =
    prefectureSelect ? prefectureSelect.value : "";

// 都道府県がまだ選ばれていない場合
if (!prefecture) {
    statusElement.textContent = "未選択";
    areaElement.textContent = "---";
    warningElement.textContent =
        "都道府県を選択してください";

    return;
}

const response = await fetch(
    "/api/weather?prefecture=" +
    encodeURIComponent(prefecture)
);

const data = await response.json();

        statusElement.textContent =
            data.status;

        areaElement.textContent =
            data.area;

        warningElement.textContent =
            data.warning;

        // 発表されている警報・注意報の種類を表示
        const detailsElement =
            document.getElementById("weather-details");

        if (detailsElement) {

            detailsElement.replaceChildren();

            const details =
                Array.isArray(data.details)
                    ? data.details
                    : [];

            if (details.length === 0) {

                detailsElement.textContent =
                    "なし";

            } else {

                details.forEach(function (item) {

                    const detail =
                        document.createElement("div");

                    const name =
                        String(item.name || "");

                    // 解除の情報は表示しない
                    if (name.includes("解除")) {
                        return;
                    }

                    let icon = "🟩";

                    if (name.includes("特別警報")) {

                        icon = "⬛";

                    } else if (name.includes("危険警報")) {

                        icon = "🟪";

                    } else if (name.includes("警報")) {

                        icon = "🟥";

                    } else if (name.includes("注意報")) {

                        icon = "🟨";
                    }

                    detail.textContent =
                        icon + " " + name;

                    detailsElement.appendChild(detail);
                });
            }
        }

        // 危険度に応じてカードの色を変更
        const weatherCard =
            document.querySelector(".weather-card");

        if (weatherCard) {

        // いったん色をリセット
        weatherCard.classList.remove(
            "weather-safe",
            "weather-warning",
            "weather-danger",
            "weather-critical",
            "weather-emergency"
        );

            if (data.status === "特別警報") {

                // ⬛ 特別警報
                weatherCard.classList.add("weather-emergency");

            } else if (data.status === "危険警報") {

                // 🟪 危険警報
                weatherCard.classList.add("weather-critical");

            } else if (data.status === "警報") {

                // 🟥 警報
                weatherCard.classList.add("weather-danger");

            } else if (data.status === "注意報") {

                // 🟨 注意報
                weatherCard.classList.add("weather-warning");

            } else {

                // 🟩 発表なし
                weatherCard.classList.add("weather-safe");
            }
        }

        // ページ上部の危険度を更新
        updateOverallStatus();

    } catch (error) {

        console.error(error);

        warningElement.textContent =
            "⚠️ 気象警報・注意報を取得できませんでした";
    }
}

// ページを開いたときに確認
updateWeather();

// 都道府県を選んだらすぐに更新
const prefectureSelect =
    document.getElementById("prefecture-select");

if (prefectureSelect) {
    prefectureSelect.addEventListener("change", updateWeather);
}

// 5分ごとに確認
setInterval(updateWeather, 5 * 60 * 1000);


// =========================
// ページ上部の危険度表示
// =========================

function updateOverallStatus() {

    const overallStatus =
        document.getElementById("overall-status");

    if (!overallStatus) {
        return;
    }

    const weatherStatus =
        document.getElementById("weather-status");

    const status =
        weatherStatus
            ? weatherStatus.textContent
            : "";

    // いったん全部のクラスを削除
    overallStatus.classList.remove(
        "overall-safe",
        "overall-warning",
        "overall-danger",
        "overall-critical",
        "overall-emergency"
    );


    // ⬛ 特別警報
    if (status === "特別警報") {

        overallStatus.textContent =
            "⬛ 現在、特別警報が発表されています";

        overallStatus.classList.add(
            "overall-emergency"
        );


    // 🟪 危険警報
    } else if (status === "危険警報") {

        overallStatus.textContent =
            "🟪 現在、危険警報が発表されています";

        overallStatus.classList.add(
            "overall-critical"
        );


    // 🟥 警報
    } else if (status === "警報") {

        overallStatus.textContent =
            "🟥 現在、警報が発表されています";

        overallStatus.classList.add(
            "overall-danger"
        );


    // 🟨 注意報
    } else if (status === "注意報") {

        overallStatus.textContent =
            "🟨 現在、注意報が発表されています";

        overallStatus.classList.add(
            "overall-warning"
        );


    // 🟩 発表なし
    } else {

        overallStatus.textContent =
            "🟩 現在、気象警報・注意報はありません";

        overallStatus.classList.add(
            "overall-safe"
        );
    }
}

// =========================
// 現在地から避難場所を探す
// =========================

const findNearbyButton =
    document.getElementById("find-nearby-button");

const locationMessage =
    document.getElementById("location-message");

if (findNearbyButton && locationMessage) {

    findNearbyButton.addEventListener("click", function () {

        if (!navigator.geolocation) {
            locationMessage.textContent =
                "このブラウザでは現在地を取得できません。";
            return;
        }

        locationMessage.textContent =
            "現在地を取得しています...";

        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                locationMessage.textContent =
                    "現在地を取得しました。地図で確認できます。";

                const mapUrl =
                    "https://www.google.com/maps/search/避難所/@" +
                    latitude + "," + longitude + ",14z";

                window.open(mapUrl, "_blank");
            },

            function () {

                locationMessage.textContent =
                    "現在地を取得できませんでした。位置情報を許可するか、地図を直接開いてください。";

            }

        );

    });

}