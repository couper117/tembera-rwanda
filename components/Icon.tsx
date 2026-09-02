// A small, self-contained icon set.
//
// The legacy pages pull FontAwesome off a CDN. The product UI shouldn't depend
// on a third-party stylesheet to render its navigation, so these are inline
// paths on a shared 24px grid with a 1.75 stroke.

import type { SVGProps } from "react";

export type IconName =
  // navigation & chrome
  | "search"
  | "home"
  | "compass"
  | "map"
  | "bookmark"
  | "bookmarkFilled"
  | "user"
  | "grid"
  | "list"
  | "chevronRight"
  | "chevronLeft"
  | "chevronDown"
  | "arrowLeft"
  | "close"
  | "sliders"
  | "check"
  | "plus"
  | "minus"
  | "refresh"
  | "external"
  // meta
  | "star"
  | "pin"
  | "navigate"
  | "share"
  | "phone"
  | "clock"
  | "info"
  | "alert"
  | "image"
  | "sparkle"
  | "lock"
  // categories
  | "utensils"
  | "bed"
  | "basket"
  | "landmark"
  | "tree"
  | "ticket"
  | "dumbbell"
  | "worship"
  | "bank"
  | "hospital"
  | "pharmacy"
  | "bus"
  | "plane"
  | "school"
  | "shield"
  | "fuel"
  | "palette"
  | "trophy"
  | "memorial"
  | "mountain"
  | "settings"
  | "plusDashed"
  | "panelLeft"
  | "sun"
  | "moon"
  | "calendar"
  | "broom"
  | "bell"
  | "bellOff"
  | "mail"
  | "briefcase"
  | "bot"
  | "messageSquare"
  // manoeuvres, for turn-by-turn directions
  | "goStraight"
  | "turnLeft"
  | "turnRight"
  | "slightLeft"
  | "slightRight"
  | "uturn"
  | "roundabout"
  | "destination";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Renders a solid shape instead of a stroke (star, bookmark). */
  filled?: boolean;
}

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.6 12 3.3l9 7.3" />
      <path d="M5.6 9.6V20a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1V9.6" />
      <path d="M9.8 21v-5.4a2.2 2.2 0 0 1 4.4 0V21" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2.3 5.1-5.1 2.3 2.3-5.1z" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3.6 6.2a1 1 0 0 0-.6.9v11.4a1 1 0 0 0 1.4.9L9 17.6l6 2.4 5.4-2.2a1 1 0 0 0 .6-.9V5.5a1 1 0 0 0-1.4-.9L15 6.4z" />
      <path d="M9 4v13.6M15 6.4V20" />
    </>
  ),
  bookmark: <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.6l-6.5-4-6.5 4V4.8a1 1 0 0 1 1-1z" />,
  bookmarkFilled: <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.6l-6.5-4-6.5 4V4.8a1 1 0 0 1 1-1z" />,
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.2c0-3.6 3.2-6.2 7.2-6.2s7.2 2.6 7.2 6.2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
    </>
  ),
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  chevronLeft: <path d="m14.5 5-7 7 7 7" />,
  chevronDown: <path d="m5 9.5 7 7 7-7" />,
  arrowLeft: (
    <>
      <path d="M20 12H4" />
      <path d="m10.5 5.5-7 6.5 7 6.5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h6M14 7h6M4 17h10M18 17h2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5" />
      <path d="M4 4.5v4h4" />
      <path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5" />
      <path d="M20 19.5v-4h-4" />
    </>
  ),
  external: (
    <>
      <path d="M13.5 4.5H19.5v6" />
      <path d="m19.5 4.5-8 8" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  star: (
    <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
  ),
  pin: (
    <>
      <path d="M12 21.2s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  navigate: <path d="M20.5 3.5 3.8 10.2a.6.6 0 0 0 .05 1.13l6.6 2.22 2.22 6.6a.6.6 0 0 0 1.13.05z" />,
  share: (
    <>
      <path d="M12 3.5v12" />
      <path d="m7.5 8 4.5-4.5L16.5 8" />
      <path d="M5 13.5v5.9a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-5.9" />
    </>
  ),
  phone: (
    <path d="M8.4 4.2 5.9 4a1.6 1.6 0 0 0-1.7 1.8c.5 5.5 4.5 12.5 12.3 14.1a1.6 1.6 0 0 0 1.9-1.3l.4-2.6a1.2 1.2 0 0 0-.8-1.3l-2.9-1a1.2 1.2 0 0 0-1.3.4l-.9 1.1a11 11 0 0 1-4.6-5.3l1.2-.8a1.2 1.2 0 0 0 .5-1.3l-.8-2.8a1.2 1.2 0 0 0-.8-.8z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <path d="M12 7.9h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.7 4.1 3.2 17a1.5 1.5 0 0 0 1.3 2.3h15a1.5 1.5 0 0 0 1.3-2.3L13.3 4.1a1.5 1.5 0 0 0-2.6 0z" />
      <path d="M12 9.5v4.2" />
      <path d="M12 16.6h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.6" cy="9.6" r="1.6" />
      <path d="m4.5 17 4.6-4.4a1.8 1.8 0 0 1 2.5 0l4 3.9" />
      <path d="m14.6 14.4 1.6-1.5a1.8 1.8 0 0 1 2.5 0l1.8 1.7" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5 13.7 9a2 2 0 0 0 1.3 1.3l5.5 1.7-5.5 1.7A2 2 0 0 0 13.7 15L12 20.5 10.3 15A2 2 0 0 0 9 13.7L3.5 12 9 10.3A2 2 0 0 0 10.3 9z" />
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  utensils: (
    <>
      <path d="M7 3.5v6.8a2.5 2.5 0 0 0 5 0V3.5" />
      <path d="M9.5 10.3V20.5" />
      <path d="M17.5 3.5c-1.6 1-2.5 2.8-2.5 5v4h4.5" />
      <path d="M17 12.5v8" />
    </>
  ),
  bed: (
    <>
      <path d="M3.5 19.5V7.5" />
      <path d="M3.5 12.5h12a5 5 0 0 1 5 5v2" />
      <path d="M3.5 19.5h17" />
      <circle cx="8" cy="9.6" r="2" />
    </>
  ),
  basket: (
    <>
      <path d="M4 9.5h16l-1.5 9.3a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z" />
      <path d="m8.5 9.5 3.5-6 3.5 6" />
      <path d="M10 13.5v3M14 13.5v3" />
    </>
  ),
  landmark: (
    <>
      <path d="m3.5 9.5 8.5-5.8 8.5 5.8" />
      <path d="M6 10.5v7.5M10 10.5v7.5M14 10.5v7.5M18 10.5v7.5" />
      <path d="M3.5 20.5h17" />
    </>
  ),
  tree: (
    <>
      <path d="M12 3.2 7.2 10h2.6l-3.6 5.4h11.6L14.2 10h2.6z" />
      <path d="M12 15.4v5.4" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.6V6.8a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v1.8a3.4 3.4 0 0 0 0 6.8v1.8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-1.8a3.4 3.4 0 0 0 0-6.8z" />
      <path d="M13.5 5.5v13" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3.5 9.5v5M6.8 6.8v10.4M17.2 6.8v10.4M20.5 9.5v5" />
      <path d="M6.8 12h10.4" />
    </>
  ),
  worship: (
    <>
      <path d="M4.5 20.5V10.2L12 4.4l7.5 5.8v10.3" />
      <path d="M9.4 20.5v-4.7a2.6 2.6 0 0 1 5.2 0v4.7" />
      <path d="M3 20.5h18" />
      <path d="M12 1.8v2.6" />
    </>
  ),
  bank: (
    <>
      <path d="m3.5 9.8 8.5-5.6 8.5 5.6" />
      <path d="M6.2 12v5.6M10 12v5.6M14 12v5.6M17.8 12v5.6" />
      <path d="M4 20.4h16" />
      <path d="M3.6 9.8h16.8" />
    </>
  ),
  hospital: (
    <>
      <rect x="3.8" y="4.5" width="16.4" height="15.8" rx="2.5" />
      <path d="M12 9v7M8.5 12.5h7" />
    </>
  ),
  pharmacy: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="12.5" rx="2.5" />
      <path d="M4 10.5h16" />
      <path d="M7 16.5v2.2M17 16.5v2.2" />
      <path d="M7.5 13.6h.01M16.5 13.6h.01" />
    </>
  ),
  plane: (
    <path d="M10.4 3.4a1.6 1.6 0 0 1 3.2 0v5.3l7.4 4.3v2.4l-7.4-2.2v4.2l2.4 1.8v1.6L12 19.6l-4 1.2v-1.6l2.4-1.8v-4.2L3 15.4V13l7.4-4.3z" />
  ),
  school: (
    <>
      <path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z" />
      <path d="M6.4 10.6v5.2c0 1.7 2.5 3.2 5.6 3.2s5.6-1.5 5.6-3.2v-5.2" />
      <path d="M21.2 8.6v5.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 4.8 6v5.6c0 4.5 3 7.9 7.2 9.2 4.2-1.3 7.2-4.7 7.2-9.2V6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  fuel: (
    <>
      <path d="M4.5 20.5V6a2 2 0 0 1 2-2h4.6a2 2 0 0 1 2 2v14.5" />
      <path d="M3.5 20.5h11" />
      <path d="M6.8 7.5h4" />
      <path d="M13.1 10h3.2a1.8 1.8 0 0 1 1.8 1.8v4.6a1.7 1.7 0 0 0 3.4 0V9.2l-2.4-2.4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.3 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h1.6a4.2 4.2 0 0 0 4.2-4.2c0-3.9-3.9-7-8.6-7z" />
      <path d="M7.4 12.2h.01M9.4 8.6h.01M13.4 7.8h.01M16.6 10.2h.01" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4.5h8v4.8a4 4 0 0 1-8 0z" />
      <path d="M8 6.2H5.6a1 1 0 0 0-1 1v.7a3.4 3.4 0 0 0 3.4 3.4" />
      <path d="M16 6.2h2.4a1 1 0 0 1 1 1v.7a3.4 3.4 0 0 1-3.4 3.4" />
      <path d="M12 13.3v3.4" />
      <path d="M8.6 20.2h6.8l-.7-3.5H9.3z" />
    </>
  ),
  // A plain upright stele — a neutral, respectful mark for memorial sites.
  memorial: (
    <>
      <path d="M9 20.4V7.6a3 3 0 0 1 6 0v12.8" />
      <path d="M6 20.4h12" />
      <path d="M10.6 11.4h2.8" />
    </>
  ),
  mountain: (
    <>
      <path d="m2.8 19.4 6.1-10.3 4 6.2 2.1-3.2 6.2 7.3z" />
      <path d="m8.9 9.1 2.6 4" />
      <circle cx="17.4" cy="6.4" r="2.1" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.3 14.6a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37v.13a1.8 1.8 0 1 1-3.6 0v-.07a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05a1.8 1.8 0 1 1-2.55-2.55l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9h-.13a1.8 1.8 0 1 1 0-3.6h.07a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05A1.8 1.8 0 1 1 8.19 3.1l.05.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37v-.13a1.8 1.8 0 1 1 3.6 0v.07a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.13a1.8 1.8 0 1 1 0 3.6h-.07a1.5 1.5 0 0 0-1.37.9z" />
    </>
  ),
  // Sidebar toggle — the panel-with-a-rail shape people already read as
  // "show/hide the sidebar".
  panelLeft: (
    <>
      <rect x="3.2" y="4.5" width="17.6" height="15" rx="2.6" />
      <path d="M9.6 4.5v15" />
    </>
  ),
  plusDashed: (
    <>
      <path
        d="M8 3.6H6a2.4 2.4 0 0 0-2.4 2.4v2M3.6 16v2A2.4 2.4 0 0 0 6 20.4h2M16 20.4h2a2.4 2.4 0 0 0 2.4-2.4v-2M20.4 8V6A2.4 2.4 0 0 0 18 3.6h-2"
        strokeDasharray="0 0"
      />
      <path d="M12 8.8v6.4M8.8 12h6.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.8h17M8 3v4M16 3v4" />
    </>
  ),
  // A simple broom — the everyday image of Umuganda's communal clean-up.
  broom: (
    <>
      <path d="M19.5 4 10 13.5" />
      <path d="M8 15.5 12 11.5" />
      <path d="M10 13.5 4 20.5M10 13.5 7 21M10 13.5 10.3 21.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10.2a6 6 0 0 1 12 0c0 4 1.4 5.6 2 6.3H4c.6-.7 2-2.3 2-6.3z" />
      <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0" />
    </>
  ),
  bellOff: (
    <>
      <path d="M6 10.2a6 6 0 0 1 12 0c0 4 1.4 5.6 2 6.3H4c.6-.7 2-2.3 2-6.3z" />
      <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0" />
      <path d="M4 3.6 20 20.4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.2 6.7 7.8 6.4 7.8-6.4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="6.5" width="17" height="13.5" rx="2" />
      <path d="M8 6.5V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3.5 12h17" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="6.5" width="16" height="13" rx="3" />
      <circle cx="9" cy="12.5" r="1.5" />
      <circle cx="15" cy="12.5" r="1.5" />
      <path d="M12 2.5v4M8.5 16h7" />
    </>
  ),
  messageSquare: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),

  // Manoeuvre arrows. Each reads bottom-to-tip, so the stem is where you are
  // and the head is where the turn puts you — the convention every navigation
  // app uses, and the reason they stay legible at 18px in a step list.
  goStraight: (
    <>
      <path d="M12 20V5.5" />
      <path d="m6.5 11 5.5-5.5 5.5 5.5" />
    </>
  ),
  turnRight: (
    <>
      <path d="M6.5 20v-8a3 3 0 0 1 3-3h8" />
      <path d="m14 5.5 4 3.5-4 3.5" />
    </>
  ),
  turnLeft: (
    <>
      <path d="M17.5 20v-8a3 3 0 0 0-3-3h-8" />
      <path d="m10 5.5-4 3.5 4 3.5" />
    </>
  ),
  slightRight: (
    <>
      <path d="M7.5 20v-6.4a3 3 0 0 1 .9-2.1L16 5" />
      <path d="M11.5 5H16v4.5" />
    </>
  ),
  slightLeft: (
    <>
      <path d="M16.5 20v-6.4a3 3 0 0 0-.9-2.1L8 5" />
      <path d="M12.5 5H8v4.5" />
    </>
  ),
  uturn: (
    <>
      <path d="M7.5 20v-9a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="m13 11 3.5 4 3.5-4" />
    </>
  ),
  roundabout: (
    <>
      <circle cx="11" cy="10.5" r="4.5" />
      <path d="M11 20v-5" />
      <path d="M15.5 10.5h4.5" />
      <path d="m17.5 8 2.5 2.5-2.5 2.5" />
    </>
  ),
  destination: (
    <>
      <path d="M6.5 21V3.5" />
      <path d="M6.5 4.5h11l-2.6 3.6 2.6 3.6h-11z" />
    </>
  ),
};

/** Only these read well as a solid shape; `filled` is ignored on the rest.
 *  (`pin` is excluded on purpose — filling it closes the hole in the middle.) */
const SOLID_CAPABLE: IconName[] = ["star", "bookmark", "bookmarkFilled"];

export default function Icon({ name, size = 20, filled, ...rest }: IconProps) {
  const isSolid =
    name === "bookmarkFilled" || (Boolean(filled) && SOLID_CAPABLE.includes(name));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isSolid ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isSolid ? 0 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
