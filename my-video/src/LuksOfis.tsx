import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadJosefin } from "@remotion/google-fonts/JosefinSans";

const { fontFamily: DISPLAY } = loadCinzel("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadJosefin("normal", { weights: ["400", "600", "700"], subsets: ["latin", "latin-ext"] });

/* ------------------------------------------------------------------ tokens */
export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const A = (n: string) => staticFile(`arnavutkoy/${n}`);
const O = (n: string) => staticFile(`ofis/${n}`);

const C = {
  stone: "#EFE8DF",
  stone2: "#E2D7C9",
  ink: "#15120F",
  slate: "#17282C",
  slate2: "#22393E",
  copper: "#B0703F",
  copperDeep: "#7E4A26",
  champagne: "#E7C9A1",
  line: "rgba(176,112,63,0.55)",
};
const COPPER_GRAD = `linear-gradient(135deg, #F3D7B0 0%, ${C.champagne} 25%, ${C.copper} 60%, ${C.copperDeep} 100%)`;
const PHONE = "+90 534 878 42 22";

/** Scene timing in seconds, synced to the Harrison voiceover */
const T = {
  intro: [0, 6.0],
  manifesto: [6.0, 9.9],
  elevator: [9.9, 12.6],
  plan: [12.6, 15.2],
  comfort: [15.2, 18.4],
  work: [18.4, 21.0],
  location: [21.0, 29.3],
  proximity: [29.3, 37.9],
  tech: [37.9, 46.7],
  amen: [46.7, 54.3],
  price: [54.3, 58.2],
  rise: [58.2, 63.2],
  end: [63.2, 68.0],
} as const;
export const TOTAL = s(68);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / FPS;
const prog = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/* -------------------------------------------------------------- primitives */

const Reveal: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number; from?: "bottom" | "left" }> = ({
  at,
  children,
  style,
  dur = 0.75,
  from = "bottom",
}) => {
  const t = useT();
  const p = prog(t, at, at + dur);
  const tr = from === "bottom" ? `translateY(${(1 - p) * 115}%)` : `translateX(${(p - 1) * 105}%)`;
  return (
    <div style={{ overflow: "hidden", paddingTop: 12, marginTop: -12, ...style }}>
      <div style={{ transform: tr, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number }> = ({ at, children, style, dist = 50 }) => {
  const frame = useCurrentFrame();
  const sp = spring({ frame: frame - s(at), fps: FPS, config: { damping: 17, stiffness: 140, mass: 0.7 } });
  return <div style={{ ...style, opacity: Math.min(1, sp * 1.4), transform: `translateY(${(1 - sp) * dist}px)` }}>{children}</div>;
};

const Cover: React.FC<{ src: string; video?: boolean; rate?: number; z?: [number, number]; dur: number; pos?: string; filter?: string; pan?: [number, number] }> = ({
  src,
  video,
  rate = 1,
  z = [1.04, 1.14],
  dur,
  pos = "center",
  filter,
  pan = [0, 0],
}) => {
  const t = useT();
  const p = interpolate(t, [0, dur], [0, 1], clamp);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    transform: `scale(${z[0] + (z[1] - z[0]) * p}) translateX(${pan[0] + (pan[1] - pan[0]) * p}%)`,
    filter,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {video ? <OffthreadVideo src={src} muted playbackRate={rate} style={style} /> : <Img src={src} style={style} />}
    </AbsoluteFill>
  );
};

/** Architectural grid + registration marks */
const Grid: React.FC<{ color?: string; opacity?: number }> = ({ color = C.copper, opacity = 0.18 }) => {
  const t = useT();
  const p = prog(t, 0, 1.2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 180} y1={0} x2={i * 180} y2={1920 * p} stroke={color} strokeWidth={1} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 192} x2={1080 * p} y2={i * 192} stroke={color} strokeWidth={1} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const Marks: React.FC<{ color?: string; inset?: number }> = ({ color = C.copper, inset = 36 }) => {
  const L = 46;
  const corners = [
    [inset, inset, 1, 1],
    [1080 - inset, inset, -1, 1],
    [inset, 1920 - inset, 1, -1],
    [1080 - inset, 1920 - inset, -1, -1],
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920}>
        {corners.map(([x, y, dx, dy], i) => (
          <g key={i} stroke={color} strokeWidth={3} fill="none">
            <line x1={x} y1={y} x2={x + L * dx} y2={y} />
            <line x1={x} y1={y} x2={x} y2={y + L * dy} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Signature transition: venetian blinds. p=0 closed (slats cover), p=1 open */
const Blinds: React.FC<{ p: number; slats?: number; color?: string }> = ({ p, slats = 16, color = C.stone2 }) => {
  const h = 1920 / slats;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: slats }).map((_, i) => {
        const stagger = i / slats;
        const local = interpolate(p, [stagger * 0.5, stagger * 0.5 + 0.5], [0, 1], { ...clamp, easing: easeInOut });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * h,
              height: h + 1,
              transform: `scaleY(${1 - local})`,
              transformOrigin: "top",
              background: `linear-gradient(180deg, ${color} 0%, #FFFFFF 45%, ${color} 70%, #BFAF9C 100%)`,
              boxShadow: local < 1 ? "0 6px 10px rgba(0,0,0,0.18)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; color?: string; at?: number; style?: React.CSSProperties }> = ({ children, color = C.copper, at = 0.1, style }) => {
  const t = useT();
  const w = prog(t, at, at + 0.8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, ...style }}>
      <div style={{ width: 90 * w, height: 3, background: color }} />
      <Reveal at={at + 0.1} from="left">
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 8, color, textTransform: "uppercase" }}>{children}</div>
      </Reveal>
    </div>
  );
};

const CopperText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: COPPER_GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);

/* ------------------------------------------------------------------ icons */
type IconName =
  | "kitchen" | "bath" | "wc" | "uni" | "hospital" | "cross3" | "city" | "metro" | "road" | "plane"
  | "snow" | "smart" | "sound" | "heat" | "layers" | "bell" | "meeting" | "sofa" | "parking" | "shield" | "camera" | "drops" | "key";

const Icon: React.FC<{ name: IconName; size?: number; color?: string; sw?: number }> = ({ name, size = 64, color = C.copper, sw = 3 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    kitchen: (<><path d="M10 26h44v6a14 14 0 0 1-14 14H24a14 14 0 0 1-14-14z" {...p} /><path d="M6 26h52M24 18c0-4 4-4 4-8M34 18c0-4 4-4 4-8" {...p} /></>),
    bath: (<><path d="M6 32h52v6a12 12 0 0 1-12 12H18A12 12 0 0 1 6 38z" {...p} /><path d="M14 32V14a6 6 0 0 1 12 0M16 50l-2 6M48 50l2 6" {...p} /></>),
    wc: (<><rect x="8" y="10" width="48" height="44" {...p} /><path d="M16 24l4 16 4-12 4 12 4-16M48 26a6 6 0 1 0 0 12" {...p} /></>),
    uni: (<><path d="M4 24L32 12l28 12-28 12z" {...p} /><path d="M16 30v12c8 6 24 6 32 0V30M58 24v14" {...p} /></>),
    hospital: (<><rect x="10" y="10" width="44" height="44" {...p} /><path d="M32 20v24M20 32h24" {...p} /></>),
    cross3: (<><path d="M32 54V32M32 32L10 14M32 32l22-18" {...p} /><circle cx="32" cy="32" r="5" {...p} /></>),
    city: (<><path d="M8 56V22l16-8v42M24 56V28h16v28M40 56V16h16v40M4 56h56" {...p} /></>),
    metro: (<><rect x="14" y="8" width="36" height="38" rx="8" {...p} /><path d="M14 30h36M22 46l-6 10M42 46l6 10" {...p} /><circle cx="24" cy="38" r="2" {...p} /><circle cx="40" cy="38" r="2" {...p} /></>),
    road: (<><path d="M22 6L10 58M42 6l12 52M32 10v8M32 26v8M32 42v8" {...p} /></>),
    plane: (<><path d="M30 6c2-2 6 0 6 4v14l20 12v6l-20-6v12l6 6v4l-10-3-10 3v-4l6-6V36L8 42v-6l20-12V10c0-2 1-3 2-4z" {...p} /></>),
    snow: (<><path d="M32 6v52M10 19l44 26M54 19L10 45" {...p} /><path d="M26 10l6 6 6-6M26 54l6-6 6 6" {...p} /></>),
    smart: (<><rect x="18" y="6" width="28" height="52" rx="5" {...p} /><path d="M28 50h8" {...p} /><path d="M24 24a12 12 0 0 1 16 0M27 29a7 7 0 0 1 10 0" {...p} /></>),
    sound: (<><path d="M8 26v12h10l12 10V16L18 26z" {...p} /><path d="M42 24l14 16M56 24L42 40" {...p} /></>),
    heat: (<><path d="M26 38V12a6 6 0 0 1 12 0v26a10 10 0 1 1-12 0z" {...p} /><path d="M32 22v20" {...p} /></>),
    layers: (<><path d="M32 8l26 12-26 12L6 20z" {...p} /><path d="M6 32l26 12 26-12M6 44l26 12 26-12" {...p} /></>),
    bell: (<><path d="M10 46h44M14 46a18 18 0 0 1 36 0M32 22v6M26 22h12M8 54h48" {...p} /></>),
    meeting: (<><rect x="14" y="26" width="36" height="12" {...p} /><circle cx="18" cy="16" r="5" {...p} /><circle cx="46" cy="16" r="5" {...p} /><circle cx="18" cy="50" r="5" {...p} /><circle cx="46" cy="50" r="5" {...p} /></>),
    sofa: (<><path d="M10 30V22a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v8" {...p} /><path d="M6 30h52v16H6zM12 46v6M52 46v6" {...p} /></>),
    parking: (<><rect x="8" y="8" width="48" height="48" {...p} /><path d="M24 46V18h10a8 8 0 0 1 0 16H24" {...p} /></>),
    shield: (<><path d="M32 6l22 8v16c0 14-10 22-22 28C20 52 10 44 10 30V14z" {...p} /><path d="M22 32l7 7 13-14" {...p} /></>),
    camera: (<><path d="M8 18l34 8-4 14-34-8z" {...p} /><path d="M38 34l10 4 4 14H40M8 26v20" {...p} /></>),
    drops: (<><path d="M32 6c8 12 12 18 12 24a12 12 0 0 1-24 0c0-6 4-12 12-24z" {...p} /><path d="M14 40c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10zM50 40c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10z" {...p} /></>),
    key: (<><circle cx="20" cy="32" r="12" {...p} /><path d="M32 32h26M50 32v10M58 32v6" {...p} /></>),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {paths[name]}
    </svg>
  );
};

/* ------------------------------------------------------------ scene shell */
const Scene: React.FC<{ r: readonly [number, number]; children: React.ReactNode }> = ({ r, children }) => (
  <Sequence from={s(r[0])} durationInFrames={s(r[1]) - s(r[0])} premountFor={30}>
    {children}
  </Sequence>
);

/* ================================================================ SCENES */

/** 1. Blinds open on the executive office */
const Intro: React.FC = () => {
  const t = useT();
  const open = interpolate(t, [0, 1.3], [0.2, 1], { ...clamp, easing: easeInOut });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Cover src={O("v_exec_dolly.mp4")} video dur={6} z={[1.12, 1.0]} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(21,18,15,0.55) 0%, rgba(21,18,15,0) 25%, rgba(21,18,15,0.55) 45%, rgba(21,18,15,0.95) 75%)" }} />
      <Blinds p={open} />
      <Marks color={C.champagne} />
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 360 }}>
        <Kicker at={1.0} color={C.champagne} style={{ transform: "scale(1.25)", transformOrigin: "left center" }}>Arnavutköy'de satılık</Kicker>
        <Reveal at={1.2} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 210, lineHeight: 0.92, color: C.stone, letterSpacing: -2 }}>LÜKS</div>
        </Reveal>
        <Reveal at={1.4}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 210, lineHeight: 0.92, letterSpacing: -2 }}>
            <CopperText>OFİS</CopperText>
          </div>
        </Reveal>
        <Pop at={3.0} style={{ marginTop: 30 }}>
          <div style={{ display: "inline-block", border: `2px solid ${C.champagne}`, padding: "18px 28px", background: "rgba(21,18,15,0.45)" }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: C.stone, lineHeight: 1.2 }}>İş merkezinde</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: C.champagne, lineHeight: 1.2 }}>yatırım fırsatı!</div>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 2. Three words filled with interiors */
