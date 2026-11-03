/**
 * WGS-84 → GCJ-02（火星坐标）转换。
 *
 * 高德瓦片和高德 App 拾取的坐标都是 GCJ-02；浏览器 `navigator.geolocation`
 * 返回的是 WGS-84，展示在高德底图上需要先转换，否则会偏移几百米。
 * 标准偏移算法，公开已久，精度对「定位到校园附近」的场景足够。
 */
const { PI } = Math;
const A = 6_378_245;
const EE = 0.006693421622965943;

const transformLat = (x: number, y: number): number => {
  let ret =
    -100 +
    2 * x +
    3 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));

  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  ret +=
    ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3;

  return ret;
};

const transformLng = (x: number, y: number): number => {
  let ret =
    300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));

  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  ret +=
    ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3;

  return ret;
};

const outOfChina = (lng: number, lat: number): boolean =>
  lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;

export const wgs84ToGcj02 = (lng: number, lat: number): [number, number] => {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }

  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);

  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

  return [lng + dLng, lat + dLat];
};
