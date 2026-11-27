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
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSansArabic";

const { fontFamily: HEAD } = loadKufi("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: BODY } = loadPlex("normal", { weights: ["500", "600", "700"], subsets: ["arabic", "latin"] });

export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const A = (n: string) => staticFile(`bagcilar/a/${n}`);
const G = (n: string) => staticFile(`bagcilar/${n}`);

/* ----------------------------------------------------------------- tokens */
const C = {
  char: "#14110F",
  char2: "#211C19",
  terra: "#9C4A2E",
  terraLight: "#C97A55",
  cream: "#F4ECE1",
  sand: "#E7CFA9",
  gold: "#E2B66B",
};
const WARM = `linear-gradient(120deg, #FFE9C7 0%, ${C.sand} 25%, ${C.gold} 55%, ${C.terraLight} 100%)`;
const PHONE = "+90 534 878 42 22";
const RTL: React.CSSProperties = { direction: "rtl", textAlign: "right" };

/**
 * One voice line (Harrison) per scene → every sentence gets its own 3D transition.
 * [lead, exact line duration]
 */
const LINES = {
  hook: [0.35, 5.49, "l1"],
  citizen: [0.3, 3.16, "l2"],
  apt: [0.3, 5.88, "l3"],
  price: [0.3, 3.16, "l4"],
  partner: [0.3, 4.83, "l5"],
  specs: [0.3, 9.72, "l6"],
  types: [0.3, 6.92, "l7"],
  amen: [0.3, 8.52, "l8"],
  loc: [0.3, 11.65, "l9"],
  sum: [0.3, 5.88, "l10"],
  end: [0.3, 2.12, "l11"],
} as const;
type Key = keyof typeof LINES;
const KEYS = Object.keys(LINES) as Key[];
const TAIL = 0.15;
const T = (() => {
  const out = {} as Record<Key, [number, number]>;
  let cur = 0;
  KEYS.forEach((k) => {
    const [lead, dur] = LINES[k];
    const len = lead + dur + (k === "end" ? 3.4 : TAIL);
    out[k] = [cur, cur + len];
    cur += len;
  });
  return out;
})();
const LD = (k: Key) => LINES[k][0];
export const TOTAL = s(T.end[1]);
const OVER = 14; // frames of 3D transition overlap

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.7, 0, 0.3, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / FPS;
const pr = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...cl, easing: e });

/* ------------------------------------------------------------- primitives */

/** 3D word drop: letters fall in from depth with rotation */
const Drop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  return (
    <div style={{ perspective: 1200, ...style }}>
      <div
        style={{
          transform: `translateZ(${(1 - sp) * -900}px) rotateX(${(1 - sp) * 70}deg)`,
          transformOrigin: "50% 100%",
          opacity: Math.min(1, sp * 1.6),
          filter: `blur(${(1 - Math.min(1, sp)) * 8}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number }> = ({ at, children, style, dist = 80 }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 15, stiffness: 140, mass: 0.7 } });
  return <div style={{ ...style, opacity: Math.min(1, sp * 1.5), transform: `translateY(${(1 - sp) * dist}px) scale(${0.85 + 0.15 * sp})` }}>{children}</div>;
};

const Warm: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: WARM, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.55))", ...style }}>{children}</span>
);

/** Extruded 3D number (stacked layers) */
const Extrude: React.FC<{ children: React.ReactNode; size: number; depth?: number; color?: string; side?: string }> = ({ children, size, depth = 14, color = C.cream, side = C.terra }) => (
  <div style={{ position: "relative", fontFamily: HEAD, fontWeight: 900, fontSize: size, lineHeight: 1, direction: "ltr" }}>
    {Array.from({ length: depth }).map((_, i) => (
      <div key={i} style={{ position: i === 0 ? "relative" : "absolute", left: i === 0 ? 0 : i * 1.2, top: i === 0 ? 0 : i * 1.6, color: i === 0 ? color : side, zIndex: depth - i, opacity: i === 0 ? 1 : 0.95 - i * 0.03 }}>
        {i === 0 ? <span style={{ background: WARM, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</span> : children}
      </div>
    ))}
  </div>
);

const Media: React.FC<{ src: string; video?: boolean; rate?: number; start?: number; dur: number; z?: [number, number]; pos?: string; filter?: string; x?: [number, number]; rot?: [number, number] }> = ({
  src,
  video,
  rate = 1,
  start = 0,
  dur,
  z = [1.1, 1.25],
  pos = "center",
  filter,
  x = [0, 0],
  rot = [0, 0],
}) => {
  const t = useT();
  const p = interpolate(t, [0, dur], [0, 1], { ...cl, easing: Easing.inOut(Easing.sin) });
  const st: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    filter,
    transform: `scale(${z[0] + (z[1] - z[0]) * p}) translateX(${x[0] + (x[1] - x[0]) * p}%) rotate(${rot[0] + (rot[1] - rot[0]) * p}deg)`,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {video ? <OffthreadVideo src={src} muted playbackRate={rate} startFrom={s(start)} style={st} /> : <Img src={src} style={st} />}
    </AbsoluteFill>
  );
};

const Shade: React.FC<{ top?: number; bot?: number }> = ({ top = 0.75, bot = 0.92 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(20,17,15,${top}) 0%, rgba(20,17,15,0) 30%, rgba(20,17,15,0) 50%, rgba(20,17,15,${bot}) 100%)` }} />
);

