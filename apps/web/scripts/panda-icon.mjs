/** 白底卡通熊猫图标 SVG */
export function pandaIconSvg(size) {
  const r = Math.round(size * 0.21875);
  const s = size / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb3c1"/>
      <stop offset="100%" stop-color="#ffb3c1" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${4 * s}" stdDeviation="${8 * s}" flood-color="#000" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="#ffffff"/>
  <rect x="${16 * s}" y="${16 * s}" width="${480 * s}" height="${480 * s}" rx="${92 * s}" stroke="#ececec" stroke-width="${2 * s}" fill="none"/>
  <g filter="url(#soft)">
    <circle cx="${186 * s}" cy="${196 * s}" r="${40 * s}" fill="#171717"/>
    <circle cx="${186 * s}" cy="${198 * s}" r="${24 * s}" fill="#303030"/>
    <circle cx="${326 * s}" cy="${196 * s}" r="${40 * s}" fill="#171717"/>
    <circle cx="${326 * s}" cy="${198 * s}" r="${24 * s}" fill="#303030"/>
    <circle cx="${256 * s}" cy="${292 * s}" r="${122 * s}" fill="#ffffff" stroke="#f3f3f3" stroke-width="${2 * s}"/>
    <ellipse cx="${206 * s}" cy="${284 * s}" rx="${32 * s}" ry="${38 * s}" fill="#171717" transform="rotate(-22 ${206 * s} ${284 * s})"/>
    <ellipse cx="${306 * s}" cy="${284 * s}" rx="${32 * s}" ry="${38 * s}" fill="#171717" transform="rotate(22 ${306 * s} ${284 * s})"/>
    <circle cx="${214 * s}" cy="${278 * s}" r="${14 * s}" fill="#ffffff"/>
    <circle cx="${298 * s}" cy="${278 * s}" r="${14 * s}" fill="#ffffff"/>
    <circle cx="${218 * s}" cy="${282 * s}" r="${8 * s}" fill="#111111"/>
    <circle cx="${302 * s}" cy="${282 * s}" r="${8 * s}" fill="#111111"/>
    <circle cx="${221 * s}" cy="${279 * s}" r="${3 * s}" fill="#ffffff"/>
    <circle cx="${305 * s}" cy="${279 * s}" r="${3 * s}" fill="#ffffff"/>
    <ellipse cx="${176 * s}" cy="${312 * s}" rx="${20 * s}" ry="${13 * s}" fill="url(#cheek)" opacity="0.95"/>
    <ellipse cx="${336 * s}" cy="${312 * s}" rx="${20 * s}" ry="${13 * s}" fill="url(#cheek)" opacity="0.95"/>
    <ellipse cx="${256 * s}" cy="${322 * s}" rx="${12 * s}" ry="${9 * s}" fill="#1a1a1a"/>
    <path d="M ${246 * s} ${328 * s} L ${256 * s} ${336 * s} L ${266 * s} ${328 * s}" fill="none" stroke="#1a1a1a" stroke-width="${2.5 * s}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${238 * s} ${342 * s} Q ${256 * s} ${354 * s} ${274 * s} ${342 * s}" fill="none" stroke="#1a1a1a" stroke-width="${2.8 * s}" stroke-linecap="round"/>
  </g>
</svg>`;
}
