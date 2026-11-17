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
} from "remotion";
import { loadFont as loadAlexandria } from "@remotion/google-fonts/Alexandria";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";

const { fontFamily: HEAD } = loadAlexandria("normal", { weights: ["600", "700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: BODY } = loadCairo("normal", { weights: ["600", "700", "800", "900"], subsets: ["arabic", "latin"] });

export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const E = (n: string) => staticFile(`eyup/${n}`);

/* ----------------------------------------------------------------- tokens */
const C = {
  navy: "#0E1A2B",
  navy2: "#172942",
  coral: "#E9673C",
  sand: "#F0C27B",
  ivory: "#FBF6EE",
  ink: "#0B0F17",
};
const SUNSET = `linear-gradient(135deg, #FFD9A0 0%, ${C.sand} 30%, ${C.coral} 75%, #B9431F 100%)`;
const PHONE = "+90 534 878 42 22";

/** Scene timing in seconds, synced to the Harrison Arabic voiceover */
const T = {
  hook: [0, 5.1],
  citizen: [5.1, 8.4],
  where: [8.4, 14.5],
  plan: [14.5, 18.7],
  price: [18.7, 22.7],
  scale: [22.7, 32.4],
  mall: [32.4, 38.4],
  transit: [38.4, 47.7],
  malls: [47.7, 57.4],
  edu: [57.4, 60.6],
  life: [60.6, 73.8],
  cta: [73.8, 77.1],
  end: [77.1, 83.0],
} as const;
export const TOTAL = s(83);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / FPS;
const pr = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...cl, easing: e });

/* ------------------------------------------------------------- primitives */
const RTL: React.CSSProperties = { direction: "rtl", textAlign: "right" };

const Up: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; d?: number }> = ({ at, children, style, d = 0.7 }) => {
  const t = useT();
  const p = pr(t, at, at + d);
  return (
    <div style={{ overflow: "hidden", paddingTop: 16, paddingBottom: 8, marginTop: -16, marginBottom: -8, ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 120}%)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number; scale?: boolean }> = ({ at, children, style, dist = 50, scale }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 15, stiffness: 140, mass: 0.7 } });
  return (
    <div style={{ ...style, opacity: Math.min(1, sp * 1.5), transform: scale ? `scale(${0.6 + 0.4 * sp})` : `translateY(${(1 - sp) * dist}px)` }}>{children}</div>
  );
};

const Media: React.FC<{ src: string; video?: boolean; rate?: number; start?: number; dur: number; z?: [number, number]; pos?: string; filter?: string; x?: [number, number] }> = ({
  src,
  video,
  rate = 1,
  start = 0,
  dur,
  z = [1.04, 1.14],
  pos = "center",
  filter,
  x = [0, 0],
}) => {
  const t = useT();
  const p = interpolate(t, [0, dur], [0, 1], cl);
  const st: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    filter,
    transform: `scale(${z[0] + (z[1] - z[0]) * p}) translateX(${x[0] + (x[1] - x[0]) * p}%)`,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {video ? <OffthreadVideo src={src} muted playbackRate={rate} startFrom={s(start)} style={st} /> : <Img src={src} style={st} />}
    </AbsoluteFill>
  );
};

const SunText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: SUNSET, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);

/** Ottoman arch path (pointed top) for clip-path masks */
const archPath = (x: number, y: number, w: number, h: number) => {
  const r = w / 2;
  const peak = y;
  const spring = y + r * 0.95;
  return `M ${x} ${y + h} L ${x} ${spring} C ${x} ${spring - r * 0.55}, ${x + r * 0.55} ${peak + r * 0.18}, ${x + r} ${peak} C ${x + r * 1.45} ${peak + r * 0.18}, ${x + w} ${spring - r * 0.55}, ${x + w} ${spring} L ${x + w} ${y + h} Z`;
};