const Tag: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const t = useT();
  const w = pr(t, at, at + 0.6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, direction: "rtl", opacity: w }}>
      <div style={{ width: 70 * w, height: 5, background: WARM, borderRadius: 3 }} />
      <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.sand }}>{children}</span>
    </div>
  );
};

/** Floating 3D card (tilted glass panel) */
const Card3D: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; ry?: number; rx?: number }> = ({ at, children, style, ry = -18, rx = 8 }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 16, stiffness: 110 } });
  const sway = Math.sin(t * 1.4) * 3;
  return (
    <div style={{ perspective: 1600, ...style }}>
      <div
        style={{
          transform: `translateZ(${(1 - sp) * -700}px) rotateY(${ry * (1 - sp) + sway}deg) rotateX(${rx * (1 - sp)}deg)`,
          opacity: Math.min(1, sp * 1.4),
          background: "linear-gradient(150deg, rgba(33,28,25,0.88), rgba(20,17,15,0.75))",
          border: "2px solid rgba(231,207,169,0.45)",
          borderRadius: 30,
          boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
          backdropFilter: "blur(16px)",
          padding: "26px 30px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- icons */
type IconName = "pool" | "gym" | "sauna" | "kids" | "tree" | "metro" | "bag" | "mall" | "road" | "building" | "key" | "shop" | "pass" | "hand";
const Icon: React.FC<{ n: IconName; size?: number; c?: string; sw?: number }> = ({ n, size = 64, c = C.sand, sw = 3 }) => {
  const p = { fill: "none", stroke: c, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const m: Record<IconName, React.ReactNode> = {
    pool: (<><path d="M6 44c6-4 10-4 16 0s10 4 16 0 10-4 16 0M6 54c6-4 10-4 16 0s10 4 16 0 10-4 16 0" {...p} /><path d="M20 38V12a5 5 0 0 1 10 0M40 38V12a5 5 0 0 1 10 0M20 22h20M20 32h20" {...p} /></>),
    gym: (<><path d="M14 22v20M8 26v12M50 22v20M56 26v12M14 32h36" {...p} /></>),
    sauna: (<><path d="M8 52h48M12 52V28h40v24" {...p} /><path d="M22 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8M42 20c0-4 4-4 4-8" {...p} /></>),
    kids: (<><circle cx="22" cy="14" r="6" {...p} /><circle cx="44" cy="18" r="5" {...p} /><path d="M22 20v18l-6 16M22 38l6 16M12 28h20M44 23v14l-5 14M44 37l5 14" {...p} /></>),
    tree: (<><path d="M32 58V36M32 36l-10-8M32 40l10-8" {...p} /><circle cx="32" cy="22" r="16" {...p} /></>),
    metro: (<><rect x="14" y="8" width="36" height="38" rx="8" {...p} /><path d="M14 30h36M22 46l-6 10M42 46l6 10" {...p} /></>),
    bag: (<><path d="M12 22h40l-4 34H16z" {...p} /><path d="M24 22v-6a8 8 0 0 1 16 0v6" {...p} /></>),
    mall: (<><path d="M8 24l4-14h40l4 14M8 24h48v6a8 8 0 0 1-16 0 8 8 0 0 1-16 0 8 8 0 0 1-16 0zM12 34v22h40V34M26 56V42h12v14" {...p} /></>),
    road: (<><path d="M22 6L10 58M42 6l12 52M32 10v8M32 26v8M32 42v8" {...p} /></>),
    building: (<><rect x="14" y="8" width="36" height="50" {...p} /><path d="M22 18h6M36 18h6M22 28h6M36 28h6M22 38h6M36 38h6M28 58V48h8v10" {...p} /></>),
    key: (<><circle cx="20" cy="32" r="12" {...p} /><path d="M32 32h26M50 32v10M58 32v6" {...p} /></>),
    shop: (<><path d="M8 24l4-14h40l4 14M8 24h48M12 30v26h40V30M26 56V42h12v14" {...p} /></>),
    pass: (<><rect x="14" y="6" width="36" height="52" rx="5" {...p} /><circle cx="32" cy="28" r="9" {...p} /><path d="M23 28h18M32 19c-4 5-4 13 0 18M32 19c4 5 4 13 0 18M22 46h20" {...p} /></>),
    hand: (<><path d="M6 36l12-10h12l8 6h10M6 36l10 12h20l20-14-4-4-14 6" {...p} /><path d="M30 32h-8" {...p} /></>),
  };
  return <svg width={size} height={size} viewBox="0 0 64 64">{m[n]}</svg>;
};

/* -------------------------------------------------- 3D scene transitions */
type Tr = "cubeY" | "cubeX" | "push" | "flip";
const TR: Record<Key, Tr> = {
  hook: "push",
  citizen: "cubeY",
  apt: "cubeX",
  price: "flip",
  partner: "cubeY",
  specs: "push",
  types: "cubeX",
  amen: "cubeY",
  loc: "flip",
  sum: "cubeX",
  end: "push",
};

/** Transform for a scene face: phase in [-1..0] entering, [0..1] leaving */
const faceTransform = (type: Tr, ph: number): React.CSSProperties => {
  const a = ph * 90;
  switch (type) {
    case "cubeY":
      return { transform: `translateZ(-540px) rotateY(${-a}deg) translateZ(540px)`, filter: `blur(${Math.abs(ph) * 10}px) brightness(${1 - Math.abs(ph) * 0.5})` };
    case "cubeX":
      return { transform: `translateZ(-960px) rotateX(${a}deg) translateZ(960px)`, filter: `blur(${Math.abs(ph) * 10}px) brightness(${1 - Math.abs(ph) * 0.5})` };
    case "flip":
      return { transform: `rotateY(${ph * 100}deg) scale(${1 - Math.abs(ph) * 0.25})`, backfaceVisibility: "hidden", filter: `brightness(${1 - Math.abs(ph) * 0.6})` };
    case "push":
    default:
      return {
        transform: ph < 0 ? `translateZ(${ph * -1400}px)` : `translateZ(${ph * -900}px)`,
        opacity: ph < 0 ? 1 + ph * 0.0 : 1 - ph,
        filter: `blur(${Math.abs(ph) * 14}px)`,
      };
  }
};

const Scene: React.FC<{ k: Key; children: React.ReactNode }> = ({ k, children }) => {
  const from = s(T[k][0]);
  const len = s(T[k][1]) - from;
  const idx = KEYS.indexOf(k);
  const next = KEYS[idx + 1];
  return (
    <Sequence from={from} durationInFrames={len + (next ? OVER : 0)} premountFor={40}>
      <Face len={len} inType={TR[k]} outType={next ? TR[next] : "push"} first={idx === 0} last={!next}>
        {children}
      </Face>
    </Sequence>
  );
};

const Face: React.FC<{ len: number; inType: Tr; outType: Tr; first: boolean; last: boolean; children: React.ReactNode }> = ({ len, inType, outType, first, last, children }) => {
  const f = useCurrentFrame();
  const pin = first ? 1 : interpolate(f, [0, OVER], [0, 1], { ...cl, easing: inOut });
  const pout = last ? 0 : interpolate(f, [len, len + OVER], [0, 1], { ...cl, easing: inOut });
  const ph = pout > 0 ? pout : pin - 1;
  const type = pout > 0 ? outType : inType;
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 50%" }}>
      <AbsoluteFill style={{ transformStyle: "preserve-3d", ...faceTransform(type, ph), zIndex: pout > 0 ? 0 : 1 }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================= SCENES */

const Hook: React.FC = () => {
  const L = LD("hook");
  const t = useT();
  const tag = t < 4.2 ? "قيد الإنشاء" : "✓ المشروع المكتمل";
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={G("v_transform.mp4")} video dur={6} rate={1.0} z={[1.05, 1.2]} rot={[-1.5, 1]} />
      <Shade top={0.7} bot={0.95} />
      <div style={{ position: "absolute", right: 60, top: 300, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: t < 4.2 ? C.cream : C.char, background: t < 4.2 ? "rgba(20,17,15,0.65)" : WARM, border: `2px solid ${C.sand}`, borderRadius: 999, padding: "8px 24px", direction: "rtl" }}>
        {tag}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 380, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, lineHeight: 1.35, color: C.cream }}>فرصة سكنية</div>
        </Drop>
        <Drop at={L + 0.5}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, lineHeight: 1.35 }}>
            <Warm>واستثمارية مميزة</Warm>
          </div>
        </Drop>
        <Pop at={L + 3.1} style={{ marginTop: 16 }}>
          <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 54, color: C.char, background: C.cream, padding: "8px 26px", borderRadius: 16 }}>في قلب غونشلي · إسطنبول</span>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const Citizen: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const L = LD("citizen");
  const spin = interpolate(t, [L, L + 1.4], [-200, 0], { ...cl, easing: ease });
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={A("ext1.jpg")} dur={3.5} z={[1.2, 1.35]} filter="brightness(0.45) blur(3px)" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1600 }}>
        <div style={{ transform: `rotateY(${spin}deg) rotateX(${Math.sin(t * 1.3) * 6}deg)`, transformStyle: "preserve-3d" }}>
          <div style={{ width: 560, height: 760, borderRadius: 40, background: `linear-gradient(160deg, ${C.terra}, #6E2E1A)`, boxShadow: "0 60px 120px rgba(0,0,0,0.6), inset 0 0 0 6px rgba(231,207,169,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <Icon n="pass" size={240} c={C.gold} sw={2.4} />
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 64, color: C.cream, textAlign: "center", lineHeight: 1.35 }}>
              الجنسية
              <br />
              التركية
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: C.cream, lineHeight: 1.4 }}>
            مع إمكانية <Warm>الحصول على الجنسية</Warm>
          </div>
        </Drop>
      </div>
    </AbsoluteFill>
  );
};

