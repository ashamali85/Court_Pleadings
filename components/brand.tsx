/**
 * Brand artwork.
 *
 * The logo mark (public/brand/logo.png) was generated with Higgsfield; the
 * illustrations below are inline SVG in the same Kuwaiti-architectural
 * direction, so they stay crisp at any size, follow the CSS colour tokens and
 * add no network requests. To use raster artwork instead, drop files at
 * public/brand/login.png, empty.png, success.png and swap the components.
 */

export function SkylineArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 420"
      role="img"
      aria-label="أفق مدينة الكويت"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c2f6b" />
          <stop offset="60%" stopColor="#0a3d91" />
          <stop offset="100%" stopColor="#1b67d5" />
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.62" />
        </linearGradient>
      </defs>

      <rect width="320" height="420" fill="url(#sky)" />

      {/* horizon glow */}
      <circle cx="160" cy="330" r="150" fill="#ffffff" opacity="0.06" />
      <circle cx="160" cy="330" r="96" fill="#ffffff" opacity="0.05" />

      {/* Liberation Tower */}
      <g fill="url(#tower)">
        <rect x="60" y="150" width="6" height="200" />
        <path d="M63 118 L68 150 L58 150 Z" />
        <ellipse cx="63" cy="196" rx="13" ry="16" />
        <ellipse cx="63" cy="243" rx="9" ry="11" />
      </g>

      {/* Kuwait Towers */}
      <g fill="url(#tower)">
        <path d="M158 350 L163 205 L167 205 L172 350 Z" />
        <ellipse cx="165" cy="196" rx="30" ry="26" />
        <ellipse cx="165" cy="150" rx="15" ry="13" />
        <path d="M163 96 L167 96 L166 138 L164 138 Z" />

        <path d="M206 350 L210 243 L214 243 L218 350 Z" />
        <ellipse cx="212" cy="238" rx="21" ry="18" />
        <path d="M210 178 L214 178 L213 220 L211 220 Z" />

        <path d="M243 350 L246 268 L249 268 L252 350 Z" />
        <path d="M245 214 L249 214 L248 268 L246 268 Z" />
      </g>

      {/* waterline */}
      <g opacity="0.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round">
        <line x1="22" y1="366" x2="112" y2="366" />
        <line x1="132" y1="366" x2="214" y2="366" />
        <line x1="236" y1="366" x2="298" y2="366" />
        <line x1="44" y1="382" x2="150" y2="382" opacity="0.7" />
        <line x1="176" y1="382" x2="276" y2="382" opacity="0.7" />
        <line x1="70" y1="398" x2="240" y2="398" opacity="0.45" />
      </g>
    </svg>
  )
}

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
