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