const Apt: React.FC = () => {
  const t = useT();
  const L = LD("apt");
  const tilt = interpolate(t, [L, L + 1.5], [80, 48], { ...cl, easing: ease });
  const rz = interpolate(t, [L, 6.3], [-25, 8], cl);
  const rise = pr(t, L, L + 1.3);
  const area = Math.round(100 * pr(t, L + 2.6, L + 4.3, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${C.char2} 0%, ${C.char} 70%)` }}>
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 30%" }}>
        <div style={{ position: "absolute", left: 90, top: 700, width: 900, height: 590, transformStyle: "preserve-3d", transform: `rotateX(${tilt}deg) rotateZ(${rz}deg) translateZ(${(1 - rise) * -600}px)` }}>
          <div style={{ position: "absolute", inset: 0, transform: "translateZ(-30px)", background: "rgba(0,0,0,0.6)", filter: "blur(30px)" }} />
          <Img src={A("plan.png")} style={{ width: "100%", height: "100%", borderRadius: 12, boxShadow: `0 0 0 6px ${C.sand}` }} />
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 92, color: C.cream, lineHeight: 1.3 }}>
            شقتان <span style={{ direction: "ltr", unicodeBidi: "isolate" }}><Warm>2+1</Warm></span>
          </div>
        </Drop>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 330, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 24, direction: "rtl" }}>
        <Pop at={L + 2.5}>
          <Extrude size={210}>{area}</Extrude>
        </Pop>
        <Pop at={L + 2.7}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 56, color: C.sand, lineHeight: 1.4, paddingBottom: 20 }}>
            م²
            <br />
            <span style={{ fontFamily: BODY, fontSize: 38, color: C.cream }}>لكل شقة</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const Price: React.FC = () => {
  const t = useT();
  const L = LD("price");
  const v = Math.round(480000 * pr(t, L, L + 1.8, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={G("v_living.mp4")} video dur={3.6} rate={0.7} z={[1.05, 1.15]} filter="brightness(0.5)" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1400 }}>
        <div style={{ transform: `rotateX(${Math.sin(t * 2) * 6}deg) rotateY(${Math.cos(t * 1.6) * 8}deg)`, textAlign: "center" }}>
          <Pop at={L - 0.1}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.sand, marginBottom: 10 }}>بسعر</div>
          </Pop>
          <Pop at={L}>
            <Extrude size={180} depth={18}>{`${v.toLocaleString("en-US")}$`}</Extrude>
          </Pop>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Partner: React.FC = () => {
  const t = useT();
  const L = LD("partner");
  const slide = pr(t, L + 1.2, L + 2.2, inOut);
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={A("ext2.jpg")} dur={5.3} z={[1.1, 1.3]} x={[2, -3]} />
      <Shade top={0.8} bot={0.9} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 70, color: C.cream, lineHeight: 1.4 }}>
            مشروع <Warm>مميّز</Warm>
          </div>
        </Drop>
      </div>
      <Card3D at={L + 1.25} style={{ position: "absolute", left: 50, right: 50, bottom: 360 }} ry={-30}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, direction: "rtl", transform: `translateX(${(1 - slide) * 40}px)` }}>
          <div style={{ width: 130, height: 130, borderRadius: 30, background: WARM, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n="hand" size={96} c={C.char} sw={3.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.sand }}>بشراكة مع</div>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 70, color: C.cream, lineHeight: 1.35 }}>بلدية باغجلار</div>
            <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: C.sand, direction: "ltr", textAlign: "right" }}>Bağcılar Belediyesi</div>
          </div>
        </div>
      </Card3D>
    </AbsoluteFill>
  );
};

const Specs: React.FC = () => {
  const t = useT();
  const L = LD("specs");
  const items: { at: number; n: number; suf?: string; label: string; icon: IconName }[] = [
    { at: L + 1.1, n: 16000, suf: " م²", label: "مساحة المشروع", icon: "tree" },
    { at: L + 3.25, n: 6, label: "أبنية", icon: "building" },
    { at: L + 4.75, n: 619, label: "شقة سكنية", icon: "key" },
    { at: L + 7.4, n: 19, label: "وحدة تجارية", icon: "shop" },
  ];
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={G("v_orbit.mp4")} video dur={10.2} rate={0.62} z={[1.05, 1.18]} />
      <Shade top={0.75} bot={0.35} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Tag at={L}>مواصفات المشروع</Tag>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 420, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, direction: "rtl" }}>
        {items.map((it, i) => {
          const v = Math.round(it.n * pr(t, it.at, it.at + 1.2, Easing.out(Easing.cubic)));
          return (
            <Card3D key={it.label} at={it.at} ry={i % 2 ? 28 : -28} rx={14}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, direction: "rtl" }}>
                <Icon n={it.icon} size={64} />
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: it.n > 999 ? 76 : 96, lineHeight: 1.15, direction: "ltr" }}>
                  <Warm>{v.toLocaleString("en-US")}</Warm>
                  {it.suf && <span style={{ fontSize: 40, color: C.sand }}>{it.suf}</span>}
                </div>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.cream }}>{it.label}</div>
              </div>
            </Card3D>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 3D carousel of unit types */
const TYPES = [
  { label: "1+1", img: "IMG_4626.jpg", at: 0.0 },
  { label: "2+1", img: "IMG_4625.jpg", at: 0.0 },
  { label: "3+1", img: "IMG_4630.jpg", at: 2.5 },
  { label: "بحديقة", img: "ext8.jpg", at: 4.4 },
  { label: "دوبلكس", img: "ext3.jpg", at: 5.7 },
];
const Types: React.FC = () => {
  const t = useT();
  const L = LD("types");
  const n = TYPES.length;
  // carousel angle follows the voice
  const steps = [L, L + 1.2, L + 2.5, L + 4.4, L + 5.7];
  let target = 0;
  steps.forEach((st, i) => {
    target += pr(t, st, st + 0.7, inOut) * (i === 0 ? 0 : 1);
  });
  const ang = -target * (360 / n);
  const R = 640;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.char2} 0%, ${C.char} 75%)` }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 80, color: C.cream, lineHeight: 1.35 }}>
            خيارات <Warm>متنوعة</Warm>
          </div>
        </Drop>
      </div>
      <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: 540, top: 1000, transformStyle: "preserve-3d", transform: `translateZ(-${R}px) rotateX(-6deg) rotateY(${ang}deg)` }}>
          {TYPES.map((ty, i) => {
            const a = (360 / n) * i;
            const front = Math.round(target) % n === i;
            return (
              <div
                key={ty.label}
                style={{
                  position: "absolute",
                  left: -310,
                  top: -420,
                  width: 620,
                  height: 840,
                  transform: `rotateY(${a}deg) translateZ(${R}px)`,
                  borderRadius: 30,
                  overflow: "hidden",
                  border: `3px solid ${front ? C.gold : "rgba(231,207,169,0.35)"}`,
                  boxShadow: front ? `0 0 70px rgba(226,182,107,0.45)` : "none",
                  backfaceVisibility: "hidden",
                }}
              >
                <Img src={A(ty.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 200, background: "linear-gradient(180deg, transparent, rgba(20,17,15,0.92))" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", fontFamily: HEAD, fontWeight: 900, fontSize: 96, direction: "ltr" }}>
                  <Warm>{ty.label}</Warm>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** amenities: rotating 3D cube whose faces are the amenities */
const AMEN: { at: number; label: string; icon: IconName; img: string }[] = [
  { at: 0.0, label: "حدائق خضراء", icon: "tree", img: "ext7.jpg" },
  { at: 1.26, label: "مسبح داخلي", icon: "pool", img: "" },
  { at: 2.99, label: "نادٍ رياضي", icon: "gym", img: "" },
  { at: 4.39, label: "ساونا وحمام تركي", icon: "sauna", img: "" },
  { at: 6.39, label: "مناطق للأطفال والعائلات", icon: "kids", img: "ext9.jpg" },
];
const Amen: React.FC = () => {
  const t = useT();
  const L = LD("amen");
  let step = 0;
  AMEN.forEach((a, i) => {
    if (i > 0) step += pr(t, L + a.at - 0.15, L + a.at + 0.45, inOut);
  });
  const cur = Math.round(step);
  const ang = step * 90;
  const S = 760;
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Media src={A("ext6.jpg")} dur={8.9} z={[1.25, 1.4]} filter="brightness(0.3) blur(8px)" />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={L}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 80, color: C.cream, lineHeight: 1.35 }}>
            مرافق <Warm>متكاملة</Warm>
          </div>
        </Drop>
      </div>
      <AbsoluteFill style={{ perspective: 2400 }}>
        <div style={{ position: "absolute", left: 540 - S / 2, top: 1010 - S / 2, width: S, height: S, transformStyle: "preserve-3d", transform: `translateZ(-${S / 2}px) rotateX(-8deg) rotateY(${-ang}deg)` }}>
          {AMEN.slice(0, 4).map((a, i) => {
            const show = AMEN[cur % 5 === 4 && i === 0 ? 4 : i];
            const item = i === 0 && cur >= 4 ? AMEN[4] : a;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotateY(${i * 90}deg) translateZ(${S / 2}px)`,
                  borderRadius: 34,
                  overflow: "hidden",
                  background: item.img ? C.char : `linear-gradient(160deg, ${C.terra}, #5A2414)`,
                  border: `4px solid ${C.sand}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 30,
                }}
              >
                {item.img && <Img src={A(item.img)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />}
                <div style={{ position: "relative", width: 230, height: 230, borderRadius: 999, background: "rgba(20,17,15,0.7)", border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n={item.icon} size={150} c={C.gold} sw={2.6} />
                </div>
                <div style={{ position: "relative", fontFamily: HEAD, fontWeight: 900, fontSize: item.label.length > 14 ? 54 : 66, color: C.cream, textAlign: "center", textShadow: "0 6px 24px rgba(0,0,0,0.8)", padding: "0 30px", lineHeight: 1.4 }}>
                  {item.label}
                </div>
                {show ? null : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Location: tilted 3D map plane with routes */
const DEST: { at: number; x: number; y: number; label: string; min: string; icon: IconName }[] = [
  { at: 0.0, x: 300, y: 330, label: "المترو", min: "5", icon: "metro" },
  { at: 1.99, x: 760, y: 260, label: "212 Outlet", min: "7", icon: "bag" },
  { at: 5.04, x: 820, y: 700, label: "Mall of Istanbul", min: "12", icon: "mall" },
  { at: 8.59, x: 200, y: 760, label: "طريق TEM", min: "", icon: "road" },
];
const Loc: React.FC = () => {
  const t = useT();
  const L = LD("loc");
  const tilt = interpolate(t, [0, 1.2], [0, 52], { ...cl, easing: ease });
  const rz = interpolate(t, [0, 12], [-10, 12], cl);
  const node = { x: 500, y: 500 };
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Drop at={0.1}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 76, color: C.cream, lineHeight: 1.35 }}>
            موقع <Warm>استراتيجي</Warm>
          </div>
        </Drop>
      </div>
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 20%" }}>
        <div style={{ position: "absolute", left: 40, top: 520, width: 1000, height: 1000, transformStyle: "preserve-3d", transform: `rotateX(${tilt}deg) rotateZ(${rz}deg)` }}>
          {/* aerial render as map base */}
          <Img src={A("ext5.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 30, filter: "brightness(0.55) saturate(0.8)" }} />
          <svg width={1000} height={1000} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <g key={i} stroke={C.sand} strokeOpacity={0.12}>
                <line x1={i * 100} y1={0} x2={i * 100} y2={1000} />
                <line x1={0} y1={i * 100} x2={1000} y2={i * 100} />
              </g>
            ))}
            {DEST.map((d) => {
              const p = pr(t, L + d.at, L + d.at + 1.0, inOut);
              return <line key={d.label} x1={node.x} y1={node.y} x2={node.x + (d.x - node.x) * p} y2={node.y + (d.y - node.y) * p} stroke={C.gold} strokeWidth={10} strokeLinecap="round" strokeDasharray="2 18" />;
            })}
            <circle cx={node.x} cy={node.y} r={30 + ((t * 0.9) % 1) * 90} fill="none" stroke={C.gold} strokeWidth={6} opacity={1 - ((t * 0.9) % 1)} />
            <circle cx={node.x} cy={node.y} r={28} fill={C.terra} stroke={C.cream} strokeWidth={6} />
          </svg>
        </div>
      </AbsoluteFill>
      {/* upright pins (billboards) */}
      {DEST.map((d, i) => (
        <Pop key={d.label} at={L + d.at + 0.4} style={{ position: "absolute", left: 50, right: 50, top: 1240 + i * 128 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(33,28,25,0.9)", border: `2px solid rgba(231,207,169,0.5)`, borderRadius: 24, padding: "12px 24px", direction: "rtl" }}>
            <Icon n={d.icon} size={56} />
            <span style={{ flex: 1, fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: C.cream, unicodeBidi: "plaintext", textAlign: "right" }}>{d.label}</span>
            {d.min ? (
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: C.gold }}>
                {d.min} <span style={{ fontFamily: BODY, fontSize: 28, color: C.sand }}>دقائق</span>
              </span>
            ) : (
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.sand }}>سهولة الوصول</span>
            )}
          </div>
        </Pop>
      ))}
    </AbsoluteFill>
  );
};

/** Summary: 3D wall of panels */
const Sum: React.FC = () => {
  const t = useT();
  const L = LD("sum");
  const rows = [
    { at: L, txt: "موقع مركزي", img: "ext5.jpg" },
    { at: L + 1.3, txt: "خدمات متكاملة", img: "ext8.jpg" },
    { at: L + 3.0, txt: "للسكن والاستثمار", img: "ext1.jpg" },
  ];
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${interpolate(t, [0, 6.3], [-14, 10], cl)}deg)` }}>
          {rows.map((r, i) => {
            const p = pr(t, r.at, r.at + 0.8);
            return (
              <div
                key={r.txt}
                style={{
                  position: "absolute",
                  left: 60,
                  right: 60,
                  top: 330 + i * 470,
                  height: 430,
                  borderRadius: 34,
                  overflow: "hidden",
                  border: `3px solid ${C.sand}`,
                  transform: `translateZ(${(1 - p) * -900}px) rotateX(${(1 - p) * -40}deg)`,
                  opacity: p,
                }}
              >
                <Img src={A(r.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 - 0.1 * p})` }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(20,17,15,0.1), rgba(20,17,15,0.85))" }} />
                <div style={{ position: "absolute", right: 36, bottom: 30, fontFamily: HEAD, fontWeight: 900, fontSize: 70, color: C.cream, direction: "rtl" }}>{r.txt}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sp = spring({ frame: f - 4, fps: FPS, config: { damping: 14, stiffness: 90 } });
  const pulse = 1 + 0.03 * Math.sin(t * Math.PI * 2.2);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${C.char2} 0%, ${C.char} 70%)` }}>
      <Media src={A("ext5.jpg")} dur={5.8} z={[1.3, 1.45]} filter="brightness(0.25) blur(10px)" />
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 430, display: "flex", justifyContent: "center", transform: `rotateY(${(1 - sp) * 90}deg)` }}>
          <div style={{ background: C.cream, borderRadius: 40, padding: "44px 50px", boxShadow: "0 50px 120px rgba(0,0,0,0.6)" }}>
            <Img src={A("logo_dark.png")} style={{ width: 520, display: "block" }} />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1170, textAlign: "center" }}>
        <Pop at={LD("end")}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 72, color: C.cream, direction: "rtl", lineHeight: 1.4 }}>
            تواصل <Warm>الآن</Warm>
          </div>
        </Pop>
        <Pop at={LD("end") + 0.3} style={{ marginTop: 26 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, background: WARM, padding: "28px 48px", borderRadius: 999, transform: `scale(${pulse})`, boxShadow: "0 25px 70px rgba(226,182,107,0.4)" }}>
            <svg width={60} height={60} viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="none" stroke={C.char} strokeWidth={2} />
            </svg>
            <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 66, color: C.char, direction: "ltr" }}>{PHONE}</span>
          </div>
        </Pop>
        <Pop at={LD("end") + 0.8} style={{ marginTop: 36 }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.sand, direction: "rtl" }}>
            شقتان <bdi dir="ltr">2+1</bdi> · 100 م² · غونشلي، إسطنبول
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- global overlays */
const BrandCorner: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [8, 20, s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: "rgba(244,236,225,0.96)", padding: "14px 18px 10px", borderRadius: 20, borderBottom: `5px solid ${C.terra}`, boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
      <Img src={A("logo_dark.png")} style={{ width: 210, display: "block" }} />
    </div>
  );
};