/** Arch window that grows to full screen */
const ArchReveal: React.FC<{ p: number; children: React.ReactNode; border?: boolean }> = ({ p, children, border = true }) => {
  const w = interpolate(p, [0, 1], [520, 2600]);
  const h = interpolate(p, [0, 1], [760, 3600]);
  const x = 540 - w / 2;
  const y = interpolate(p, [0, 1], [560, -900]);
  const d = archPath(x, y, w, h);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `path('${d}')` }}>{children}</AbsoluteFill>
      {border && p < 0.98 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d={d} fill="none" stroke={C.sand} strokeWidth={6} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/** Subtle 8-point star geometric pattern */
const Pattern: React.FC<{ color?: string; opacity?: number }> = ({ color = C.sand, opacity = 0.07 }) => (
  <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
    <svg width={1080} height={1920}>
      <defs>
        <pattern id="star8" width={120} height={120} patternUnits="userSpaceOnUse">
          <rect x={30} y={30} width={60} height={60} fill="none" stroke={color} strokeWidth={2} />
          <rect x={30} y={30} width={60} height={60} fill="none" stroke={color} strokeWidth={2} transform="rotate(45 60 60)" />
          <circle cx={60} cy={60} r={8} fill="none" stroke={color} strokeWidth={2} />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#star8)" />
    </svg>
  </AbsoluteFill>
);

/** Istanbul skyline line-art (mosque domes, minarets, Galata tower) that draws itself */
const SKYLINE = (() => {
  const base = 160;
  let d = `M0 ${base} L60 ${base}`;
  // minaret helper
  const minaret = (x: number, h: number) => `L${x} ${base} L${x} ${base - h} L${x + 7} ${base - h - 26} L${x + 14} ${base - h} L${x + 14} ${base} `;
  d += minaret(60, 120);
  d += `L110 ${base} L110 ${base - 40} Q150 ${base - 95} 190 ${base - 40} L190 ${base} `; // small dome
  d += `L200 ${base} L200 ${base - 55} Q290 ${base - 150} 380 ${base - 55} L380 ${base} `; // big dome
  d += `L392 ${base} ` + minaret(392, 135);
  d += `L460 ${base} L460 ${base - 30} Q490 ${base - 70} 520 ${base - 30} L520 ${base} `;
  d += `L600 ${base} L600 ${base - 60} L640 ${base - 60} L640 ${base} `; // houses
  d += `L660 ${base} L660 ${base - 80} L690 ${base - 80} L690 ${base} `;
  // Galata tower
  d += `L740 ${base} L740 ${base - 120} L732 ${base - 120} L760 ${base - 175} L788 ${base - 120} L780 ${base - 120} L780 ${base} `;
  d += `L830 ${base} L830 ${base - 50} Q870 ${base - 100} 910 ${base - 50} L910 ${base} `;
  d += minaret(920, 110);
  d += `L1080 ${base}`;
  return d;
})();

const Skyline: React.FC<{ p: number; color?: string; y?: number; opacity?: number }> = ({ p, color = C.sand, y = 1500, opacity = 1 }) => {
  const L = 4200;
  return (
    <svg width={1080} height={200} style={{ position: "absolute", left: 0, top: y, opacity }}>
      <path d={SKYLINE} fill="none" stroke={color} strokeWidth={4} strokeDasharray={L} strokeDashoffset={L * (1 - p)} strokeLinejoin="round" />
    </svg>
  );
};

const Kicker: React.FC<{ at?: number; children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ at = 0.1, children, color = C.sand, style }) => {
  const t = useT();
  const w = pr(t, at, at + 0.7);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, direction: "rtl", ...style }}>
      <div style={{ width: 80 * w, height: 4, background: color, borderRadius: 2 }} />
      <Up at={at + 0.1}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color }}>{children}</div>
      </Up>
    </div>
  );
};