const Manifesto: React.FC = () => {
  const t = useT();
  const words = [
    { w: "MODERN", at: 0.0, img: A("end_lounge.png") },
    { w: "PRESTİJLİ", at: 0.8, img: A("kitchen.jpg") },
    { w: "AYRICALIKLI", at: 1.8, img: A("lounge.jpg") },
  ];
  return (
    <AbsoluteFill style={{ background: C.stone }}>
      <Grid />
      <Marks />
      <div style={{ position: "absolute", left: 60, right: 40, top: 520 }}>
        {words.map((x, i) => {
          const p = prog(t, x.at, x.at + 0.7);
          const pan = interpolate(t, [x.at, 3.9], [0, 30], clamp);
          return (
            <div key={x.w} style={{ overflow: "hidden", marginBottom: 6 }}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: i === 2 ? 128 : 170,
                  lineHeight: 1.08,
                  letterSpacing: -2,
                  backgroundImage: `url(${x.img})`,
                  backgroundSize: "160% auto",
                  backgroundPosition: `${pan}% 50%`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: `2.5px ${C.ink}`,
                  transform: `translateY(${(1 - p) * 110}%)`,
                }}
              >
                {x.w}
              </div>
            </div>
          );
        })}
        <Pop at={2.4} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 54, color: C.ink }}>
            bir ofis <span style={{ color: C.copper, fontWeight: 700 }}>sizi bekliyor.</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 3. Elevator counts to floor 4, doors open */
