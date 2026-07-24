export type EntryLocation = {
  lat: number;
  lng: number;
  label?: string;
  capturedAt?: string;
};

export function formatCoords(loc: EntryLocation) {
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
}

export function mapsUrl(loc: EntryLocation) {
  const q = loc.label
    ? encodeURIComponent(loc.label)
    : `${loc.lat},${loc.lng}`;
  return `https://maps.google.com/?q=${q}`;
}

export function getCurrentPosition(): Promise<EntryLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("当前浏览器不支持定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          capturedAt: new Date().toISOString(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("未获得定位权限，请在浏览器设置中允许"));
          return;
        }
        reject(new Error("获取位置失败，请稍后重试"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}