const Shade: React.FC<{ top?: number; bot?: number; mid?: number }> = ({ top = 0.75, bot = 0.9, mid = 0 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(14,26,43,${top}) 0%, rgba(14,26,43,${mid}) 32%, rgba(14,26,43,${mid}) 50%, rgba(14,26,43,${bot}) 100%)`,
    }}
  />
);

/* ------------------------------------------------------------------- icons */
type IconName = "metro" | "tram" | "bus" | "walk" | "bag" | "uni" | "hosp" | "cinema" | "museum" | "pool" | "gym" | "kids" | "car" | "building" | "key";
const Icon: React.FC<{ n: IconName; size?: number; c?: string; sw?: number }> = ({ n, size = 64, c = C.sand, sw = 3 }) => {
  const p = { fill: "none", stroke: c, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const m: Record<IconName, React.ReactNode> = {
    metro: (<><rect x="14" y="8" width="36" height="38" rx="8" {...p} /><path d="M14 30h36M22 46l-6 10M42 46l6 10" {...p} /><circle cx="24" cy="38" r="2" {...p} /><circle cx="40" cy="38" r="2" {...p} /></>),
    tram: (<><path d="M24 6h16M32 6v8" {...p} /><rect x="12" y="14" width="40" height="34" rx="6" {...p} /><path d="M12 32h40M20 48l-4 8M44 48l4 8" {...p} /></>),
    bus: (<><rect x="8" y="12" width="48" height="34" rx="6" {...p} /><path d="M8 30h48M16 46v6M48 46v6" {...p} /><circle cx="18" cy="38" r="2" {...p} /><circle cx="46" cy="38" r="2" {...p} /></>),
    walk: (<><circle cx="34" cy="10" r="5" {...p} /><path d="M30 20l-8 14 10 4 4 20M30 20l10 8 8 2M32 38l-10 20" {...p} /></>),
    bag: (<><path d="M12 22h40l-4 34H16z" {...p} /><path d="M24 22v-6a8 8 0 0 1 16 0v6" {...p} /></>),
    uni: (<><path d="M4 24L32 12l28 12-28 12z" {...p} /><path d="M16 30v12c8 6 24 6 32 0V30M58 24v14" {...p} /></>),
    hosp: (<><rect x="10" y="10" width="44" height="44" rx="6" {...p} /><path d="M32 20v24M20 32h24" {...p} /></>),
    cinema: (<><rect x="6" y="16" width="52" height="34" rx="4" {...p} /><path d="M26 26l12 7-12 7z" {...p} /><path d="M16 8l8 8M48 8l-8 8" {...p} /></>),
    museum: (<><path d="M6 24L32 8l26 16zM10 56h44M14 28v24M26 28v24M38 28v24M50 28v24" {...p} /></>),
    pool: (<><path d="M6 44c6-4 10-4 16 0s10 4 16 0 10-4 16 0M6 54c6-4 10-4 16 0s10 4 16 0 10-4 16 0" {...p} /><path d="M20 38V12a5 5 0 0 1 10 0M40 38V12a5 5 0 0 1 10 0M20 22h20M20 32h20" {...p} /></>),
    gym: (<><path d="M14 22v20M8 26v12M50 22v20M56 26v12M14 32h36" {...p} /></>),
    kids: (<><circle cx="22" cy="14" r="6" {...p} /><circle cx="44" cy="18" r="5" {...p} /><path d="M22 20v18l-6 16M22 38l6 16M12 28h20M44 23v14l-5 14M44 37l5 14" {...p} /></>),
    car: (<><path d="M8 40l6-16h36l6 16v10H8z" {...p} /><circle cx="18" cy="50" r="4" {...p} /><circle cx="46" cy="50" r="4" {...p} /></>),
    building: (<><rect x="14" y="8" width="36" height="50" {...p} /><path d="M22 18h6M36 18h6M22 28h6M36 28h6M22 38h6M36 38h6M28 58V48h8v10" {...p} /></>),
    key: (<><circle cx="20" cy="32" r="12" {...p} /><path d="M32 32h26M50 32v10M58 32v6" {...p} /></>),
  };
  return <svg width={size} height={size} viewBox="0 0 64 64">{m[n]}</svg>;
};

const Scene: React.FC<{ r: readonly [number, number]; children: React.ReactNode }> = ({ r, children }) => (
  <Sequence from={s(r[0])} durationInFrames={s(r[1]) - s(r[0])} premountFor={30}>
    {children}
  </Sequence>
);

/* ================================================================= SCENES */

/** 1 — aerial: construction site becomes the project */
const Hook: React.FC = () => {
  const t = useT();
  const tag = t < 3.9 ? "قيد الإنشاء" : "اكتمل المشروع";
  const p = pr(t, 0.3, 3.9, Easing.linear);
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("v_aerial.mp4")} video dur={5.1} rate={1.25} z={[1.0, 1.12]} pos="38% 50%" />
      <Shade top={0.85} bot={0.92} mid={0.05} />
      <div style={{ position: "absolute", left: 60, top: 300, width: 330 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: t < 3.9 ? C.ivory : C.ink, background: t < 3.9 ? "rgba(14,26,43,0.6)" : SUNSET, border: `2px solid ${C.sand}`, borderRadius: 999, padding: "8px 20px", textAlign: "center", direction: "rtl" }}>
          {tag} {t < 3.9 ? `${Math.round(p * 100)}%` : "✓"}
        </div>
        <div style={{ height: 6, marginTop: 10, borderRadius: 3, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", background: SUNSET }} />
        </div>
      </div>
      <div style={{ position: "absolute", right: 64, left: 64, bottom: 360, ...RTL }}>
        <Up at={0.1}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 112, lineHeight: 1.15, color: C.ivory }}>استثمر في</div>
        </Up>
        <Up at={0.3}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 132, lineHeight: 1.15 }}>
            <SunText>قلب إسطنبول</SunText>
          </div>
        </Up>
        <Pop at={2.1} style={{ marginTop: 26 }}>
          <div style={{ display: "inline-block", fontFamily: BODY, fontWeight: 800, fontSize: 52, color: C.navy, background: C.ivory, padding: "10px 28px", borderRadius: 14 }}>
            وامتلك فرصة استثمارية مميزة
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 2 — Turkish citizenship stamp */
const Citizen: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const stamp = spring({ frame: f - s(0.55), fps: FPS, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const shake = t > 0.55 && t < 0.8 ? Math.sin(t * 120) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("a/ph22.jpg")} dur={3.3} z={[1.15, 1.25]} pos="70% 50%" filter="brightness(0.45) saturate(1.1)" />
      <Pattern opacity={0.08} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateX(${shake}px)` }}>
        {/* document card */}
        <Pop at={0.0} dist={120}>
          <div style={{ width: 760, height: 520, background: C.ivory, borderRadius: 26, boxShadow: "0 40px 90px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
            <div style={{ height: 120, background: `linear-gradient(90deg, ${C.coral}, #B9431F)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 50, color: C.ivory, direction: "rtl" }}>فرصة الحصول على</div>
            </div>
            <div style={{ padding: "50px 50px", ...RTL }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 18, width: `${80 - i * 18}%`, background: "#E6DCCB", borderRadius: 9, marginBottom: 26, marginRight: 0, marginLeft: "auto" }} />
              ))}
            </div>
            {/* stamp */}
            <div
              style={{
                position: "absolute",
                left: 150,
                top: 190,
                width: 460,
                height: 250,
                border: `10px solid ${C.coral}`,
                borderRadius: 26,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(-9deg) scale(${2.4 - 1.4 * Math.min(stamp, 1)})`,
                opacity: Math.min(1, stamp * 2),
                color: C.coral,
                background: "rgba(233,103,60,0.06)",
              }}
            >
              <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 84, lineHeight: 1.1 }}>الجنسية</div>
              <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 84, lineHeight: 1.1 }}>التركية</div>
            </div>
          </div>
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 3 — Where: 2× 1+1 in Eyüpsultan, tower rises inside an arch */
const Where: React.FC = () => {
  const t = useT();
  const arch = pr(t, 0, 1.0, inOut) * 0.0; // stays as window
  const sky = pr(t, 0.4, 2.6, Easing.inOut(Easing.quad));
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Pattern opacity={0.06} />
      <ArchReveal p={arch}>
        <Media src={E("v_tower.mp4")} video dur={6.1} rate={1.0} z={[1.05, 1.15]} pos="60% 50%" />
      </ArchReveal>
      <Skyline p={sky} y={1330} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Up at={0.1}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 120, lineHeight: 1.1, color: C.ivory }}>
            شقتان <SunText style={{ direction: "ltr", unicodeBidi: "isolate" }}>1+1</SunText>
          </div>
        </Up>
      </div>
      <div style={{ position: "absolute", right: 64, left: 64, top: 1560, ...RTL }}>
        <Up at={2.3}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: C.ivory }}>في مركز إسطنبول</div>
        </Up>
        <Up at={3.8}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 86, lineHeight: 1.15 }}>
            <SunText>أيوب سلطان</SunText>
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.sand, marginRight: 18, direction: "ltr", unicodeBidi: "isolate" }}>Eyüpsultan</span>
          </div>
        </Up>
      </div>
    </AbsoluteFill>
  );
};

