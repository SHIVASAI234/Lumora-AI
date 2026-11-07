import type { CSSProperties, ReactNode } from 'react'

export interface IconProps {
  size?: number | string
  className?: string
  style?: CSSProperties
}

function Glyph({ size = 24, className, style, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function StarShield(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.2 7.5 10 4.4-1.8 7.5-5.4 7.5-10v-6z" />
      <path d="m12 7.8 1.25 2.55 2.8.4-2.03 1.98.48 2.8L12 14.2l-2.5 1.33.48-2.8-2.03-1.98 2.8-.4z" />
    </Glyph>
  )
}

export function Gauntlet(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7.5 10.5V6.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M10.5 9.5V4.5a1.5 1.5 0 0 1 3 0v5" />
      <path d="M13.5 9.5v-4a1.5 1.5 0 0 1 3 0V10" />
      <path d="M16.5 10V8.5a1.5 1.5 0 0 1 3 0v5c0 2.6-1.8 4.6-4.3 5H9.8C7.6 18.5 6 16.9 6 14.6V12a1.5 1.5 0 0 1 1.5-1.5" />
      <path d="M8.5 18.5v3h7v-3" />
      <circle cx="12.5" cy="14" r="1.4" fill="currentColor" />
    </Glyph>
  )
}

export function ArcReactor(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3.3M12 18.2v3.3M2.5 12h3.3M18.2 12h3.3M5.3 5.3l2.3 2.3M16.4 16.4l2.3 2.3M5.3 18.7l2.3-2.3M16.4 7.6l2.3-2.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Glyph>
  )
}

export function Web(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
      <polygon points="20,12 17.66,17.66 12,20 6.34,17.66 4,12 6.34,6.34 12,4 17.66,6.34" />
      <polygon points="16,12 14.83,14.83 12,16 9.17,14.83 8,12 9.17,9.17 12,8 14.83,9.17" />
    </Glyph>
  )
}

export function StormHammer(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="4.5" y="3" width="15" height="6.5" rx="1.2" />
      <path d="M12 9.5V20" />
      <path d="M10.5 20.5h3" />
      <path d="m13.2 4.3-2.1 2.3h2.2l-2.1 2.2" />
    </Glyph>
  )
}

export function VisorHelmet(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 11a7 7 0 0 1 14 0v4.5L16.5 20h-9L5 15.5z" />
      <path d="M7.5 11.5h3.2l1.3 1.2 1.3-1.2h3.2" />
      <path d="M10 16.5h4" />
    </Glyph>
  )
}

export function PortalRing(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3 2.2" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2" />
    </Glyph>
  )
}

export function ArmorHelmet(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2.5c-4 0-7 2.6-7 6.8V14c0 3.6 3 6.6 7 7.5 4-.9 7-3.9 7-7.5V9.3c0-4.2-3-6.8-7-6.8z" />
      <path d="M7.5 10.5l3 1M16.5 10.5l-3 1" />
      <path d="M9.5 16.5h5" />
      <path d="M12 2.5V7" />
    </Glyph>
  )
}

export function Claws(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 3c1.5 5 1.5 11-1 18" />
      <path d="M12 2c1.5 6 1.5 13-1 20" />
      <path d="M18 3c1.5 5 1.5 11-1 18" />
    </Glyph>
  )
}

export function Arrow(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20 19 5" />
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="M4 20l1-4M4 20l4-1M7 17l1-4M7 17l4-1" />
    </Glyph>
  )
}

export function MysticSigil(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <rect x="7" y="7" width="10" height="10" />
      <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="2" />
    </Glyph>
  )
}

export function PantherMask(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 3.5 8 7h8l3-3.5V12c0 4.5-3 8-7 9-4-1-7-4.5-7-9z" />
      <path d="M8.5 12l2 1M15.5 12l-2 1" />
      <path d="M11 17h2" />
    </Glyph>
  )
}

export function GammaFist(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 9V7a1.5 1.5 0 0 1 3 0v2M11 9V6a1.5 1.5 0 0 1 3 0v3M14 9V6.5a1.5 1.5 0 0 1 3 0V9" />
      <path d="M17 9.5a1.5 1.5 0 0 1 3 0V14c0 3.5-2.5 6-6 6h-2c-3 0-5-2.2-5-5v-4a2 2 0 0 1 2-2h8" />
      <path d="M10 13h4" />
      <path d="M2.5 6l2 1.5M2.5 11h2" />
    </Glyph>
  )
}

export function CosmicGem(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 3h12l3 5-9 13L3 8z" />
      <path d="M3 8h18M9 3l3 18 3-18" />
    </Glyph>
  )
}

export function Bolt(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </Glyph>
  )
}

export function Wings(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 8c-2-3-6-4-10-3 1 4 4 7 10 8 6-1 9-4 10-8-4-1-8 0-10 3z" />
      <path d="M12 8v12" />
      <path d="M5.5 9c2 1 4 1.5 6.5 1.5s4.5-.5 6.5-1.5" />
    </Glyph>
  )
}

export function Trident(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 22V5" />
      <path d="M6 3v4a6 6 0 0 0 12 0V3" />
      <path d="M12 2l-1.5 3h3z" />
      <path d="M9 18h6" />
    </Glyph>
  )
}

export function Rocket(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z" />
      <circle cx="12" cy="9" r="1.8" />
      <path d="M9 16l-3 3 1-5M15 16l3 3-1-5M10.5 19.5 12 22l1.5-2.5" />
    </Glyph>
  )
}

export function Target(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </Glyph>
  )
}

export function Flame(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 22c4 0 7-2.8 7-7 0-4-3-6.5-4-10-2 2-2.5 4-2 6-1.5-1-2.5-2.5-2.5-4.5C7.5 9 5 12 5 15c0 4.2 3 7 7 7z" />
      <path d="M12 22c-1.7 0-3-1.3-3-3 0-2 1.5-3 3-5 1.5 2 3 3 3 5 0 1.7-1.3 3-3 3z" />
    </Glyph>
  )
}

export function CosmicEye(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </Glyph>
  )
}

export function Atom(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </Glyph>
  )
}

export function Crown(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
      <path d="M5 19h14" />
    </Glyph>
  )
}

export function DominoMask(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M2 9c0-1.5 1-2.5 3-2.5 3 0 4 1.5 7 1.5s4-1.5 7-1.5c2 0 3 1 3 2.5 0 4-2.5 7-5.5 7-2.5 0-3-2-4.5-2s-2 2-4.5 2C4.5 16 2 13 2 9z" />
      <circle cx="7.5" cy="11" r="1.6" />
      <circle cx="16.5" cy="11" r="1.6" />
    </Glyph>
  )
}