const Counter: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t >= T.end[0]) return null;
  const idx = KEYS.findIndex((k) => t >= T[k][0] && t < T[k][1]);
  const n = KEYS.length - 1;
  return (
    <div style={{ position: "absolute", right: 44, top: 70, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 34, color: C.cream, direction: "ltr" }}>
        {String(idx + 1).padStart(2, "0")}
        <span style={{ color: C.sand, fontSize: 24 }}> / {String(n).padStart(2, "0")}</span>
      </div>
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.08 }}>
      <svg width="100%" height="100%">
        <filter id={`bg${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#bg${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", right: 0, bottom: 0, height: 7, width: `${(f / TOTAL) * 100}%`, background: WARM }} />;
};

/* ============================================================ composition */
const SCENES: Record<Key, React.FC> = { hook: Hook, citizen: Citizen, apt: Apt, price: Price, partner: Partner, specs: Specs, types: Types, amen: Amen, loc: Loc, sum: Sum, end: End };

export const Bagcilar: React.FC = () => {
  const music = (f: number) => interpolate(f, [0, 12, s(T.end[0] + 2.5), s(T.end[0] + 3.0), TOTAL - 40, TOTAL], [0, 0.2, 0.2, 0.42, 0.42, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.char }}>
      {KEYS.map((k) => {
        const Comp = SCENES[k];
        return (
          <Scene key={k} k={k}>
            <Comp />
          </Scene>
        );
      })}
      <Grain />
      <BrandCorner />
      <Counter />
      <Progress />
      {KEYS.map((k) => (
        <Sequence key={`a-${k}`} from={s(T[k][0] + LINES[k][0])} durationInFrames={s(LINES[k][1] + 0.4)}>
          <Audio src={G(`vo/${LINES[k][2]}.mp3`)} />
        </Sequence>
      ))}
      <Audio src={G("music.mp3")} volume={music} playbackRate={0.955} />
    </AbsoluteFill>
  );
};