/** 4 — 1+1 floor plan, 65 m² */
const Plan: React.FC = () => {
  const t = useT();
  const wipe = pr(t, 0.1, 1.2, inOut);
  const labels = [
    { x: 455, y: 1035, txt: "صالة ومطبخ" },
    { x: 760, y: 790, txt: "غرفة نوم" },
    { x: 315, y: 770, txt: "حمّام" },
    { x: 905, y: 1060, txt: "بلكون" },
  ];
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <Pattern color={C.navy} opacity={0.05} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Kicker at={0.05} color={C.coral}>مخطط الشقة</Kicker>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 520, height: 720, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
        <Img src={E("a/plan11.jpg")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      {labels.map((l, i) => (
        <Pop key={l.txt} at={1.1 + i * 0.25} scale style={{ position: "absolute", left: l.x - 100, top: l.y - 22, width: 200, textAlign: "center" }}>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.ivory, background: C.navy, padding: "6px 14px", borderRadius: 10, direction: "rtl" }}>{l.txt}</span>
        </Pop>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center" }}>
        <Pop at={0.3}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.navy, direction: "rtl" }}>مساحة كل شقة</div>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 210, lineHeight: 1.05, direction: "rtl" }}>
            <SunText>65</SunText>
            <span style={{ color: C.navy, fontSize: 110 }}> م²</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 5 — price over a real triptych of the sample apartment */
