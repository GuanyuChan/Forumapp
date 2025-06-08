import type { SVGProps } from 'react';

export function ZenithForumsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="Zenith Forums Logo"
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
        fontFamily="Roboto, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="url(#logoGradient)"
        className="fill-primary group-hover:fill-accent transition-colors duration-300"
      >
        Zenith Forums
      </text>
    </svg>
  );
}