const Elevator: React.FC = () => {
  const t = useT();
  const floor = Math.min(4, 1 + Math.floor(prog(t, 0.0, 1.1, Easing.linear) * 3.999));
  const doors = prog(t, 1.35, 2.3, easeInOut);
  const arrowY = Math.sin(t * 8) * 6;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Cover src={O("v_doors.mp4")} video dur={2.7} z={[1.05, 1.12]} rate={1.6} />
      {/* doors */}
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 540,
            left: side === 0 ? 0 : 540,
            transform: `translateX(${(side === 0 ? -1 : 1) * doors * 540}px)`,
            background: `linear-gradient(${side === 0 ? 90 : 270}deg, #6E6458 0%, #B9AC9C 30%, #D9CEC0 55%, #9F9282 80%, #5E554B 100%)`,
            boxShadow: side === 0 ? "inset -4px 0 0 rgba(0,0,0,0.35)" : "inset 4px 0 0 rgba(255,255,255,0.25)",
          }}
        >
          {/* brushed lines */}
          <svg width={540} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
            {Array.from({ length: 60 }).map((_, i) => (
              <line key={i} x1={0} y1={i * 32 + 8} x2={540} y2={i * 32 + 14} stroke="#fff" strokeWidth={1} />
            ))}
          </svg>
        </div>
      ))}
      {/* floor display */}
      <div
        style={{
          position: "absolute",
          left: 290,
          right: 290,
          top: 330,
          height: 360,
          background: "#0B0A09",
          border: `4px solid ${C.copper}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          opacity: 1 - doors * 0.9,
          boxShadow: `0 0 60px rgba(176,112,63,0.45)`,
        }}
      >
        <svg width={70} height={90} style={{ transform: `translateY(${arrowY}px)` }}>
          <path d="M35 6L64 46H44v38H26V46H6z" fill={C.champagne} />
        </svg>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 280, lineHeight: 1, color: C.champagne, textShadow: `0 0 30px ${C.copper}` }}>{floor}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", opacity: 1 - doors }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: C.ink }}>KAT</div>
      </div>
      {/* big caption after doors open */}
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 380 }}>
        <Reveal at={1.5}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 190, lineHeight: 0.95, color: C.stone, textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>
            4. KAT
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

/** 4. Floor-plan blueprint draws itself, the real office appears through it */
const Plan: React.FC = () => {
  const t = useT();
  const draw = prog(t, 0.0, 1.3, Easing.inOut(Easing.quad));
  const reveal = prog(t, 1.0, 2.0);
  const L = 4200;
  return (
    <AbsoluteFill style={{ background: C.stone }}>
      <Grid opacity={0.22} />
      <AbsoluteFill style={{ opacity: reveal, clipPath: `inset(${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}% 0)` }}>
        <Cover src={A("v_exec.mp4")} video rate={1.6} dur={2.6} z={[1.0, 1.06]} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(21,18,15,0.45), rgba(21,18,15,0) 40%, rgba(21,18,15,0.85))" }} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={reveal > 0.5 ? C.champagne : C.ink} strokeWidth={5} strokeDasharray={L} strokeDashoffset={L * (1 - draw)}>
          <path d="M140 520 H940 V1240 H620 M520 1240 H140 Z" />
          <path d="M140 860 H420 V1240 M420 860 V720 H140" />
          <path d="M680 520 V780 H940" />
          <path d="M420 1060 h-120 M300 1060 v180" />
        </g>
        <g stroke={reveal > 0.5 ? C.champagne : C.copper} strokeWidth={3} opacity={draw}>
          <line x1={140} y1={470} x2={940} y2={470} />
          <line x1={140} y1={455} x2={140} y2={485} />
          <line x1={940} y1={455} x2={940} y2={485} />
          <line x1={990} y1={520} x2={990} y2={1240} />
          <line x1={975} y1={520} x2={1005} y2={520} />
          <line x1={975} y1={1240} x2={1005} y2={1240} />
        </g>
        <g fill={reveal > 0.5 ? C.champagne : C.copper} fontFamily={SANS} fontWeight={700} fontSize={30} opacity={draw} letterSpacing={4}>
          <text x={230} y={810}>MUTFAK</text>
          <text x={175} y={1000}>WC · BANYO</text>
          <text x={570} y={1010}>ÇALIŞMA ALANI</text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center" }}>
        <Pop at={0.2}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 230, lineHeight: 1, color: reveal > 0.5 ? C.stone : C.ink }}>
            85<span style={{ fontSize: 120 }}> m²</span>
          </div>
        </Pop>
        <Pop at={0.4}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              marginTop: 14,
              padding: "18px 30px",
              background: COPPER_GRAD,
              color: C.ink,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: 2,
            }}
          >
            <Icon name="key" size={52} color={C.ink} sw={4} /> ANAHTAR TESLİM · KULLANIMA HAZIR
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 5. Private kitchen / bath / WC — stacked bands */
const Comfort: React.FC = () => {
  const t = useT();
  const items: { label: string; icon: IconName; at: number }[] = [
    { label: "MUTFAK", icon: "kitchen", at: 0.0 },
    { label: "BANYO", icon: "bath", at: 1.4 },
    { label: "WC", icon: "wc", at: 2.2 },
  ];
  return (
    <AbsoluteFill style={{ background: C.slate }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1180, overflow: "hidden" }}>
        <Cover src={O("v_kitchen.mp4")} video dur={3.2} rate={1.6} z={[1.05, 1.12]} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(23,40,44,0.5), rgba(23,40,44,0) 35%, rgba(23,40,44,0) 70%, rgba(23,40,44,1))" }} />
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 330 }}>
        <Kicker color={C.champagne} at={0.05}>Her ofise özel</Kicker>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 1060, display: "flex", gap: 22 }}>
        {items.map((it) => {
          const p = prog(t, it.at, it.at + 0.6);
          return (
            <div
              key={it.label}
              style={{
                flex: 1,
                height: 420,
                background: p > 0 ? "rgba(239,232,223,0.97)" : "transparent",
                transform: `translateY(${(1 - p) * 120}px)`,
                opacity: p,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 26,
                borderTop: `8px solid ${C.copper}`,
              }}
            >
              <Icon name={it.icon} size={120} color={C.copper} sw={2.6} />
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: it.label.length > 4 ? 62 : 80, color: C.ink }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 6. Modern & comfortable workspace */
const Work: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Cover src={A("office_clean.png")} dur={2.6} z={[1.15, 1.28]} pos="50% 50%" />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(21,18,15,0.4) 0%, rgba(21,18,15,0) 35%, rgba(21,18,15,0.9) 100%)" }} />
    <Marks color={C.champagne} />
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 380 }}>
      <Reveal at={0.1}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, lineHeight: 1, color: C.stone }}>MODERN &</div>
      </Reveal>
      <Reveal at={0.25}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, lineHeight: 1 }}>
          <CopperText>KONFORLU</CopperText>
        </div>
      </Reveal>
      <Pop at={0.6} style={{ marginTop: 18 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 52, color: C.stone, letterSpacing: 2 }}>çalışma alanı</div>
      </Pop>
    </div>
  </AbsoluteFill>
);

/** Map projection shared by location + proximity scenes */
const NODE = { x: 540, y: 1040 };

const MapBase: React.FC<{ dim?: number }> = ({ dim = 0 }) => {
  const t = useT();
  const pulse = (t * 0.9) % 1;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* contour rings */}
        {[180, 320, 470, 640].map((r, i) => (
          <circle key={r} cx={NODE.x} cy={NODE.y} r={r} fill="none" stroke={C.champagne} strokeOpacity={0.14 + i * 0.02} strokeDasharray="6 14" strokeWidth={2} />
        ))}
        <circle cx={NODE.x} cy={NODE.y} r={40 + pulse * 140} fill="none" stroke={C.copper} strokeWidth={3} strokeOpacity={(1 - pulse) * (1 - dim)} />
        <circle cx={NODE.x} cy={NODE.y} r={26} fill={C.copper} />
        <circle cx={NODE.x} cy={NODE.y} r={10} fill={C.stone} />
      </svg>
      <div style={{ position: "absolute", left: NODE.x - 300, top: NODE.y - 18, width: 240, textAlign: "right", fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.champagne }}>
        OFİSİNİZ
      </div>
    </>
  );
};

const LocCard: React.FC<{ at: number; icon: IconName; kicker: string; title: string; top: number; side: "l" | "r" }> = ({ at, icon, kicker, title, top, side }) => {
  const t = useT();
  const p = prog(t, at, at + 0.7);
  return (
    <div
      style={{
        position: "absolute",
        top,
        [side === "l" ? "left" : "right"]: 50,
        width: 640,
        opacity: p,
        transform: `translateX(${(1 - p) * (side === "l" ? -80 : 80)}px)`,
        background: C.stone,
        padding: "26px 30px",
        borderLeft: `10px solid ${C.copper}`,
        display: "flex",
        gap: 24,
        alignItems: "center",
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      }}
    >
      <Icon name={icon} size={92} color={C.copper} sw={3} />
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: C.copper }}>{kicker}</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, lineHeight: 1.1, color: C.ink }}>{title}</div>
        <div style={{ marginTop: 10, display: "inline-block", background: C.ink, color: C.champagne, fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 4, padding: "8px 16px" }}>
          TAM KARŞISINDA
        </div>
      </div>
    </div>
  );
};

/** 7. Location — strategic position */
const Location: React.FC = () => {
  const t = useT();
  const roads = prog(t, 5.6, 6.8);
  const L = 900;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 54%, ${C.slate2} 0%, ${C.slate} 60%, #0E1A1D 100%)` }}>
      <Grid color={C.champagne} opacity={0.08} />
      <MapBase />
      {/* 3 roads */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[
          `M${NODE.x} ${NODE.y} L${NODE.x} 1900`,
          `M${NODE.x} ${NODE.y} L40 640`,
          `M${NODE.x} ${NODE.y} L1040 640`,
        ].map((d, i) => (
          <path key={i} d={d} stroke={C.champagne} strokeWidth={18} strokeOpacity={0.9} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - roads)} strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 70, right: 70, top: 320 }}>
        <Kicker color={C.champagne}>Eşsiz ve stratejik konum</Kicker>
        <Reveal at={0.3} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, lineHeight: 1.1, color: C.stone }}>Geleceğin ticaret merkezi</div>
        </Reveal>
      </div>
      <LocCard at={0.1} icon="uni" kicker="PLANLANAN" title="Esenyurt Üniversitesi Kampüsü" top={1250} side="l" />
      <LocCard at={2.5} icon="hospital" kicker="PLANLANAN" title="Arnavutköy Devlet Hastanesi" top={1520} side="r" />
      {/* 3-way junction badge */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", opacity: roads }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 20, background: COPPER_GRAD, padding: "18px 34px" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1 }}>3</span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.ink, lineHeight: 1.1, textAlign: "left" }}>
            YÖNE AÇILAN
            <br />
            YOL KAVŞAĞI
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 8. Proximity — routes grow from the office to 4 destinations */
const DEST: { at: number; x: number; y: number; icon: IconName; label: string; min: number; lx: number; ly: number }[] = [
  { at: 0.1, x: 210, y: 700, icon: "city", label: "Arnavutköy Belediyesi", min: 1, lx: 60, ly: 470 },
  { at: 2.5, x: 880, y: 760, icon: "metro", label: "Metro İstasyonu", min: 5, lx: 560, ly: 520 },
  { at: 3.6, x: 170, y: 1420, icon: "road", label: "Kuzey Marmara Otoyolu", min: 5, lx: 40, ly: 1500 },
  { at: 5.9, x: 900, y: 1500, icon: "plane", label: "İstanbul Havalimanı", min: 12, lx: 560, ly: 1580 },
];

const Proximity: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 54%, ${C.slate2} 0%, ${C.slate} 60%, #0E1A1D 100%)` }}>
      <Grid color={C.champagne} opacity={0.08} />
      <MapBase />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {DEST.map((d) => {
          const p = prog(t, d.at, d.at + 1.0, Easing.inOut(Easing.cubic));
          const cx = (NODE.x + d.x) / 2 + (d.y < NODE.y ? -60 : 60);
          const cy = (NODE.y + d.y) / 2;
          const path = `M${NODE.x} ${NODE.y} Q${cx} ${cy} ${d.x} ${d.y}`;
          return (
            <g key={d.label}>
              <path d={path} fill="none" stroke={C.copper} strokeWidth={6} strokeDasharray="1200" strokeDashoffset={1200 * (1 - p)} strokeLinecap="round" />
              <circle cx={d.x} cy={d.y} r={18 * p} fill={C.champagne} />
            </g>
          );
        })}
      </svg>
      {DEST.map((d) => {
        const p = prog(t, d.at + 0.5, d.at + 1.1);
        const n = Math.max(1, Math.round(d.min * prog(t, d.at + 0.4, d.at + 1.2)));
        return (
          <div
            key={d.label}
            style={{
              position: "absolute",
              left: d.lx,
              top: d.ly,
              width: 480,
              opacity: p,
              transform: `scale(${0.9 + 0.1 * p})`,
              transformOrigin: "left top",
              background: "rgba(239,232,223,0.96)",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            }}
          >
            <Icon name={d.icon} size={70} color={C.copper} sw={3} />
            <div style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 32, lineHeight: 1.12, color: C.ink }}>{d.label}</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, lineHeight: 0.9, color: C.copper }}>{n}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: C.ink }}>DAKİKA</div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 70, right: 70, top: 320 }}>
        <Kicker color={C.champagne}>Önemli noktalara yakınlık</Kicker>
      </div>
    </AbsoluteFill>
  );
};