const Price: React.FC = () => {
  const t = useT();
  const val = Math.round(466000 * pr(t, 0.2, 1.6, Easing.out(Easing.cubic)));
  const bands = [
    { src: "a/int_living.mp4", start: 2.0 },
    { src: "a/int_kitchen.mp4", start: 1.0 },
    { src: "a/int_bed.mp4", start: 1.5 },
  ];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {bands.map((b, i) => {
        const p = pr(t, i * 0.12, 0.6 + i * 0.12);
        return (
          <div key={b.src} style={{ position: "absolute", left: 0, right: 0, top: i * 640, height: 640, overflow: "hidden", clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>
            <Media src={E(b.src)} video start={b.start} dur={4} z={[1.08, 1.16]} />
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 52%, rgba(14,26,43,0.85) 0%, rgba(14,26,43,0.35) 60%, rgba(14,26,43,0.2) 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Pop at={0.1} scale>
          <div style={{ textAlign: "center", background: "rgba(14,26,43,0.82)", border: `3px solid ${C.sand}`, borderRadius: 34, padding: "40px 60px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.sand, direction: "rtl" }}>بسعر</div>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 168, lineHeight: 1.05, direction: "ltr" }}>
              <SunText>{val.toLocaleString("en-US")}$</SunText>
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.ivory, direction: "rtl", marginTop: 6 }}>شقتان 1+1 · أيوب سلطان</div>
          </div>
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 6 — scale of the project: 2 phases, 16 buildings, 1540 apartments, ready */
const Block: React.FC<{ p: number; h: number; x: number; c: string }> = ({ p, h, x, c }) => (
  <div style={{ position: "absolute", bottom: 0, left: x, width: 44, height: h * p, background: c, borderRadius: "6px 6px 0 0", boxShadow: "inset -10px 0 0 rgba(0,0,0,0.18)" }} />
);

const Scale: React.FC = () => {
  const t = useT();
  const n16 = Math.round(16 * pr(t, 3.0, 4.2));
  const n1540 = Math.round(1540 * pr(t, 5.1, 6.6));
  const ph1 = [210, 260, 230, 300, 250, 280, 220, 260];
  const ph2 = [300, 340, 280, 360, 320, 350, 290, 330];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("a/ph4.jpg")} dur={9.7} z={[1.15, 1.3]} filter="brightness(0.32) saturate(1.1)" />
      <Pattern opacity={0.06} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Kicker at={0.1}>مشروع متكامل</Kicker>
        <Up at={0.3} style={{ marginTop: 10 }}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: C.ivory, lineHeight: 1.15 }}>على مرحلتين</div>
        </Up>
      </div>
      {/* skyline bars per phase */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 640, height: 380 }}>
        {ph1.map((h, i) => (
          <Block key={`a${i}`} p={pr(t, 0.8 + i * 0.08, 1.6 + i * 0.08)} h={h} x={520 + i * 56} c={C.sand} />
        ))}
        {ph2.map((h, i) => (
          <Block key={`b${i}`} p={pr(t, 1.6 + i * 0.08, 2.4 + i * 0.08)} h={h} x={i * 56} c={C.coral} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 4, background: C.ivory }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1040, display: "flex", gap: 20, direction: "rtl" }}>
        {[
          { c: C.sand, a: "المرحلة الأولى", b: "8 أبنية · 640 شقة", at: 1.0 },
          { c: C.coral, a: "المرحلة الثانية", b: "8 أبنية · 900 شقة", at: 1.8 },
        ].map((x) => (
          <Pop key={x.a} at={x.at} style={{ flex: 1 }}>
            <div style={{ background: "rgba(251,246,238,0.08)", borderTop: `6px solid ${x.c}`, borderRadius: 16, padding: "18px 22px", ...RTL }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, color: x.c }}>{x.a}</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.ivory }}>{x.b}</div>
            </div>
          </Pop>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1260, display: "flex", gap: 20, direction: "rtl" }}>
        {[
          { n: n16, l: "مبنى", at: 3.0, icon: "building" as IconName },
          { n: n1540, l: "شقة", at: 5.1, icon: "key" as IconName },
        ].map((x) => (
          <Pop key={x.l} at={x.at} style={{ flex: 1 }}>
            <div style={{ background: C.ivory, borderRadius: 22, padding: "22px 26px", display: "flex", alignItems: "center", gap: 18, direction: "rtl" }}>
              <Icon n={x.icon} size={80} c={C.coral} />
              <div>
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 100, lineHeight: 1, color: C.navy, direction: "ltr", textAlign: "right" }}>{x.n.toLocaleString("en-US")}</div>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.coral }}>{x.l}</div>
              </div>
            </div>
          </Pop>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1530, textAlign: "center" }}>
        <Pop at={8.2} scale>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: SUNSET, borderRadius: 999, padding: "18px 44px", direction: "rtl" }}>
            <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 60, color: C.navy }}>✓ جاهز للتسليم</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 7 — luxury mall, 50+ global brands */
const Mall: React.FC = () => {
  const t = useT();
  const n = Math.round(50 * pr(t, 1.2, 3.2));
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("v_plaza.mp4")} video dur={6} z={[1.05, 1.12]} pos="50% 50%" />
      <Shade top={0.8} bot={0.92} />
      <div style={{ position: "absolute", right: 64, left: 64, bottom: 360, ...RTL }}>
        <Kicker at={0.1}>مول تجاري فاخر</Kicker>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 10, direction: "rtl" }}>
          <Pop at={0.9}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 230, lineHeight: 1, direction: "ltr" }}>
              <SunText>+{n}</SunText>
            </div>
          </Pop>
          <Up at={1.3}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 60, color: C.ivory, lineHeight: 1.25 }}>
              محلاً
              <br />
              للعلامات العالمية
            </div>
          </Up>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 8 — transit map */
