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

// マップをクリックしてポイントを追加
map.on("click", async (e) => {
  const { lat, lng } = e.latlng;
  const marker = L.marker([lat, lng]).addTo(map);
  points.push([lat, lng]);

  // ポイントが2つ以上なら線を引く
  if (points.length > 1) {
    const prevPoint = points[points.length - 2];
    L.polyline([prevPoint, [lat, lng]], { color: "red", weight: 3 }).addTo(map);
    
    // 2点間の道路データを取得し描画
    await fetchRoadData(prevPoint, [lat, lng]);
  }
});

// Overpass APIを利用して2点間の道路データを取得
const fetchRoadData = async (point1, point2) => {
  const query = `
    [out:json];
    way["highway"](around:50, ${point1[0]}, ${point1[1]});
    way["highway"](around:50, ${point2[0]}, ${point2[1]});
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