/** 9. Smart-office control panel */
const Widget: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => (
  <Pop at={at} dist={60}>
    <div
      style={{
        background: "rgba(239,232,223,0.94)",
        padding: 28,
        height: 470,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 30px 70px rgba(0,0,0,0.4)",
        borderTop: `6px solid ${C.copper}`,
        ...style,
      }}
    >
      {children}
    </div>
  </Pop>
);

const WTitle: React.FC<{ a: string; b: string }> = ({ a, b }) => (
  <div>
    <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 46, lineHeight: 1.05, color: C.ink }}>{a}</div>
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 27, lineHeight: 1.2, color: "#5A5047", marginTop: 6 }}>{b}</div>
  </div>
);

const Tech: React.FC = () => {
  const t = useT();
  const temp = Math.round(interpolate(t, [0.4, 1.8], [28, 22], { ...clamp, easing: ease }));
  const dial = prog(t, 0.4, 1.8);
  const toggles = [prog(t, 2.9, 3.1), prog(t, 3.2, 3.4), prog(t, 3.5, 3.7)];
  const sound = prog(t, 4.3, 5.2);
  const heat = prog(t, 4.6, 5.6);
  const floorP = prog(t, 5.9, 7.2);
  const R = 120;
  const CIRC = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Cover src={A("v_lounge.mp4")} video dur={8.8} rate={0.75} filter="blur(14px) brightness(0.45)" z={[1.2, 1.3]} />
      <Marks color={C.champagne} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 320 }}>
        <Kicker color={C.champagne}>Modern ofis teknolojileri</Kicker>
        <Reveal at={0.25} style={{ marginTop: 14 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 76, color: C.stone, lineHeight: 1.05 }}>Akıllı & Donanımlı</div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 44, right: 44, top: 560, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {/* VRV thermostat */}
        <Widget at={0.15}>
          <div style={{ position: "relative", width: 280, height: 280, alignSelf: "center" }}>
            <svg width={280} height={280} style={{ position: "absolute", inset: 0, transform: "rotate(135deg)" }}>
              <circle cx={140} cy={140} r={R} fill="none" stroke={C.stone2} strokeWidth={16} strokeDasharray={`${CIRC * 0.75} ${CIRC}`} strokeLinecap="round" />
              <circle cx={140} cy={140} r={R} fill="none" stroke={C.copper} strokeWidth={16} strokeDasharray={`${CIRC * 0.75 * (0.3 + 0.45 * dial)} ${CIRC}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1 }}>{temp}°</div>
              <Icon name="snow" size={42} color={C.copper} sw={3} />
            </div>
          </div>
          <WTitle a="Mitsubishi VRV" b="Merkezi ısıtma & soğutma" />
        </Widget>
        {/* Automation */}
        <Widget at={2.6}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 6 }}>
            {["Aydınlatma", "Klima", "Perdeler"].map((lbl, i) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: C.ink }}>{lbl}</div>
                <div style={{ width: 96, height: 50, borderRadius: 25, background: toggles[i] > 0.5 ? C.copper : C.stone2, position: "relative" }}>
                  <div style={{ position: "absolute", top: 5, left: 5 + toggles[i] * 46, width: 40, height: 40, borderRadius: 20, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            ))}
          </div>
          <WTitle a="Akıllı Otomasyon" b="Uzaktan kontrol edilebilir" />
        </Widget>
        {/* Insulation */}
        <Widget at={4.25}>
          <div style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "flex-end", height: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 160 }}>
              <Icon name="sound" size={80} color={C.copper} sw={3} />
              {Array.from({ length: 6 }).map((_, i) => {
                const h = (40 + 100 * Math.abs(Math.sin(t * 9 + i))) * (1 - sound * 0.85);
                return <div key={i} style={{ width: 10, height: h, background: C.copper, opacity: 0.8 }} />;
              })}
            </div>
            <div style={{ position: "relative", width: 44, height: 200, border: `3px solid ${C.copper}`, borderRadius: 22, overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${30 + heat * 55}%`, background: COPPER_GRAD }} />
            </div>
          </div>
          <WTitle a="Ses & Isı Yalıtımı" b="Üst düzey yalıtımlı yapı sistemi" />
        </Widget>
        {/* Raised floor — isometric layers */}
        <Widget at={5.8}>
          <svg width={300} height={230} viewBox="0 0 300 230" style={{ alignSelf: "center" }}>
            {[0, 1, 2].map((i) => {
              const off = (1 - floorP) * (2 - i) * 30 + i * 0;
              const y = 40 + i * 55 - off;
              return (
                <g key={i} opacity={0.4 + 0.3 * i}>
                  <path d={`M150 ${y} L280 ${y + 50} L150 ${y + 100} L20 ${y + 50} Z`} fill={i === 2 ? C.copper : "none"} fillOpacity={0.25} stroke={C.copper} strokeWidth={3} />
                </g>
              );
            })}
            {[60, 150, 240].map((x) => (
              <line key={x} x1={x} y1={150} x2={x} y2={200} stroke={C.ink} strokeWidth={3} opacity={floorP} />
            ))}
          </svg>
          <WTitle a="Yükseltilmiş Döşeme" b="Yangına dayanıklı · İthal" />
        </Widget>
      </div>
    </AbsoluteFill>
  );
};