const Transit: React.FC = () => {
  const t = useT();
  const line = pr(t, 0.2, 1.6, inOut);
  const stops = [
    { at: 0.2, y: 600, icon: "metro" as IconName, color: "#D7263D", title: "مترو Bayrampaşa–Maltepe", val: "2", unit: "دقيقة مشياً", walk: true },
    { at: 3.4, y: 960, icon: "tram" as IconName, color: "#2E86DE", title: "محطتا ترامواي T4", val: "0", unit: "عند المدخل", walk: false },
    { at: 6.5, y: 1320, icon: "bus" as IconName, color: "#F39C12", title: "متروبوس Edirnekapı", val: "8", unit: "دقائق مشياً", walk: true },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 40%, ${C.navy2} 0%, ${C.navy} 70%)` }}>
      <Pattern opacity={0.05} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Kicker at={0.05}>قرب وسائل النقل</Kicker>
      </div>
      {/* project node + trunk line on the right side (RTL) */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={900} y1={470} x2={900} y2={470 + 1000 * line} stroke={C.sand} strokeWidth={10} strokeLinecap="round" />
        <circle cx={900} cy={470} r={30} fill={C.coral} />
        <circle cx={900} cy={470} r={12} fill={C.ivory} />
        {stops.map((st) => {
          const p = pr(t, st.at, st.at + 0.6);
          return <circle key={st.title} cx={900} cy={st.y + 60} r={34 * p} fill={st.color} stroke={C.ivory} strokeWidth={6} />;
        })}
      </svg>
      <div style={{ position: "absolute", right: 130, top: 440, fontFamily: BODY, fontWeight: 800, fontSize: 32, color: C.sand, direction: "rtl" }}>المشروع</div>
      {stops.map((st) => {
        const p = pr(t, st.at + 0.1, st.at + 0.8);
        const n = Math.round(Number(st.val) * pr(t, st.at + 0.3, st.at + 1.1));
        return (
          <div
            key={st.title}
            style={{
              position: "absolute",
              right: 180,
              left: 60,
              top: st.y,
              opacity: p,
              transform: `translateX(${(1 - p) * -60}px)`,
              background: C.ivory,
              borderRadius: 24,
              padding: "22px 28px",
              display: "flex",
              alignItems: "center",
              gap: 22,
              direction: "rtl",
              borderRight: `14px solid ${st.color}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}
          >
            <Icon n={st.icon} size={84} c={st.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, color: C.navy, lineHeight: 1.2 }}>{st.title}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: "#6B6357", display: "flex", alignItems: "center", gap: 8 }}>
                {st.walk && <Icon n="walk" size={36} c="#6B6357" />} {st.unit}
              </div>
            </div>
            {st.val !== "0" ? (
              <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 120, lineHeight: 1, color: st.color }}>{n}</div>
            ) : (
              <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 64, color: st.color }}>T4</div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 9 — malls: minutes bar chart */
