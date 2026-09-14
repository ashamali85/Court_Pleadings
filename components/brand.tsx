/**
 * Brand artwork.
 *
 * The logo mark (public/brand/logo.png) was generated with Higgsfield; the
 * illustrations below are inline SVG in the same Kuwaiti-architectural
 * direction, so they stay crisp at any size, follow the CSS colour tokens and
 * add no network requests.
 *
 * The login hero is no longer drawn here — it is a generated video at
 * public/brand/login-kuwait.mp4 with a poster frame beside it, wired up in
 * app/login/page.tsx.
 */

export function EmptyArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      role="img"
      aria-label="لا توجد طلبات"
    >
      {/* Kuwaiti pointed arch */}
      <path
        d="M56 128 V70 Q56 34 100 18 Q144 34 144 70 V128"
        fill="#edf4ff"
        stroke="#1b67d5"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* sheets */}
      <g fill="#ffffff" stroke="#1b67d5" strokeWidth="2" strokeLinejoin="round">
        <rect x="74" y="60" width="52" height="62" rx="5" />
        <rect x="66" y="68" width="52" height="62" rx="5" />
      </g>
      <g stroke="#1b67d5" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round">
        <line x1="76" y1="84" x2="108" y2="84" />
        <line x1="76" y1="96" x2="102" y2="96" />
        <line x1="76" y1="108" x2="96" y2="108" />
      </g>
      {/* tray */}
      <path
        d="M34 126 H166 L156 142 H44 Z"
        fill="#edf4ff"
        stroke="#1b67d5"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SuccessArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      role="img"
      aria-label="تم إصدار الصحيفة"
    >
      <path
        d="M24 104 V52 Q24 28 60 16 Q96 28 96 52 V104 Z"
        fill="#edf4ff"
        stroke="#0a3d91"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="40"
        y="36"
        width="46"
        height="58"
        rx="5"
        fill="#ffffff"
        stroke="#0a3d91"
        strokeWidth="2.2"
      />
      <g stroke="#1b67d5" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round">
        <line x1="50" y1="50" x2="76" y2="50" />
        <line x1="50" y1="60" x2="72" y2="60" />
        <line x1="50" y1="70" x2="66" y2="70" />
      </g>
      {/* seal */}
      <circle cx="80" cy="88" r="16" fill="#0a3d91" />
      <path
        d="M72 88 l6 6 l11 -12"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