/** 10. Amenities — bento grid */
const Tile: React.FC<{ at: number; img?: string; video?: string; icon?: IconName; label: string; style?: React.CSSProperties; dark?: boolean }> = ({
  at,
  img,
  video,
  icon,
  label,
  style,
  dark,
}) => {
  const t = useT();
  const p = prog(t, at, at + 0.6);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: dark ? C.slate : C.stone,
        clipPath: `inset(${(1 - p) * 100}% 0 0 0)`,
        ...style,
      }}
    >
      {img && <Img src={img} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 - 0.1 * p})` }} />}
      {video && <OffthreadVideo src={video} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      {(img || video) && <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(21,18,15,0.85))" }} />}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        {icon && <Icon name={icon} size={64} color={dark || img || video ? C.champagne : C.copper} sw={3} />}
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, lineHeight: 1.1, color: dark || img || video ? C.stone : C.ink }}>{label}</div>
      </div>
    </div>
  );
};

const Amenities: React.FC = () => (
  <AbsoluteFill style={{ background: C.stone }}>
    <Grid opacity={0.15} />
    <div style={{ position: "absolute", left: 60, right: 60, top: 320 }}>
      <Kicker>Prestijli iş merkezi olanakları</Kicker>
    </div>
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: 430,
        bottom: 300,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1.25fr 1fr 1fr 0.8fr",
        gap: 16,
      }}
    >
      <Tile at={0.05} icon="bell" label="Profesyonel Resepsiyon" dark />
      <Tile at={1.0} video={A("v_meeting.mp4")} icon="meeting" label="Toplantı Salonları" />
      <Tile at={2.4} img={A("lounge.jpg")} icon="sofa" label="Geniş Ortak Kullanım Alanları" style={{ gridColumn: "1 / 3" }} />
      <Tile at={3.9} icon="parking" label="Kapalı Otopark" />
      <Tile at={5.0} icon="shield" label="7/24 Profesyonel Güvenlik" dark />
      <Tile at={5.6} icon="camera" label="7/24 Kamera Sistemi" dark />
      <Tile at={6.1} icon="drops" label="Yangın Algılama & Sprinkler" />
    </div>
  </AbsoluteFill>
);

/** 11. Price — odometer digits */
const Digit: React.FC<{ d: number; p: number; i: number }> = ({ d, p, i }) => {
  const spins = 2 + i;
  const pos = (d + 10 * spins) * Math.min(1, p);
  const h = 190;
  return (
    <div style={{ height: h, overflow: "hidden", width: 112, display: "inline-block" }}>
      <div style={{ transform: `translateY(${-(pos % 10) * h}px)` }}>
        {Array.from({ length: 11 }).map((_, k) => (
          <div key={k} style={{ height: h, lineHeight: `${h}px`, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 170 }}>
            <CopperText>{k % 10}</CopperText>
          </div>
        ))}
      </div>
    </div>
  );
};

const Price: React.FC = () => {
  const t = useT();
  const digits = "8500000".split("").map(Number);
  const p = prog(t, 0.6, 2.4, Easing.out(Easing.cubic));
  const open = prog(t, 0, 1.0, easeInOut);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Cover src={A("end_lounge.png")} dur={3.9} z={[1.1, 1.2]} filter="brightness(0.35) saturate(0.9)" />
      <Blinds p={open} color="#2A2520" />
      <Marks color={C.champagne} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center" }}>
        <Kicker color={C.champagne} style={{ justifyContent: "center" }}>Ofisin satış fiyatı</Kicker>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 70 }}>
          {digits.map((d, i) => (
            <React.Fragment key={i}>
              <Digit d={d} p={p} i={i} />
              {(i === 0 || i === 3) && <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 170, lineHeight: "190px", color: C.copper, width: 30 }}>.</div>}
            </React.Fragment>
          ))}
        </div>
        <Pop at={2.2}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 110, letterSpacing: 16, color: C.stone, marginTop: 10 }}>TL</div>
        </Pop>
        <Pop at={2.6} style={{ marginTop: 60 }}>
          <div style={{ display: "inline-flex", border: `2px solid ${C.champagne}` }}>
            {["85 m²", "4. KAT", "OFİS"].map((x, i) => (
              <div key={x} style={{ padding: "22px 34px", fontFamily: SANS, fontWeight: 700, fontSize: 46, color: i === 1 ? C.ink : C.stone, background: i === 1 ? COPPER_GRAD : "transparent" }}>
                {x}
              </div>
            ))}
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 12. Rising value — growth line over the building */
const Rise: React.FC = () => {
  const t = useT();
  const line = prog(t, 0.2, 2.6, Easing.inOut(Easing.cubic));
  const L = 1500;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Cover src={A("v_building.mp4")} video rate={1.4} dur={5} pos="62% 50%" z={[1.0, 1.08]} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(21,18,15,0.92) 0%, rgba(21,18,15,0.6) 28%, rgba(21,18,15,0.1) 45%, rgba(21,18,15,0.3) 62%, rgba(21,18,15,0.95) 100%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path
          d="M40 1250 L220 1190 L360 1215 L520 1080 L660 1105 L820 930 L1040 800"
          fill="none"
          stroke={C.champagne}
          strokeWidth={8}
          strokeDasharray={L}
          strokeDashoffset={L * (1 - line)}
          strokeLinejoin="round"
        />
        <circle cx={1040} cy={800} r={18 * line} fill={C.copper} />
      </svg>
      <div style={{ position: "absolute", left: 70, right: 70, top: 330 }}>
        <Reveal at={0.1}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, lineHeight: 1.04, color: C.stone }}>ARNAVUTKÖY'ÜN</div>
        </Reveal>
        <Reveal at={0.3}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, lineHeight: 1.04 }}>
            <span style={{ color: C.champagne, textShadow: "0 6px 30px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)" }}>YÜKSELEN</span>
          </div>
        </Reveal>
        <Reveal at={0.5}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, lineHeight: 1.04, color: C.stone }}>DEĞERİNDE</div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 360 }}>
        <Pop at={2.2}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, lineHeight: 1.2, color: C.stone }}>
            prestijli bir iş merkezinde
            <br />
            <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, color: C.champagne }}>YERİNİZİ ALIN!</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 13. End card — light stone, logo + phone */
const End: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sp = spring({ frame, fps: FPS, config: { damping: 15, stiffness: 90 } });
  const open = prog(t, 0, 0.9, easeInOut);
  const shine = interpolate(t, [1.6, 2.6], [-30, 130], clamp);
  return (
    <AbsoluteFill style={{ background: C.stone }}>
      <Grid opacity={0.18} />
      <Marks />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
        <Img src={A("logo_dark.png")} style={{ width: 680, transform: `scale(${0.85 + 0.15 * sp})`, opacity: sp }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1110, textAlign: "center" }}>
        <Kicker at={0.6} style={{ justifyContent: "center" }}>Hemen arayın</Kicker>
        <Pop at={0.9} style={{ marginTop: 30 }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 24, padding: "34px 50px", background: C.ink, overflow: "hidden" }}>
            <svg width={64} height={64} viewBox="0 0 24 24">
              <path
                d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
                fill="none"
                stroke={C.champagne}
                strokeWidth={1.8}
              />
            </svg>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 74, color: C.stone, letterSpacing: 1 }}>{PHONE}</span>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${shine - 15}%, rgba(231,201,161,0.35) ${shine}%, transparent ${shine + 15}%)` }} />
          </div>
        </Pop>
        <Pop at={1.4} style={{ marginTop: 44 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.copper }}>Arnavutköy · Lüks Ofis</div>
        </Pop>
      </div>
      <Blinds p={open} color={C.stone2} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- global overlays */

