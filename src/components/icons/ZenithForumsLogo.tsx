import type { SVGProps } from 'react';

export function ZenithForumsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 50" // Adjusted viewBox for longer text
      width="210" // Adjusted width
      height="37.5"
      aria-label="11A4008深论坛 标志"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="35"
        fontFamily="Roboto, sans-serif" // Consider a Chinese font like 'Noto Sans SC', 'Source Han Sans' for better rendering
        fontSize="28" // Slightly reduced font size for longer text
        fontWeight="bold"
        fill="url(#logoGradient)"
        className="fill-primary group-hover:fill-accent transition-colors duration-300"
      >
        11A4008深论坛
      </text>
    </svg>
  );
}
