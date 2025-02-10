import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// マップの初期化
const map = L.map("map").setView([33.18, 131.62], 16);

// タイルレイヤーを追加（OSM）
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// ポイントのリスト
let points = [];

// クリックされた地点が道路上かを判定
const isOnRoad = async (lat, lng) => {
  const query = `
    [out:json];
    way["highway"](around:10, ${lat}, ${lng});
    out geom;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.elements.length > 0 ? data.elements[0] : null; // 最も近い道路を取得
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return null;
  }
};

// マップをクリックしてポイントを追加
map.on("click", async (e) => {
  const { lat, lng } = e.latlng;
  const road = await isOnRoad(lat, lng);
  if (road) {
    const marker = L.marker([lat, lng]).addTo(map);
    points.push({ lat, lng, road });

    // ポイントが偶数個なら2点間の道路を描画
    if (points.length >= 2 && points.length % 2 === 0) {
      const prevPoint = points[points.length - 2];
      await fetchRoadData(prevPoint, { lat, lng, road });
    }
  } else {
    console.log("道路上のポイントを選択してください。");
  }
});

// Overpass APIを利用して2点間の最短道路データを取得
const fetchRoadData = async (point1, point2) => {
  const query = `
    [out:json];
    way["highway"](${point1.road.id});
    way["highway"](${point2.road.id});
    out geom;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    data.elements.forEach((element) => {
      if (element.type === "way" && element.geometry) {
        const coordinates = element.geometry.map((point) => [point.lat, point.lon]);
        L.polyline(coordinates, { color: "blue", weight: 3 }).addTo(map);
      }
    });
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
};
