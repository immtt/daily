/** 卡通熊猫图标 SVG，variant: default(阴影+浅灰底) | shadow | tinted */
export function pandaIconSvg(size, variant = "default") {
  const r = Math.round(size * 0.21875);
  const s = size / 512;

  const useTinted = variant === "default" || variant === "tinted";
  const useShadow = variant === "default" || variant === "shadow";

  const bgGrad = useTinted
    ? `<linearGradient id="bgGrad" x1="0.5" y1="0" x2="0.5" y2="1">
         <stop offset="0%" stop-color="#f7f8fa"/>
         <stop offset="100%" stop-color="#e9edf2"/>
       </linearGradient>`
    : "";

  const bgFill = useTinted ? "url(#bgGrad)" : "#ffffff";
  const borderStroke = useTinted ? "#d8dee6" : "#ececec";

  const shadowFilter = useShadow
    ? `<filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
         <feDropShadow dx="0" dy="${10 * s}" stdDeviation="${18 * s}" flood-color="#000" flood-opacity="0.22"/>
         <feDropShadow dx="0" dy="${3 * s}" stdDeviation="${6 * s}" flood-color="#000" flood-opacity="0.10"/>
       </filter>
       <filter id="faceGlow" x="-40%" y="-40%" width="180%" height="180%">
         <feDropShadow dx="0" dy="${6 * s}" stdDeviation="${14 * s}" flood-color="#000" flood-opacity="0.12"/>
       </filter>`
    : `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
         <feDropShadow dx="0" dy="${4 * s}" stdDeviation="${8 * s}" flood-color="#000" flood-opacity="0.08"/>
       </filter>`;

  const faceFilter = useShadow ? ' filter="url(#faceGlow)"' : "";
  const faceStroke = useShadow ? "#e2e2e2" : useTinted ? "#ffffff" : "#f3f3f3";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    ${bgGrad}
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb3c1"/>
      <stop offset="100%" stop-color="#ffb3c1" stop-opacity="0"/>
    </radialGradient>
    ${shadowFilter}
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>
  <rect x="${16 * s}" y="${16 * s}" width="${480 * s}" height="${480 * s}" rx="${92 * s}" stroke="${borderStroke}" stroke-width="${2 * s}" fill="none"/>
  <g filter="url(#soft)">
    <circle cx="${186 * s}" cy="${196 * s}" r="${40 * s}" fill="#171717"/>
    <circle cx="${186 * s}" cy="${198 * s}" r="${24 * s}" fill="#303030"/>
    <circle cx="${326 * s}" cy="${196 * s}" r="${40 * s}" fill="#171717"/>
    <circle cx="${326 * s}" cy="${198 * s}" r="${24 * s}" fill="#303030"/>
    <circle cx="${256 * s}" cy="${292 * s}" r="${122 * s}" fill="#ffffff" stroke="${faceStroke}" stroke-width="${2 * s}"${faceFilter}/>
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