const BrandCorner: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [10, 26, s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: "rgba(239,232,223,0.95)", padding: "16px 20px 12px", borderBottom: `5px solid ${C.copper}`, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
      <Img src={A("logo_dark.png")} style={{ width: 210, display: "block" }} />
    </div>
  );
};

/** Chapter index — right side, vertical */
const CHAPTERS: [number, string][] = [
  [T.intro[0], "01"],
  [T.elevator[0], "02"],
  [T.location[0], "03"],
  [T.tech[0], "04"],
  [T.amen[0], "05"],
  [T.price[0], "06"],
];
const ChapterIndex: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= T.end[0]) return null;
  let cur = 0;
  CHAPTERS.forEach(([st], i) => {
    if (t >= st) cur = i;
  });
  return (
    <div style={{ position: "absolute", right: 40, top: 70, display: "flex", gap: 10, alignItems: "center" }}>
      {CHAPTERS.map(([, lbl], i) => (
        <div
          key={lbl}
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: i === cur ? 34 : 22,
            color: i === cur ? C.ink : C.stone,
            background: i === cur ? COPPER_GRAD : "rgba(21,18,15,0.45)",
            padding: i === cur ? "10px 14px" : "6px 9px",
          }}
        >
          {lbl}
        </div>
      ))}
    </div>
  );
};