const MALLS = [
  { at: 0.2, name: "Axis Mall", min: 2 },
  { at: 2.0, name: "Forum Istanbul", min: 5 },
  { at: 4.3, name: "Zorlu Center", min: 10 },
  { at: 6.6, name: "Cevahir Mall", min: 15 },
];
const Malls: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, overflow: "hidden" }}>
        <Media src={E("v_terrace.mp4")} video dur={9.7} rate={0.65} z={[1.05, 1.15]} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(14,26,43,0.7) 0%, rgba(14,26,43,0) 40%, ${C.navy} 100%)` }} />
      </div>
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Kicker at={0.05}>مراكز التسوق</Kicker>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 820 }}>
        {MALLS.map((m) => {
          const p = pr(t, m.at, m.at + 1.0);
          const n = Math.max(1, Math.round(m.min * pr(t, m.at + 0.2, m.at + 1.0)));
          return (
            <div key={m.name} style={{ marginBottom: 40, opacity: Math.min(1, p * 3), direction: "rtl" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.ivory, direction: "ltr" }}>{m.name}</div>
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 64, color: C.sand }}>
                  {n} <span style={{ fontFamily: BODY, fontSize: 34, fontWeight: 700 }}>{m.min === 2 ? "دقيقتان" : "دقائق"}</span>
                </div>
              </div>
              <div style={{ height: 26, borderRadius: 13, background: "rgba(251,246,238,0.12)", overflow: "hidden", direction: "rtl" }}>
                <div style={{ height: "100%", width: `${(m.min / 15) * 100 * p}%`, background: SUNSET, borderRadius: 13, marginRight: 0 }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 10 — universities & hospitals */
const Edu: React.FC = () => (
  <AbsoluteFill style={{ background: C.ivory }}>
    <Pattern color={C.navy} opacity={0.05} />
    <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
      <Up at={0.05}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 76, color: C.navy, lineHeight: 1.2 }}>
          بالقرب من أبرز <SunText>الجامعات والمستشفيات</SunText>
        </div>
      </Up>
    </div>
    <div style={{ position: "absolute", left: 50, right: 50, top: 640, display: "flex", gap: 22, direction: "rtl" }}>
      {[
        { icon: "uni" as IconName, items: ["جامعة كوتش", "جامعة إستينيا", "جامعة بيروني", "جامعة بهتشه شهير"], at: 0.3 },
        { icon: "hosp" as IconName, items: ["مستشفى كوتش", "يدي كولي", "ميموريال"], at: 0.6 },
      ].map((col) => (
        <Pop key={col.icon} at={col.at} style={{ flex: 1 }}>
          <div style={{ background: C.navy, borderRadius: 26, padding: "30px 28px", minHeight: 820, ...RTL }}>
            <Icon n={col.icon} size={96} c={C.sand} />
            {col.items.map((it, i) => (
              <Pop key={it} at={col.at + 0.25 + i * 0.25}>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.ivory, marginTop: 26, borderBottom: "2px solid rgba(240,194,123,0.3)", paddingBottom: 14 }}>{it}</div>
              </Pop>
            ))}
          </div>
        </Pop>
      ))}
    </div>
  </AbsoluteFill>
);

/** 11 — lifestyle: arch windows cycling through amenities */
const LIFE: { at: number; label: string; img?: string; icon: IconName }[] = [
  { at: 2.7, label: "مسرح وسينما", icon: "cinema" },
  { at: 4.3, label: "متحف للتكنولوجيا والفنون", icon: "museum" },
  { at: 6.7, label: "مسبح وساونا وحمام تركي", img: "a/am_spa.jpg", icon: "pool" },
  { at: 9.6, label: "نادٍ رياضي", img: "a/am_gym.jpg", icon: "gym" },
  { at: 10.9, label: "مناطق ألعاب للأطفال", img: "a/am_kids.jpg", icon: "kids" },
];
const Life: React.FC = () => {
  const t = useT();
  let cur = -1;
  LIFE.forEach((l, i) => {
    if (t >= l.at) cur = i;
  });
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("v_garden.mp4")} video dur={13.2} rate={0.5} z={[1.05, 1.15]} filter={cur >= 0 ? "brightness(0.35) blur(6px)" : undefined} />
      <Shade top={0.75} bot={0.85} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 300, ...RTL }}>
        <Up at={0.1}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, lineHeight: 1.15, color: C.ivory }}>حياة عصرية</div>
        </Up>
        <Up at={0.3}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, lineHeight: 1.15 }}>
            <SunText>متكاملة</SunText>
          </div>
        </Up>
      </div>
      {LIFE.map((l, i) => {
        if (i !== cur) return null;
        const p = pr(t, l.at, l.at + 0.6, inOut);
        const d = archPath(190, 700 - 40 * p, 700, 900);
        return (
          <React.Fragment key={l.label}>
            <AbsoluteFill style={{ clipPath: `path('${d}')`, opacity: Math.min(1, p * 2) }}>
              {l.img ? (
                <Img src={E(l.img)} style={{ position: "absolute", left: 190, top: 660, width: 700, height: 940, objectFit: "cover", transform: `scale(${1.15 - 0.1 * p})` }} />
              ) : (
                <div style={{ position: "absolute", left: 190, top: 660, width: 700, height: 940, background: `linear-gradient(180deg, ${C.navy2}, ${C.coral})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n={l.icon} size={300} c={C.ivory} sw={2.2} />
                </div>
              )}
            </AbsoluteFill>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <path d={d} fill="none" stroke={C.sand} strokeWidth={6} opacity={p} />
            </svg>
            <div style={{ position: "absolute", left: 60, right: 60, top: 1640, textAlign: "center", direction: "rtl" }}>
              <Pop at={l.at + 0.1}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 16, fontFamily: HEAD, fontWeight: 800, fontSize: 58, color: C.navy, background: C.ivory, padding: "12px 30px", borderRadius: 18 }}>
                  <Icon n={l.icon} size={56} c={C.coral} /> {l.label}
                </span>
              </Pop>
            </div>
          </React.Fragment>
        );
      })}
      {/* pill index of amenities */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 560, display: "flex", gap: 10, justifyContent: "center", direction: "rtl" }}>
        {LIFE.map((l, i) => (
          <div key={l.label} style={{ width: i === cur ? 70 : 24, height: 10, borderRadius: 5, background: i <= cur ? C.coral : "rgba(251,246,238,0.3)" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 12 — call to action */
const Cta: React.FC = () => {
  const t = useT();
  const sky = pr(t, 0.2, 2.2);
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Media src={E("a/ph21.jpg")} dur={3.3} z={[1.2, 1.32]} pos="60% 50%" filter="brightness(0.55)" />
      <Shade top={0.6} bot={0.9} mid={0.2} />
      <Skyline p={sky} y={1150} opacity={0.9} />
      <div style={{ position: "absolute", right: 64, left: 64, top: 520, ...RTL }}>
        <Up at={0.1}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 104, lineHeight: 1.2, color: C.ivory }}>لا تفوّت فرصة</div>
        </Up>
        <Up at={0.35}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 104, lineHeight: 1.2 }}>
            <SunText>الاستثمار</SunText>
          </div>
        </Up>
        <Up at={0.6}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 70, lineHeight: 1.3, color: C.ivory }}>في قلب إسطنبول</div>
        </Up>
      </div>
    </AbsoluteFill>
  );
};

