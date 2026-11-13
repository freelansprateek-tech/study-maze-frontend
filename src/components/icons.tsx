import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...rest }: IconProps & { children: ReactNode }) {
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
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** The Study Maze mark: a path that winds inward to the answer at the centre. */
export const IconMaze = (p: IconProps) => (
  <Svg strokeWidth={2.1} {...p}>
    <path d="M4 20V4h16v16H8V8h8v8h-4" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconChip = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="10" y="10" width="4" height="4" rx="0.5" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
  </Svg>
)

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
)

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </Svg>
)

export const IconSend = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2.5 20h19L12 3z" />
    <path d="M12 10v4M12 17.2v.3" />
  </Svg>
)

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.8v.3" />
  </Svg>
)

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
)

export const IconChevron = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

export const IconCpu = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M9 9h6v6H9z" />
  </Svg>
)

export const IconWifi = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5v.2" />
  </Svg>
)

export const IconBluetooth = (p: IconProps) => (
  <Svg {...p}>
    <path d="m7 7 10 10-5 4V3l5 4L7 17" />
  </Svg>
)

export const IconUsb = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21V4M12 4l-2.5 3M12 4l2.5 3M12 17l-5-3v-3M12 14l5-3V9" />
    <circle cx="7" cy="10" r="1.2" />
    <rect x="15.8" y="6.6" width="2.4" height="2.4" />
  </Svg>
)

export const IconRadio = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
  </Svg>
)
