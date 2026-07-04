/** Clean line-art product box guide for H / W / D entry. */
export function DimensionIllustration({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Product dimension guide: H height, W width, D depth"
    >
      <svg
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        {/* Isometric-style box outline */}
        <path
          d="M40 58 L110 28 L180 58 L180 128 L110 158 L40 128 Z"
          stroke="#374151"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M40 58 L110 88 L180 58"
          stroke="#374151"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M110 88 L110 158"
          stroke="#374151"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Height guide (left edge) */}
        <path
          d="M28 62 L28 124"
          stroke="#6B7280"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        <path d="M24 62 L32 62" stroke="#6B7280" strokeWidth="1.25" />
        <path d="M24 124 L32 124" stroke="#6B7280" strokeWidth="1.25" />
        <text
          x="14"
          y="96"
          fill="#111827"
          fontSize="12"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          H
        </text>

        {/* Width guide (front bottom) */}
        <path
          d="M48 140 L100 162"
          stroke="#6B7280"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        <text
          x="66"
          y="172"
          fill="#111827"
          fontSize="12"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          W
        </text>

        {/* Depth guide (right bottom) */}
        <path
          d="M120 162 L172 140"
          stroke="#6B7280"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        <text
          x="148"
          y="172"
          fill="#111827"
          fontSize="12"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          D
        </text>

        <text
          x="110"
          y="18"
          textAnchor="middle"
          fill="#6B7280"
          fontSize="10"
          fontFamily="system-ui, sans-serif"
        >
          H = Height · W = Width · D = Depth
        </text>
      </svg>
    </div>
  );
}