/** 13 — end card */
const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sp = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 90 } });
  const arch = pr(t, 0, 1.0, inOut);
  const pulse = 1 + 0.025 * Math.sin(t * Math.PI * 2.4);
  const d = archPath(140, 260, 800, 860);
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      <Pattern color={C.navy} opacity={0.06} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke={C.coral} strokeWidth={5} strokeDasharray={4000} strokeDashoffset={4000 * (1 - arch)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}>
        <Img src={E("a/logo_dark.png")} style={{ width: 620, opacity: sp, transform: `scale(${0.8 + 0.2 * sp})` }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1220, textAlign: "center" }}>
        <Pop at={0.6}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 64, color: C.navy, direction: "rtl" }}>تواصل معنا الآن</div>
        </Pop>
        <Pop at={0.9} style={{ marginTop: 30 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, padding: "30px 50px", borderRadius: 999, background: SUNSET, transform: `scale(${pulse})`, boxShadow: "0 25px 60px rgba(233,103,60,0.35)" }}>
            <svg width={60} height={60} viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="none" stroke={C.navy} strokeWidth={2} />
            </svg>
            <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 70, color: C.navy, direction: "ltr" }}>{PHONE}</span>
          </div>
        </Pop>
        <Pop at={1.4} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.coral, direction: "rtl" }}>شقق أيوب سلطان · إسطنبول</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- global overlays */
const BrandCorner: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [8, 22, s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: "rgba(251,246,238,0.95)", padding: "16px 20px 12px", borderRadius: 18, borderBottom: `5px solid ${C.coral}`, boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>
      <Img src={E("a/logo_dark.png")} style={{ width: 210, display: "block" }} />
    </div>
  );
};

/** Sunset arch wipe between scenes */
const Wipes: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = [T.citizen, T.where, T.plan, T.price, T.scale, T.mall, T.transit, T.malls, T.edu, T.life, T.cta, T.end].map((r) => s(r[0]));
  return (
    <>
      {cuts.map((c) => {
        const l = f - c;
        if (l < -8 || l > 8) return null;
        const p = interpolate(l, [-8, 8], [0, 1], cl);
        const y = interpolate(p, [0, 1], [2100, -2600], { easing: inOut });
        return (
          <svg key={c} width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id={`wg${c}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFD9A0" />
                <stop offset="0.5" stopColor={C.coral} />
                <stop offset="1" stopColor={C.navy} />
              </linearGradient>
            </defs>
            <path d={archPath(-300, y, 1680, 2600)} fill={`url(#wg${c})`} />
          </svg>
        );
      })}
    </>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.1 }}>
      <svg width="100%" height="100%">
        <filter id={`gr${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#gr${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", right: 0, bottom: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: SUNSET }} />;
};

/* ============================================================ composition */
export const Eyup: React.FC = () => {
  const music = (f: number) => interpolate(f, [0, 15, s(79.2), s(79.8), TOTAL - 40, TOTAL], [0, 0.17, 0.17, 0.4, 0.4, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Scene r={T.hook}><Hook /></Scene>
      <Scene r={T.citizen}><Citizen /></Scene>
      <Scene r={T.where}><Where /></Scene>
      <Scene r={T.plan}><Plan /></Scene>
      <Scene r={T.price}><Price /></Scene>
      <Scene r={T.scale}><Scale /></Scene>
      <Scene r={T.mall}><Mall /></Scene>
      <Scene r={T.transit}><Transit /></Scene>
      <Scene r={T.malls}><Malls /></Scene>
      <Scene r={T.edu}><Edu /></Scene>
      <Scene r={T.life}><Life /></Scene>
      <Scene r={T.cta}><Cta /></Scene>
      <Scene r={T.end}><End /></Scene>

      <Wipes />
      <Grain />
      <BrandCorner />
      <Progress />

      <Audio src={E("vo.mp3")} />
      <Audio src={E("music.mp3")} volume={music} />
    </AbsoluteFill>
  );
};