/** Quick copper wipe between scenes */
const Wipes: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = [T.manifesto[0], T.comfort[0], T.work[0], T.location[0], T.proximity[0], T.tech[0], T.amen[0], T.rise[0]].map(s);
  return (
    <>
      {cuts.map((c) => {
        const local = frame - c;
        if (local < -7 || local > 7) return null;
        const p = interpolate(local, [-7, 7], [0, 1], clamp);
        const x = interpolate(p, [0, 1], [-1300, 1300]);
        return (
          <div key={c} style={{ position: "absolute", top: -200, bottom: -200, width: 520, left: 280 + x, transform: "skewX(-18deg)", background: COPPER_GRAD, boxShadow: "0 0 80px rgba(176,112,63,0.6)" }} />
        );
      })}
    </>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.12 }}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(frame / TOTAL) * 100}%`, background: COPPER_GRAD }} />;
};

/* ============================================================ composition */
export const LuksOfis: React.FC = () => {
  const { fps } = useVideoConfig();
  const music = (f: number) =>
    interpolate(f, [0, 15, s(64.9), s(65.5), TOTAL - 40, TOTAL], [0, 0.18, 0.18, 0.42, 0.42, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Scene r={T.intro}><Intro /></Scene>
      <Scene r={T.manifesto}><Manifesto /></Scene>
      <Scene r={T.elevator}><Elevator /></Scene>
      <Scene r={T.plan}><Plan /></Scene>
      <Scene r={T.comfort}><Comfort /></Scene>
      <Scene r={T.work}><Work /></Scene>
      <Scene r={T.location}><Location /></Scene>
      <Scene r={T.proximity}><Proximity /></Scene>
      <Scene r={T.tech}><Tech /></Scene>
      <Scene r={T.amen}><Amenities /></Scene>
      <Scene r={T.price}><Price /></Scene>
      <Scene r={T.rise}><Rise /></Scene>
      <Scene r={T.end}><End /></Scene>

      <Wipes />
      <Grain />
      <BrandCorner />
      <ChapterIndex />
      <Progress />

      <Audio src={O("vo.mp3")} />
      <Audio src={O("music.mp3")} volume={music} />
      {fps !== FPS ? null : null}
    </AbsoluteFill>
  );
};
