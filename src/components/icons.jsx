export function ZedMark({ className = "" }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <g transform="translate(-22 4)">
        <path
          d="M132 150 H352 L148 362 H352"
          fill="none"
          stroke="currentColor"
          strokeWidth="58"
          strokeLinecap="square"
        />
        <circle cx="414" cy="333" r="33" fill="#FFA463" />
      </g>
    </svg>
  );
}

const ARROWS = {
  left: "M13 8H3m4-4L3 8l4 4",
  right: "M3 8h10m-4-4 4 4-4 4",
  "up-right": "M5 11 11 5M6 5h5v5",
};

export function Arrow({ dir = "right", className = "" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d={ARROWS[dir]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
