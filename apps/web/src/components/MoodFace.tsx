import type { MoodId } from "../lib/format";

type Props = {
  id: string | null | undefined;
  size?: number;
  className?: string;
};

/** 卡通贴纸风情绪脸 */
export function MoodFace({ id, size = 28, className }: Props) {
  if (!id) return null;
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 64 64",
    className,
    "aria-hidden": true as const,
  };

  switch (id as MoodId) {
    case "calm":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill="#FFE8A3" stroke="#3D2E0A" strokeWidth="3" />
          <circle cx="22" cy="28" r="3.5" fill="#3D2E0A" />
          <circle cx="42" cy="28" r="3.5" fill="#3D2E0A" />
          <path
            d="M22 40c3 6 17 6 20 0"
            fill="none"
            stroke="#3D2E0A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="14" cy="36" r="5" fill="#FFB4A2" opacity="0.7" />
          <circle cx="50" cy="36" r="5" fill="#FFB4A2" opacity="0.7" />
        </svg>
      );
    case "anxious":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill="#FFF3C4" stroke="#3D2E0A" strokeWidth="3" />
          <ellipse cx="22" cy="30" rx="4" ry="5" fill="#3D2E0A" />
          <ellipse cx="42" cy="30" rx="4" ry="5" fill="#3D2E0A" />
          <path
            d="M24 44c4-4 12-4 16 0"
            fill="none"
            stroke="#3D2E0A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M48 14l2 8M52 16l-2 7M44 16l3 6"
            stroke="#5B8DEF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "greedy":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill="#FFE08A" stroke="#3D2E0A" strokeWidth="3" />
          <circle cx="22" cy="28" r="7" fill="#2D8A4E" stroke="#3D2E0A" strokeWidth="2" />
          <circle cx="42" cy="28" r="7" fill="#2D8A4E" stroke="#3D2E0A" strokeWidth="2" />
          <text x="22" y="32" textAnchor="middle" fontSize="9" fontWeight="700" fill="#FFF">
            $
          </text>
          <text x="42" y="32" textAnchor="middle" fontSize="9" fontWeight="700" fill="#FFF">
            $
          </text>
          <path
            d="M22 42c4 8 16 8 20 0"
            fill="none"
            stroke="#3D2E0A"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "fearful":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill="#E8EEF8" stroke="#3D2E0A" strokeWidth="3" />
          <ellipse cx="22" cy="30" rx="6" ry="8" fill="#FFF" stroke="#3D2E0A" strokeWidth="2" />
          <ellipse cx="42" cy="30" rx="6" ry="8" fill="#FFF" stroke="#3D2E0A" strokeWidth="2" />
          <circle cx="22" cy="32" r="3" fill="#3D2E0A" />
          <circle cx="42" cy="32" r="3" fill="#3D2E0A" />
          <ellipse cx="32" cy="46" rx="5" ry="6" fill="#3D2E0A" />
          <path d="M18 18c2-4 6-4 8 0M38 18c2-4 6-4 8 0" fill="none" stroke="#3D2E0A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "neutral":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill="#F0F2F5" stroke="#3D2E0A" strokeWidth="3" />
          <circle cx="22" cy="28" r="3.5" fill="#3D2E0A" />
          <circle cx="42" cy="28" r="3.5" fill="#3D2E0A" />
          <path d="M24 42h16" stroke="#3D2E0A" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
