/**
 * Brand artwork.
 *
 * The logo mark (public/brand/logo.png) was generated with Higgsfield; the
 * illustrations below are inline SVG in the same Kuwaiti-architectural
 * direction, so they stay crisp at any size, follow the CSS colour tokens and
 * add no network requests. To use raster artwork instead, drop files at
 * public/brand/login.png, empty.png, success.png and swap the components.
 *
 * SkylineArt is animated: CSS keyframes (app/globals.css) drive the starfield,
 * the grid horizon and the light sweep, while SMIL morphs the Kuwaiti flag.
 * Under prefers-reduced-motion the CSS animations stop and the flag falls back
 * to the static .flag-still group.
 */

export function SkylineArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 420"
      role="img"
      aria-label="أفق مدينة الكويت والعلم الكويتي"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04091c" />
          <stop offset="40%" stopColor="#0a2050" />
          <stop offset="74%" stopColor="#0a3d91" />
          <stop offset="100%" stopColor="#1b67d5" />
        </linearGradient>
        <radialGradient id="sk-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5fd9ff" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#2f7fe0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#2f7fe0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sk-glass" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#f2fdff" stopOpacity="0.95" />
          <stop offset="48%" stopColor="#9fe4ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#2f7fe0" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="sk-sweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ff2ff" stopOpacity="0" />
          <stop offset="45%" stopColor="#c9f7ff" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9ff2ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sk-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3d91" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0a3d91" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="sk-fold"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="62"
          y2="0"
          spreadMethod="repeat"
        >
          <stop offset="0%" stopColor="#001026" stopOpacity="0.34" />
          <stop offset="30%" stopColor="#001026" stopOpacity="0" />
          <stop offset="56%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="78%" stopColor="#001026" stopOpacity="0" />
          <stop offset="100%" stopColor="#001026" stopOpacity="0.34" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0 0"
            to="62 0"
            dur="3.6s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <clipPath id="sk-ground">
          <rect x="-420" y="320" width="1080" height="160" />
        </clipPath>
        <clipPath id="sk-towers">
          <path d="M183 320 L188.5 214 L195.5 214 L201 320 Z" />
          <ellipse cx="192" cy="210" rx="33" ry="28" />
          <ellipse cx="192" cy="163" rx="16" ry="13.5" />
          <path d="M190.6 104 L193.4 104 L193 152 L191 152 Z" />
          <path d="M232 320 L236 256 L242 256 L246 320 Z" />
          <ellipse cx="239" cy="252" rx="22.5" ry="19" />
          <path d="M237.6 194 L240.4 194 L240 234 L238 234 Z" />
          <path d="M268 320 L271 276 L275 276 L278 320 Z" />
          <path d="M271.2 216 L274.2 216 L274 276 L272 276 Z" />
        </clipPath>
        <filter id="sk-neon" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* night sky, drawn well past the viewBox so it fills the whole panel */}
      <rect x="-420" y="-320" width="1160" height="1060" fill="url(#sk-sky)" />

      {/* starfield */}
      <g>
        <circle
          className="sky-star"
          cx="89.5"
          cy="34.7"
          r="1.15"
          fill="#dff4ff"
          style={{ opacity: 0.57, animationDuration: '2.88s', animationDelay: '2.68s' }}
        />
        <circle
          className="sky-star"
          cx="-16.8"
          cy="102.4"
          r="0.54"
          fill="#dff4ff"
          style={{ opacity: 0.4, animationDuration: '4.25s', animationDelay: '0.35s' }}
        />
        <circle
          className="sky-star"
          cx="129.8"
          cy="163.1"
          r="0.62"
          fill="#dff4ff"
          style={{ opacity: 0.92, animationDuration: '3.45s', animationDelay: '3.14s' }}
        />
        <circle
          className="sky-star"
          cx="190.8"
          cy="81.4"
          r="1.48"
          fill="#dff4ff"
          style={{ opacity: 0.52, animationDuration: '2.78s', animationDelay: '4.29s' }}
        />
        <circle
          className="sky-star"
          cx="17.7"
          cy="28.4"
          r="0.81"
          fill="#dff4ff"
          style={{ opacity: 0.7, animationDuration: '5.7s', animationDelay: '0.9s' }}
        />
        <circle
          className="sky-star"
          cx="215.6"
          cy="76.8"
          r="1.05"
          fill="#dff4ff"
          style={{ opacity: 0.47, animationDuration: '2.84s', animationDelay: '0.3s' }}
        />
        <circle
          className="sky-star"
          cx="232.2"
          cy="87.2"
          r="0.81"
          fill="#dff4ff"
          style={{ opacity: 0.53, animationDuration: '4.83s', animationDelay: '2.27s' }}
        />
        <circle
          className="sky-star"
          cx="277.8"
          cy="138.8"
          r="0.74"
          fill="#dff4ff"
          style={{ opacity: 0.88, animationDuration: '4.78s', animationDelay: '2.63s' }}
        />
        <circle
          className="sky-star"
          cx="251.8"
          cy="60.7"
          r="1.48"
          fill="#dff4ff"
          style={{ opacity: 0.8, animationDuration: '3.05s', animationDelay: '2.09s' }}
        />
        <circle
          className="sky-star"
          cx="20.8"
          cy="98.9"
          r="0.54"
          fill="#dff4ff"
          style={{ opacity: 0.69, animationDuration: '5.14s', animationDelay: '3.82s' }}
        />
        <circle
          className="sky-star"
          cx="310.2"
          cy="65.6"
          r="1.2"
          fill="#dff4ff"
          style={{ opacity: 0.62, animationDuration: '4.86s', animationDelay: '2.9s' }}
        />
        <circle
          className="sky-star"
          cx="296.0"
          cy="185.5"
          r="0.97"
          fill="#dff4ff"
          style={{ opacity: 0.77, animationDuration: '5.12s', animationDelay: '0.3s' }}
        />
        <circle
          className="sky-star"
          cx="218.9"
          cy="194.7"
          r="1.32"
          fill="#dff4ff"
          style={{ opacity: 0.75, animationDuration: '3.68s', animationDelay: '1.93s' }}
        />
        <circle
          className="sky-star"
          cx="-31.0"
          cy="93.7"
          r="0.67"
          fill="#dff4ff"
          style={{ opacity: 0.81, animationDuration: '3.04s', animationDelay: '0.29s' }}
        />
        <circle
          className="sky-star"
          cx="11.7"
          cy="53.0"
          r="0.89"
          fill="#dff4ff"
          style={{ opacity: 0.62, animationDuration: '5.91s', animationDelay: '0.4s' }}
        />
        <circle
          className="sky-star"
          cx="179.8"
          cy="173.8"
          r="1.32"
          fill="#dff4ff"
          style={{ opacity: 0.6, animationDuration: '5.88s', animationDelay: '1.39s' }}
        />
        <circle
          className="sky-star"
          cx="103.5"
          cy="174.0"
          r="1.46"
          fill="#dff4ff"
          style={{ opacity: 0.49, animationDuration: '3.17s', animationDelay: '0.88s' }}
        />
        <circle
          className="sky-star"
          cx="53.3"
          cy="98.1"
          r="1.09"
          fill="#dff4ff"
          style={{ opacity: 0.6, animationDuration: '3.6s', animationDelay: '0.02s' }}
        />
        <circle
          className="sky-star"
          cx="107.7"
          cy="113.6"
          r="1.45"
          fill="#dff4ff"
          style={{ opacity: 0.72, animationDuration: '5.22s', animationDelay: '2.58s' }}
        />
        <circle
          className="sky-star"
          cx="230.5"
          cy="16.3"
          r="1.4"
          fill="#dff4ff"
          style={{ opacity: 0.83, animationDuration: '5.56s', animationDelay: '4.37s' }}
        />
        <circle
          className="sky-star"
          cx="117.0"
          cy="81.8"
          r="0.6"
          fill="#dff4ff"
          style={{ opacity: 0.39, animationDuration: '5.01s', animationDelay: '0.31s' }}
        />
        <circle
          className="sky-star"
          cx="43.5"
          cy="36.8"
          r="0.84"
          fill="#dff4ff"
          style={{ opacity: 0.44, animationDuration: '2.8s', animationDelay: '0.0s' }}
        />
        <circle
          className="sky-star"
          cx="0.6"
          cy="75.1"
          r="0.53"
          fill="#dff4ff"
          style={{ opacity: 0.44, animationDuration: '5.92s', animationDelay: '3.07s' }}
        />
        <circle
          className="sky-star"
          cx="60.9"
          cy="72.0"
          r="0.86"
          fill="#dff4ff"
          style={{ opacity: 0.95, animationDuration: '3.07s', animationDelay: '4.24s' }}
        />
        <circle
          className="sky-star"
          cx="146.4"
          cy="97.9"
          r="0.59"
          fill="#dff4ff"
          style={{ opacity: 0.51, animationDuration: '2.99s', animationDelay: '1.71s' }}
        />
        <circle
          className="sky-star"
          cx="291.5"
          cy="36.7"
          r="0.52"
          fill="#dff4ff"
          style={{ opacity: 0.44, animationDuration: '6.21s', animationDelay: '2.64s' }}
        />
        <circle
          className="sky-star"
          cx="177.3"
          cy="11.1"
          r="1.03"
          fill="#dff4ff"
          style={{ opacity: 0.77, animationDuration: '6.32s', animationDelay: '4.32s' }}
        />
        <circle
          className="sky-star"
          cx="64.4"
          cy="75.7"
          r="0.67"
          fill="#dff4ff"
          style={{ opacity: 0.82, animationDuration: '5.53s', animationDelay: '2.66s' }}
        />
        <circle
          className="sky-star"
          cx="91.9"
          cy="48.4"
          r="1.31"
          fill="#dff4ff"
          style={{ opacity: 0.83, animationDuration: '6.34s', animationDelay: '4.26s' }}
        />
        <circle
          className="sky-star"
          cx="287.3"
          cy="146.6"
          r="0.73"
          fill="#dff4ff"
          style={{ opacity: 0.37, animationDuration: '4.57s', animationDelay: '1.78s' }}
        />
        <circle
          className="sky-star"
          cx="-28.8"
          cy="59.1"
          r="0.76"
          fill="#dff4ff"
          style={{ opacity: 0.62, animationDuration: '5.23s', animationDelay: '4.78s' }}
        />
        <circle
          className="sky-star"
          cx="334.8"
          cy="193.7"
          r="1.46"
          fill="#dff4ff"
          style={{ opacity: 0.49, animationDuration: '3.99s', animationDelay: '1.1s' }}
        />
        <circle
          className="sky-star"
          cx="38.7"
          cy="44.8"
          r="1.12"
          fill="#dff4ff"
          style={{ opacity: 0.64, animationDuration: '6.02s', animationDelay: '4.2s' }}
        />
        <circle
          className="sky-star"
          cx="221.2"
          cy="157.9"
          r="0.58"
          fill="#dff4ff"
          style={{ opacity: 0.82, animationDuration: '5.11s', animationDelay: '4.55s' }}
        />
        <circle
          className="sky-star"
          cx="260.1"
          cy="96.8"
          r="0.68"
          fill="#dff4ff"
          style={{ opacity: 0.83, animationDuration: '5.6s', animationDelay: '1.66s' }}
        />
        <circle
          className="sky-star"
          cx="348.7"
          cy="81.2"
          r="0.9"
          fill="#dff4ff"
          style={{ opacity: 0.45, animationDuration: '6.2s', animationDelay: '3.62s' }}
        />
        <circle
          className="sky-star"
          cx="10.8"
          cy="34.7"
          r="1.4"
          fill="#dff4ff"
          style={{ opacity: 0.85, animationDuration: '5.66s', animationDelay: '0.73s' }}
        />
        <circle
          className="sky-star"
          cx="352.1"
          cy="130.9"
          r="0.85"
          fill="#dff4ff"
          style={{ opacity: 0.36, animationDuration: '4.68s', animationDelay: '0.65s' }}
        />
      </g>

      {/* halo behind the towers */}
      <ellipse
        className="sky-pulse"
        cx="196"
        cy="236"
        rx="150"
        ry="130"
        fill="url(#sk-halo)"
      />

      {/* perspective grid horizon */}
      <g clipPath="url(#sk-ground)">
        <g stroke="#59d3ff" strokeOpacity="0.3" strokeWidth="0.7">
          <line x1="160" y1="302" x2="-420" y2="470" />
          <line x1="160" y1="302" x2="-360" y2="470" />
          <line x1="160" y1="302" x2="-300" y2="470" />
          <line x1="160" y1="302" x2="-240" y2="470" />
          <line x1="160" y1="302" x2="-180" y2="470" />
          <line x1="160" y1="302" x2="-120" y2="470" />
          <line x1="160" y1="302" x2="-60" y2="470" />
          <line x1="160" y1="302" x2="0" y2="470" />
          <line x1="160" y1="302" x2="60" y2="470" />
          <line x1="160" y1="302" x2="120" y2="470" />
          <line x1="160" y1="302" x2="180" y2="470" />
          <line x1="160" y1="302" x2="240" y2="470" />
          <line x1="160" y1="302" x2="300" y2="470" />
          <line x1="160" y1="302" x2="360" y2="470" />
          <line x1="160" y1="302" x2="420" y2="470" />
          <line x1="160" y1="302" x2="480" y2="470" />
          <line x1="160" y1="302" x2="540" y2="470" />
          <line x1="160" y1="302" x2="600" y2="470" />
          <line x1="160" y1="302" x2="660" y2="470" />
        </g>
        <g
          className="sky-grid-flow"
          stroke="#59d3ff"
          strokeOpacity="0.34"
          strokeWidth="0.9"
        >
          <line x1="-420" y1="294" x2="660" y2="294" />
          <line x1="-420" y1="320" x2="660" y2="320" />
          <line x1="-420" y1="346" x2="660" y2="346" />
          <line x1="-420" y1="372" x2="660" y2="372" />
          <line x1="-420" y1="398" x2="660" y2="398" />
          <line x1="-420" y1="424" x2="660" y2="424" />
          <line x1="-420" y1="450" x2="660" y2="450" />
          <line x1="-420" y1="476" x2="660" y2="476" />
        </g>
      </g>
      <rect x="-420" y="300" width="1160" height="54" fill="url(#sk-haze)" />

      {/* distant skyline */}
      <g
        fill="#0d3374"
        fillOpacity="0.72"
        stroke="#4fc8ff"
        strokeOpacity="0.3"
        strokeWidth="0.7"
      >
        <path d="M18 320 L18 204 Q19 188 34 182 L40 320 Z" />
        <rect x="2" y="246" width="13" height="74" />
        <rect x="41" y="264" width="9" height="56" />
        <path d="M295 320 L296.5 200 L299.5 200 L301 320 Z" />
        <ellipse cx="298" cy="226" rx="8.5" ry="10.5" />
        <ellipse cx="298" cy="250" rx="6" ry="7.5" />
        <path d="M297 168 L299.5 168 L299.5 198 L297 198 Z" />
        <rect x="281" y="258" width="9" height="62" />
        <rect x="307" y="272" width="13" height="48" />
      </g>

      {/* Kuwait Towers */}
      <g
        fill="url(#sk-glass)"
        stroke="#8fe9ff"
        strokeOpacity="0.85"
        strokeWidth="1.1"
        filter="url(#sk-neon)"
      >
        <path d="M183 320 L188.5 214 L195.5 214 L201 320 Z" />
        <ellipse cx="192" cy="210" rx="33" ry="28" />
        <ellipse cx="192" cy="163" rx="16" ry="13.5" />
        <path d="M190.6 104 L193.4 104 L193 152 L191 152 Z" />
        <path d="M232 320 L236 256 L242 256 L246 320 Z" />
        <ellipse cx="239" cy="252" rx="22.5" ry="19" />
        <path d="M237.6 194 L240.4 194 L240 234 L238 234 Z" />
        <path d="M268 320 L271 276 L275 276 L278 320 Z" />
        <path d="M271.2 216 L274.2 216 L274 276 L272 276 Z" />
      </g>

      {/* orbit rings */}
      <g fill="none" stroke="#7fe4ff" strokeOpacity="0.55" strokeWidth="0.9">
        <ellipse cx="192" cy="210" rx="41" ry="11" />
        <ellipse cx="239" cy="252" rx="28" ry="7.5" />
      </g>

      {/* beacons */}
      <circle className="sky-beacon" cx="192" cy="104" r="2.6" fill="#9ff2ff" />
      <circle
        className="sky-beacon sky-beacon-b"
        cx="239"
        cy="194"
        r="2"
        fill="#9ff2ff"
      />

      {/* light sweep climbing the towers */}
      <g clipPath="url(#sk-towers)">
        <rect
          className="sky-sweep"
          x="160"
          y="340"
          width="140"
          height="120"
          fill="url(#sk-sweep)"
        />
      </g>

      {/* flagpole */}
      <g stroke="#bfe9ff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round">
        <line x1="58" y1="320" x2="58" y2="128" />
      </g>
      <circle cx="58" cy="125" r="3" fill="#e8fbff" />

      {/* Kuwaiti flag */}
      <g transform="translate(59 130)">
        <g className="flag-wave">
          <path
            fill="#007a3d"
            d="M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,18.4 77,19 70,17.2 63,14.4 56,12.1 49,11.2 42,11.9 35,13.3 28,14.4 21,14.8 14,14.6 7,14.2 0,14 Z"
          >
            <animate
              attributeName="d"
              dur="3.6s"
              repeatCount="indefinite"
              values="M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,18.4 77,19 70,17.2 63,14.4 56,12.1 49,11.2 42,11.9 35,13.3 28,14.4 21,14.8 14,14.6 7,14.2 0,14 Z;M0,0 7,0 14,0.4 21,1 28,1.1 35,0.4 42,-1.1 49,-2.7 56,-3.2 63,-2 70,0.8 77,3.9 84,5.6 L84,19.6 77,17.9 70,14.8 63,12 56,10.8 49,11.3 42,12.9 35,14.4 28,15.1 21,15 14,14.4 7,14 0,14 Z;M0,0 7,-0.1 14,0.1 21,0.8 28,1.4 35,1.4 42,0.3 49,-1.5 56,-3.2 63,-3.6 70,-1.9 77,1.3 84,4.6 L84,18.6 77,15.3 70,12.1 63,10.4 56,10.8 49,12.5 42,14.3 35,15.4 28,15.4 21,14.8 14,14.1 7,13.9 0,14 Z;M0,0 7,-0.2 14,-0.3 21,0.2 28,1.2 35,1.9 42,1.6 49,0.2 56,-2 63,-3.8 70,-3.9 77,-1.8 84,1.9 L84,15.9 77,12.2 70,10.1 63,10.2 56,12 49,14.2 42,15.6 35,15.9 28,15.2 21,14.2 14,13.7 7,13.8 0,14 Z;M0,0 7,-0.2 14,-0.5 21,-0.4 28,0.5 35,1.6 42,2.3 49,1.8 56,-0.1 63,-2.6 70,-4.4 77,-4.2 84,-1.6 L84,12.4 77,9.8 70,9.6 63,11.4 56,13.9 49,15.8 42,16.3 35,15.6 28,14.5 21,13.6 14,13.5 7,13.8 0,14 Z;M0,0 7,-0.2 14,-0.6 21,-0.8 28,-0.4 35,0.7 42,2.1 49,2.8 56,1.9 63,-0.4 70,-3.2 77,-5 84,-4.4 L84,9.6 77,9 70,10.8 63,13.6 56,15.9 49,16.8 42,16.1 35,14.7 28,13.6 21,13.2 14,13.4 7,13.8 0,14 Z;M0,0 7,-0 14,-0.4 21,-1 28,-1.1 35,-0.4 42,1.1 49,2.7 56,3.2 63,2 70,-0.8 77,-3.9 84,-5.6 L84,8.4 77,10.1 70,13.2 63,16 56,17.2 49,16.7 42,15.1 35,13.6 28,12.9 21,13 14,13.6 7,14 0,14 Z;M0,0 7,0.1 14,-0.1 21,-0.8 28,-1.4 35,-1.4 42,-0.3 49,1.5 56,3.2 63,3.6 70,1.9 77,-1.3 84,-4.6 L84,9.4 77,12.7 70,15.9 63,17.6 56,17.2 49,15.5 42,13.7 35,12.6 28,12.6 21,13.2 14,13.9 7,14.1 0,14 Z;M0,0 7,0.2 14,0.3 21,-0.2 28,-1.2 35,-1.9 42,-1.6 49,-0.2 56,2 63,3.8 70,3.9 77,1.8 84,-1.9 L84,12.1 77,15.8 70,17.9 63,17.8 56,16 49,13.8 42,12.4 35,12.1 28,12.8 21,13.8 14,14.3 7,14.2 0,14 Z;M0,0 7,0.2 14,0.5 21,0.4 28,-0.5 35,-1.6 42,-2.3 49,-1.8 56,0.1 63,2.6 70,4.4 77,4.2 84,1.6 L84,15.6 77,18.2 70,18.4 63,16.6 56,14.1 49,12.2 42,11.7 35,12.4 28,13.5 21,14.4 14,14.5 7,14.2 0,14 Z;M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,18.4 77,19 70,17.2 63,14.4 56,12.1 49,11.2 42,11.9 35,13.3 28,14.4 21,14.8 14,14.6 7,14.2 0,14 Z"
            />
          </path>
          <path
            fill="#f7fbff"
            d="M0,14 7,14.2 14,14.6 21,14.8 28,14.4 35,13.3 42,11.9 49,11.2 56,12.1 63,14.4 70,17.2 77,19 84,18.4 L84,32.4 77,33 70,31.2 63,28.4 56,26.1 49,25.2 42,25.9 35,27.3 28,28.4 21,28.8 14,28.6 7,28.2 0,28 Z"
          >
            <animate
              attributeName="d"
              dur="3.6s"
              repeatCount="indefinite"
              values="M0,14 7,14.2 14,14.6 21,14.8 28,14.4 35,13.3 42,11.9 49,11.2 56,12.1 63,14.4 70,17.2 77,19 84,18.4 L84,32.4 77,33 70,31.2 63,28.4 56,26.1 49,25.2 42,25.9 35,27.3 28,28.4 21,28.8 14,28.6 7,28.2 0,28 Z;M0,14 7,14 14,14.4 21,15 28,15.1 35,14.4 42,12.9 49,11.3 56,10.8 63,12 70,14.8 77,17.9 84,19.6 L84,33.6 77,31.9 70,28.8 63,26 56,24.8 49,25.3 42,26.9 35,28.4 28,29.1 21,29 14,28.4 7,28 0,28 Z;M0,14 7,13.9 14,14.1 21,14.8 28,15.4 35,15.4 42,14.3 49,12.5 56,10.8 63,10.4 70,12.1 77,15.3 84,18.6 L84,32.6 77,29.3 70,26.1 63,24.4 56,24.8 49,26.5 42,28.3 35,29.4 28,29.4 21,28.8 14,28.1 7,27.9 0,28 Z;M0,14 7,13.8 14,13.7 21,14.2 28,15.2 35,15.9 42,15.6 49,14.2 56,12 63,10.2 70,10.1 77,12.2 84,15.9 L84,29.9 77,26.2 70,24.1 63,24.2 56,26 49,28.2 42,29.6 35,29.9 28,29.2 21,28.2 14,27.7 7,27.8 0,28 Z;M0,14 7,13.8 14,13.5 21,13.6 28,14.5 35,15.6 42,16.3 49,15.8 56,13.9 63,11.4 70,9.6 77,9.8 84,12.4 L84,26.4 77,23.8 70,23.6 63,25.4 56,27.9 49,29.8 42,30.3 35,29.6 28,28.5 21,27.6 14,27.5 7,27.8 0,28 Z;M0,14 7,13.8 14,13.4 21,13.2 28,13.6 35,14.7 42,16.1 49,16.8 56,15.9 63,13.6 70,10.8 77,9 84,9.6 L84,23.6 77,23 70,24.8 63,27.6 56,29.9 49,30.8 42,30.1 35,28.7 28,27.6 21,27.2 14,27.4 7,27.8 0,28 Z;M0,14 7,14 14,13.6 21,13 28,12.9 35,13.6 42,15.1 49,16.7 56,17.2 63,16 70,13.2 77,10.1 84,8.4 L84,22.4 77,24.1 70,27.2 63,30 56,31.2 49,30.7 42,29.1 35,27.6 28,26.9 21,27 14,27.6 7,28 0,28 Z;M0,14 7,14.1 14,13.9 21,13.2 28,12.6 35,12.6 42,13.7 49,15.5 56,17.2 63,17.6 70,15.9 77,12.7 84,9.4 L84,23.4 77,26.7 70,29.9 63,31.6 56,31.2 49,29.5 42,27.7 35,26.6 28,26.6 21,27.2 14,27.9 7,28.1 0,28 Z;M0,14 7,14.2 14,14.3 21,13.8 28,12.8 35,12.1 42,12.4 49,13.8 56,16 63,17.8 70,17.9 77,15.8 84,12.1 L84,26.1 77,29.8 70,31.9 63,31.8 56,30 49,27.8 42,26.4 35,26.1 28,26.8 21,27.8 14,28.3 7,28.2 0,28 Z;M0,14 7,14.2 14,14.5 21,14.4 28,13.5 35,12.4 42,11.7 49,12.2 56,14.1 63,16.6 70,18.4 77,18.2 84,15.6 L84,29.6 77,32.2 70,32.4 63,30.6 56,28.1 49,26.2 42,25.7 35,26.4 28,27.5 21,28.4 14,28.5 7,28.2 0,28 Z;M0,14 7,14.2 14,14.6 21,14.8 28,14.4 35,13.3 42,11.9 49,11.2 56,12.1 63,14.4 70,17.2 77,19 84,18.4 L84,32.4 77,33 70,31.2 63,28.4 56,26.1 49,25.2 42,25.9 35,27.3 28,28.4 21,28.8 14,28.6 7,28.2 0,28 Z"
            />
          </path>
          <path
            fill="#ce1126"
            d="M0,28 7,28.2 14,28.6 21,28.8 28,28.4 35,27.3 42,25.9 49,25.2 56,26.1 63,28.4 70,31.2 77,33 84,32.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z"
          >
            <animate
              attributeName="d"
              dur="3.6s"
              repeatCount="indefinite"
              values="M0,28 7,28.2 14,28.6 21,28.8 28,28.4 35,27.3 42,25.9 49,25.2 56,26.1 63,28.4 70,31.2 77,33 84,32.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z;M0,28 7,28 14,28.4 21,29 28,29.1 35,28.4 42,26.9 49,25.3 56,24.8 63,26 70,28.8 77,31.9 84,33.6 L84,47.6 77,45.9 70,42.8 63,40 56,38.8 49,39.3 42,40.9 35,42.4 28,43.1 21,43 14,42.4 7,42 0,42 Z;M0,28 7,27.9 14,28.1 21,28.8 28,29.4 35,29.4 42,28.3 49,26.5 56,24.8 63,24.4 70,26.1 77,29.3 84,32.6 L84,46.6 77,43.3 70,40.1 63,38.4 56,38.8 49,40.5 42,42.3 35,43.4 28,43.4 21,42.8 14,42.1 7,41.9 0,42 Z;M0,28 7,27.8 14,27.7 21,28.2 28,29.2 35,29.9 42,29.6 49,28.2 56,26 63,24.2 70,24.1 77,26.2 84,29.9 L84,43.9 77,40.2 70,38.1 63,38.2 56,40 49,42.2 42,43.6 35,43.9 28,43.2 21,42.2 14,41.7 7,41.8 0,42 Z;M0,28 7,27.8 14,27.5 21,27.6 28,28.5 35,29.6 42,30.3 49,29.8 56,27.9 63,25.4 70,23.6 77,23.8 84,26.4 L84,40.4 77,37.8 70,37.6 63,39.4 56,41.9 49,43.8 42,44.3 35,43.6 28,42.5 21,41.6 14,41.5 7,41.8 0,42 Z;M0,28 7,27.8 14,27.4 21,27.2 28,27.6 35,28.7 42,30.1 49,30.8 56,29.9 63,27.6 70,24.8 77,23 84,23.6 L84,37.6 77,37 70,38.8 63,41.6 56,43.9 49,44.8 42,44.1 35,42.7 28,41.6 21,41.2 14,41.4 7,41.8 0,42 Z;M0,28 7,28 14,27.6 21,27 28,26.9 35,27.6 42,29.1 49,30.7 56,31.2 63,30 70,27.2 77,24.1 84,22.4 L84,36.4 77,38.1 70,41.2 63,44 56,45.2 49,44.7 42,43.1 35,41.6 28,40.9 21,41 14,41.6 7,42 0,42 Z;M0,28 7,28.1 14,27.9 21,27.2 28,26.6 35,26.6 42,27.7 49,29.5 56,31.2 63,31.6 70,29.9 77,26.7 84,23.4 L84,37.4 77,40.7 70,43.9 63,45.6 56,45.2 49,43.5 42,41.7 35,40.6 28,40.6 21,41.2 14,41.9 7,42.1 0,42 Z;M0,28 7,28.2 14,28.3 21,27.8 28,26.8 35,26.1 42,26.4 49,27.8 56,30 63,31.8 70,31.9 77,29.8 84,26.1 L84,40.1 77,43.8 70,45.9 63,45.8 56,44 49,41.8 42,40.4 35,40.1 28,40.8 21,41.8 14,42.3 7,42.2 0,42 Z;M0,28 7,28.2 14,28.5 21,28.4 28,27.5 35,26.4 42,25.7 49,26.2 56,28.1 63,30.6 70,32.4 77,32.2 84,29.6 L84,43.6 77,46.2 70,46.4 63,44.6 56,42.1 49,40.2 42,39.7 35,40.4 28,41.5 21,42.4 14,42.5 7,42.2 0,42 Z;M0,28 7,28.2 14,28.6 21,28.8 28,28.4 35,27.3 42,25.9 49,25.2 56,26.1 63,28.4 70,31.2 77,33 84,32.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z"
            />
          </path>
          <path
            fill="#101820"
            d="M0,0 3.5,2.4 7,4.8 10.5,7.4 14,9.9 17.5,12.4 21,14.8 L21,28.8 17.5,31.1 14,33.3 10.5,35.4 7,37.5 3.5,39.7 0,42 Z"
          >
            <animate
              attributeName="d"
              dur="3.6s"
              repeatCount="indefinite"
              values="M0,0 3.5,2.4 7,4.8 10.5,7.4 14,9.9 17.5,12.4 21,14.8 L21,28.8 17.5,31.1 14,33.3 10.5,35.4 7,37.5 3.5,39.7 0,42 Z;M0,0 3.5,2.3 7,4.7 10.5,7.2 14,9.8 17.5,12.4 21,15 L21,29 17.5,31.1 14,33.1 10.5,35.2 7,37.4 3.5,39.6 0,42 Z;M0,0 3.5,2.3 7,4.5 10.5,6.9 14,9.4 17.5,12.1 21,14.8 L21,28.8 17.5,30.7 14,32.8 10.5,34.9 7,37.2 3.5,39.6 0,42 Z;M0,0 3.5,2.2 7,4.4 10.5,6.7 14,9.1 17.5,11.6 21,14.2 L21,28.2 17.5,30.2 14,32.4 10.5,34.7 7,37.1 3.5,39.6 0,42 Z;M0,0 3.5,2.2 7,4.4 10.5,6.6 14,8.8 17.5,11.1 21,13.6 L21,27.6 17.5,29.8 14,32.1 10.5,34.6 7,37.1 3.5,39.6 0,42 Z;M0,0 3.5,2.3 7,4.5 10.5,6.6 14,8.7 17.5,10.9 21,13.2 L21,27.2 17.5,29.6 14,32.1 10.5,34.6 7,37.2 3.5,39.6 0,42 Z;M0,0 3.5,2.4 7,4.6 10.5,6.8 14,8.9 17.5,10.9 21,13 L21,27 17.5,29.6 14,32.2 10.5,34.8 7,37.3 3.5,39.7 0,42 Z;M0,0 3.5,2.4 7,4.8 10.5,7.1 14,9.2 17.5,11.3 21,13.2 L21,27.2 17.5,29.9 14,32.6 10.5,35.1 7,37.5 3.5,39.7 0,42 Z;M0,0 3.5,2.4 7,4.9 10.5,7.3 14,9.6 17.5,11.8 21,13.8 L21,27.8 17.5,30.4 14,32.9 10.5,35.3 7,37.6 3.5,39.8 0,42 Z;M0,0 3.5,2.4 7,4.9 10.5,7.4 14,9.9 17.5,12.2 21,14.4 L21,28.4 17.5,30.9 14,33.2 10.5,35.4 7,37.6 3.5,39.8 0,42 Z;M0,0 3.5,2.4 7,4.8 10.5,7.4 14,9.9 17.5,12.4 21,14.8 L21,28.8 17.5,31.1 14,33.3 10.5,35.4 7,37.5 3.5,39.7 0,42 Z"
            />
          </path>
          <path
            fill="url(#sk-fold)"
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="0.6"
            d="M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z"
          >
            <animate
              attributeName="d"
              dur="3.6s"
              repeatCount="indefinite"
              values="M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z;M0,0 7,0 14,0.4 21,1 28,1.1 35,0.4 42,-1.1 49,-2.7 56,-3.2 63,-2 70,0.8 77,3.9 84,5.6 L84,47.6 77,45.9 70,42.8 63,40 56,38.8 49,39.3 42,40.9 35,42.4 28,43.1 21,43 14,42.4 7,42 0,42 Z;M0,0 7,-0.1 14,0.1 21,0.8 28,1.4 35,1.4 42,0.3 49,-1.5 56,-3.2 63,-3.6 70,-1.9 77,1.3 84,4.6 L84,46.6 77,43.3 70,40.1 63,38.4 56,38.8 49,40.5 42,42.3 35,43.4 28,43.4 21,42.8 14,42.1 7,41.9 0,42 Z;M0,0 7,-0.2 14,-0.3 21,0.2 28,1.2 35,1.9 42,1.6 49,0.2 56,-2 63,-3.8 70,-3.9 77,-1.8 84,1.9 L84,43.9 77,40.2 70,38.1 63,38.2 56,40 49,42.2 42,43.6 35,43.9 28,43.2 21,42.2 14,41.7 7,41.8 0,42 Z;M0,0 7,-0.2 14,-0.5 21,-0.4 28,0.5 35,1.6 42,2.3 49,1.8 56,-0.1 63,-2.6 70,-4.4 77,-4.2 84,-1.6 L84,40.4 77,37.8 70,37.6 63,39.4 56,41.9 49,43.8 42,44.3 35,43.6 28,42.5 21,41.6 14,41.5 7,41.8 0,42 Z;M0,0 7,-0.2 14,-0.6 21,-0.8 28,-0.4 35,0.7 42,2.1 49,2.8 56,1.9 63,-0.4 70,-3.2 77,-5 84,-4.4 L84,37.6 77,37 70,38.8 63,41.6 56,43.9 49,44.8 42,44.1 35,42.7 28,41.6 21,41.2 14,41.4 7,41.8 0,42 Z;M0,0 7,-0 14,-0.4 21,-1 28,-1.1 35,-0.4 42,1.1 49,2.7 56,3.2 63,2 70,-0.8 77,-3.9 84,-5.6 L84,36.4 77,38.1 70,41.2 63,44 56,45.2 49,44.7 42,43.1 35,41.6 28,40.9 21,41 14,41.6 7,42 0,42 Z;M0,0 7,0.1 14,-0.1 21,-0.8 28,-1.4 35,-1.4 42,-0.3 49,1.5 56,3.2 63,3.6 70,1.9 77,-1.3 84,-4.6 L84,37.4 77,40.7 70,43.9 63,45.6 56,45.2 49,43.5 42,41.7 35,40.6 28,40.6 21,41.2 14,41.9 7,42.1 0,42 Z;M0,0 7,0.2 14,0.3 21,-0.2 28,-1.2 35,-1.9 42,-1.6 49,-0.2 56,2 63,3.8 70,3.9 77,1.8 84,-1.9 L84,40.1 77,43.8 70,45.9 63,45.8 56,44 49,41.8 42,40.4 35,40.1 28,40.8 21,41.8 14,42.3 7,42.2 0,42 Z;M0,0 7,0.2 14,0.5 21,0.4 28,-0.5 35,-1.6 42,-2.3 49,-1.8 56,0.1 63,2.6 70,4.4 77,4.2 84,1.6 L84,43.6 77,46.2 70,46.4 63,44.6 56,42.1 49,40.2 42,39.7 35,40.4 28,41.5 21,42.4 14,42.5 7,42.2 0,42 Z;M0,0 7,0.2 14,0.6 21,0.8 28,0.4 35,-0.7 42,-2.1 49,-2.8 56,-1.9 63,0.4 70,3.2 77,5 84,4.4 L84,46.4 77,47 70,45.2 63,42.4 56,40.1 49,39.2 42,39.9 35,41.3 28,42.4 21,42.8 14,42.6 7,42.2 0,42 Z"
            />
          </path>
        </g>
        <g className="flag-still">
          <rect width="84" height="14" fill="#007a3d" />
          <rect y="14" width="84" height="14" fill="#f7fbff" />
          <rect y="28" width="84" height="14" fill="#ce1126" />
          <path d="M0 0 L21 14 L21 28 L0 42 Z" fill="#101820" />
        </g>
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
