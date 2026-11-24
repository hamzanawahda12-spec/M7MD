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
import { loadFont as loadMessiri } from "@remotion/google-fonts/ElMessiri";
import { loadFont as loadTajawal } from "@remotion/google-fonts/Tajawal";

const { fontFamily: DISPLAY } = loadMessiri("normal", { weights: ["600", "700"], subsets: ["arabic", "latin", "latin-ext"] });
const { fontFamily: BODY } = loadTajawal("normal", { weights: ["500", "700", "800", "900"], subsets: ["arabic", "latin"] });

export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const A = (n: string) => staticFile(`gunesli/a/${n}`);
const G = (n: string) => staticFile(`gunesli/${n}`);

/* ----------------------------------------------------------------- tokens */
const C = {
  night: "#071226",
  sapphire: "#0A1A33",
  sapphire2: "#14294D",
  gold: "#D8B677",
  goldLight: "#F2DDB0",
  pearl: "#F6F2EA",
  lake: "#39C3D6",
  ink: "#0B1020",
};
const GOLD = `linear-gradient(120deg, #FFF1CF 0%, ${C.goldLight} 22%, ${C.gold} 55%, #A9823F 100%)`;
const GLASS: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
  border: "1.5px solid rgba(242,221,176,0.45)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
};
const PHONE = "+90 534 878 42 22";

/** Scene timing (seconds), synced to the Harrison Arabic voiceover */
const T = {
  hook: [0, 7.2],
  citizen: [7.2, 13.4],
  plan: [13.4, 19.6],
  listing: [19.6, 26.6],
  build: [26.6, 36.6],
  stats: [36.6, 49.6],
  life: [49.6, 60.9],
  amen: [60.9, 71.4],
  map: [71.4, 83.4],
  invest: [83.4, 90.5],
  deliver: [90.5, 93.4],
  end: [93.4, 100],
} as const;
export const TOTAL = s(100);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / FPS;
const pr = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...cl, easing: e });
const RTL: React.CSSProperties = { direction: "rtl", textAlign: "right" };

/* ------------------------------------------------------------- primitives */

/** Masked rise with a little blur — premium title reveal */
const Rise: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; d?: number }> = ({ at, children, style, d = 0.8 }) => {
  const t = useT();
  const p = pr(t, at, at + d);
  return (
    <div style={{ overflow: "hidden", paddingTop: 18, paddingBottom: 10, marginTop: -18, marginBottom: -10, ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, filter: `blur(${(1 - p) * 10}px)`, opacity: p > 0 ? 0.3 + 0.7 * p : 0 }}>{children}</div>
    </div>
  );
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number; scale?: boolean }> = ({ at, children, style, dist = 60, scale }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 16, stiffness: 130, mass: 0.8 } });
  return (
    <div style={{ ...style, opacity: Math.min(1, sp * 1.5), transform: scale ? `scale(${0.6 + 0.4 * sp})` : `translateY(${(1 - sp) * dist}px)`, filter: `blur(${(1 - Math.min(sp, 1)) * 6}px)` }}>
      {children}
    </div>
  );
};

const GoldText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: GOLD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.45))", ...style }}>{children}</span>
);

const Media: React.FC<{ src: string; video?: boolean; rate?: number; start?: number; dur: number; z?: [number, number]; pos?: string; filter?: string; x?: [number, number]; loop?: boolean }> = ({
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

const Shade: React.FC<{ top?: number; bot?: number; mid?: number }> = ({ top = 0.75, bot = 0.92, mid = 0 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(7,18,38,${top}) 0%, rgba(7,18,38,${mid}) 30%, rgba(7,18,38,${mid}) 52%, rgba(7,18,38,${bot}) 100%)` }} />
);

/** Section header: thin gold rule + small caps label */
const Label: React.FC<{ at?: number; children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ at = 0.1, children, color = C.goldLight, style }) => {
  const t = useT();
  const w = pr(t, at, at + 0.8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, direction: "rtl", ...style }}>
      <div style={{ width: 70 * w, height: 3, background: GOLD }} />
      <Rise at={at + 0.1}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color }}>{children}</div>
      </Rise>
    </div>
  );
};

/** Floating gold dust */
const Dust: React.FC<{ n?: number; opacity?: number }> = ({ n = 26, opacity = 0.8 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {Array.from({ length: n }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        const x = (r * 1080 + Math.sin((f + i * 40) / 60) * 30) % 1080;
        const y = (1920 - ((f * (0.6 + r) + i * 137) % 2100)) ;
        const size = 3 + (i % 4) * 2;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size, background: C.goldLight, boxShadow: `0 0 ${size * 3}px ${C.gold}`, opacity: 0.35 + (i % 3) * 0.2 }} />;
      })}
    </AbsoluteFill>
  );
};

/** Circular iris reveal (with gold ring) */
const Iris: React.FC<{ p: number; cx?: number; cy?: number; children: React.ReactNode }> = ({ p, cx = 540, cy = 960, children }) => {
  const r = interpolate(p, [0, 1], [0, 1250]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
      {p > 0 && p < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.gold} strokeWidth={6} opacity={1 - p * 0.6} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------- icons */
type IconName = "pool" | "gym" | "sauna" | "family" | "metro" | "train" | "road" | "trend" | "key" | "tree" | "lake" | "kids" | "building" | "shop" | "calendar";
const Icon: React.FC<{ n: IconName; size?: number; c?: string; sw?: number }> = ({ n, size = 64, c = C.goldLight, sw = 3 }) => {
  const p = { fill: "none", stroke: c, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const m: Record<IconName, React.ReactNode> = {
    pool: (<><path d="M6 44c6-4 10-4 16 0s10 4 16 0 10-4 16 0M6 54c6-4 10-4 16 0s10 4 16 0 10-4 16 0" {...p} /><path d="M20 38V12a5 5 0 0 1 10 0M40 38V12a5 5 0 0 1 10 0M20 22h20M20 32h20" {...p} /></>),
    gym: (<><path d="M14 22v20M8 26v12M50 22v20M56 26v12M14 32h36" {...p} /></>),
    sauna: (<><path d="M8 52h48M12 52V28h40v24" {...p} /><path d="M22 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8M42 20c0-4 4-4 4-8" {...p} /></>),
    family: (<><circle cx="20" cy="14" r="6" {...p} /><circle cx="44" cy="14" r="6" {...p} /><circle cx="32" cy="32" r="4" {...p} /><path d="M10 56V30a10 10 0 0 1 20 0M34 56V30a10 10 0 0 1 20 0M26 56V44a6 6 0 0 1 12 0v12" {...p} /></>),
    metro: (<><rect x="14" y="8" width="36" height="38" rx="8" {...p} /><path d="M14 30h36M22 46l-6 10M42 46l6 10" {...p} /></>),
    train: (<><path d="M12 40V16a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v24a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6zM12 28h40M18 52l-6 6M46 52l6 6" {...p} /></>),
    road: (<><path d="M22 6L10 58M42 6l12 52M32 10v8M32 26v8M32 42v8" {...p} /></>),
    trend: (<><path d="M6 50l16-16 10 10 24-26" {...p} /><path d="M42 18h14v14" {...p} /></>),
    key: (<><circle cx="20" cy="32" r="12" {...p} /><path d="M32 32h26M50 32v10M58 32v6" {...p} /></>),
    tree: (<><path d="M32 58V36M32 36l-10-8M32 40l10-8" {...p} /><circle cx="32" cy="22" r="16" {...p} /></>),
    lake: (<><path d="M6 30c6-4 10-4 16 0s10 4 16 0 10-4 16 0M6 42c6-4 10-4 16 0s10 4 16 0 10-4 16 0" {...p} /><circle cx="46" cy="14" r="6" {...p} /></>),
    kids: (<><circle cx="22" cy="14" r="6" {...p} /><circle cx="44" cy="18" r="5" {...p} /><path d="M22 20v18l-6 16M22 38l6 16M12 28h20M44 23v14l-5 14M44 37l5 14" {...p} /></>),
    building: (<><rect x="14" y="8" width="36" height="50" {...p} /><path d="M22 18h6M36 18h6M22 28h6M36 28h6M22 38h6M36 38h6M28 58V48h8v10" {...p} /></>),
    shop: (<><path d="M8 24l4-14h40l4 14M8 24h48v6a8 8 0 0 1-16 0 8 8 0 0 1-16 0 8 8 0 0 1-16 0zM12 34v22h40V34M26 56V42h12v14" {...p} /></>),
    calendar: (<><rect x="8" y="12" width="48" height="44" rx="6" {...p} /><path d="M8 26h48M20 6v12M44 6v12" {...p} /></>),
  };
  return <svg width={size} height={size} viewBox="0 0 64 64">{m[n]}</svg>;
};

const Scene: React.FC<{ r: readonly [number, number]; children: React.ReactNode }> = ({ r, children }) => (
  <Sequence from={s(r[0])} durationInFrames={s(r[1]) - s(r[0])} premountFor={30}>
    {children}
  </Sequence>
);

/* ================================================================= SCENES */

/** 1 — night aerial, letterbox opens, coordinates type in */
const Hook: React.FC = () => {
  const t = useT();
  const box = interpolate(t, [0, 1.4], [0.45, 1], { ...cl, easing: inOut });
  const coord = "41.0455° N   ·   28.8259° E";
  const typed = coord.slice(0, Math.floor(pr(t, 0.6, 2.0, Easing.linear) * coord.length));
  const sweep = interpolate(t, [1.0, 2.6], [-40, 140], cl);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={G("v_night.mp4")} video dur={7.2} rate={0.9} z={[1.15, 1.0]} pos="48% 50%" />
      <Shade top={0.7} bot={0.95} mid={0.1} />
      <Dust />
      {/* letterbox */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960 * (1 - box), background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 960 * (1 - box), background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.goldLight, direction: "ltr" }}>{typed}</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 14, color: C.pearl, opacity: pr(t, 1.6, 2.4), marginTop: 10, direction: "ltr" }}>ISTANBUL · BASIN EKSPRES</div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 400, ...RTL }}>
        <Rise at={0.4}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 88, lineHeight: 1.25, color: C.pearl }}>استثمر في</div>
        </Rise>
        <Rise at={0.6}>
          <div style={{ position: "relative", fontFamily: DISPLAY, fontWeight: 700, fontSize: 168, lineHeight: 1.15 }}>
            <GoldText>باسن إكسبريس</GoldText>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${sweep - 15}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 15}%)`, mixBlendMode: "overlay" }} />
          </div>
        </Rise>
        <Pop at={2.3} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 46, color: C.pearl, lineHeight: 1.45 }}>
            إحدى أكثر مناطق إسطنبول حيويةً
            <br />
            <span style={{ color: C.goldLight }}>للأعمال والاستثمار</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 2 — opportunity + Turkish citizenship coin flip */
const Citizen: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const flip = interpolate(t, [2.8, 3.8], [0, 180], { ...cl, easing: inOut });
  const showBack = flip > 90;
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Iris p={pr(t, 0, 0.9, inOut)}>
        <Media src={A("d3_family.mp4")} video dur={6.2} rate={0.5} z={[1.05, 1.15]} filter="brightness(0.55)" />
      </Iris>
      <Dust n={18} opacity={0.6} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 330, ...RTL }}>
        <Rise at={0.2}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 96, lineHeight: 1.25, color: C.pearl }}>وامتلك فرصة</div>
        </Rise>
        <Rise at={0.4}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 96, lineHeight: 1.25 }}>
            <GoldText>استثمارية مميزة</GoldText>
          </div>
        </Rise>
      </div>
      {/* coin */}
      <div style={{ position: "absolute", left: 240, top: 820, width: 600, height: 600, perspective: 1600 }}>
        <Pop at={1.4} scale>
          <div style={{ width: 600, height: 600, position: "relative", transformStyle: "preserve-3d", transform: `rotateY(${flip}deg)` }}>
            {[false, true].map((back) => (
              <div
                key={String(back)}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backfaceVisibility: "hidden",
                  transform: back ? "rotateY(180deg)" : undefined,
                  background: "radial-gradient(circle at 35% 30%, #FFF4D6 0%, #E9CC8F 30%, #C49A52 65%, #8A6A2E 100%)",
                  boxShadow: `0 0 ${60 + glow * 40}px rgba(216,182,119,0.55), inset 0 0 0 14px rgba(255,255,255,0.25), inset 0 0 0 26px rgba(138,106,46,0.35)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!back ? (
                  <Icon n="key" size={260} c={C.sapphire} sw={3.4} />
                ) : (
                  <>
                    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.sapphire }}>إمكانية الحصول على</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, lineHeight: 1.15, color: C.sapphire }}>الجنسية</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: C.sapphire }}>التركية</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Pop>
      </div>
      {showBack && (
        <Pop at={3.8} style={{ position: "absolute", left: 0, right: 0, top: 1480, textAlign: "center" }}>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: C.sapphire, background: GOLD, padding: "12px 34px", borderRadius: 999 }}>✓ فرصة الحصول على الجنسية</span>
        </Pop>
      )}
    </AbsoluteFill>
  );
};

/** 3 — 2+1 plan, 116 m² */
const Plan: React.FC = () => {
  const t = useT();
  const scan = pr(t, 0.2, 1.8, inOut);
  const area = Math.round(116 * pr(t, 2.4, 3.8, Easing.out(Easing.cubic)));
  const labels = [
    { x: 0.2, y: 0.62, txt: "صالة ومطبخ" },
    { x: 0.82, y: 0.48, txt: "غرفة نوم رئيسية" },
    { x: 0.5, y: 0.34, txt: "غرفة نوم" },
    { x: 0.24, y: 0.07, txt: "بلكون" },
    { x: 0.88, y: 0.86, txt: "حمّام" },
    { x: 0.55, y: 0.86, txt: "حمّام" },
  ];
  const W = 980, H = 840;
  const sc = 1000 / W;
  return (
    <AbsoluteFill style={{ background: C.pearl }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #FFFFFF 0%, #EFE7D8 100%)" }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 290, ...RTL, display: "flex", alignItems: "baseline", gap: 26 }}>
        <Rise at={0.05}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, lineHeight: 1.1, color: C.sapphire, direction: "ltr" }}>2+1</div>
        </Rise>
        <Rise at={0.25}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: "#8A6A2E" }}>مخطط الشقة</div>
        </Rise>
      </div>
      <div style={{ position: "absolute", left: 40, top: 560, width: W * sc, height: H * sc, borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 90px rgba(10,26,51,0.25)" }}>
        <Img src={A("plan.png")} style={{ width: "100%", height: "100%", clipPath: `inset(0 0 ${(1 - scan) * 100}% 0)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: GOLD, boxShadow: `0 0 30px ${C.gold}`, opacity: scan < 1 ? 1 : 0 }} />
        {labels.map((l, i) => (
          <Pop key={i} at={1.9 + i * 0.18} scale style={{ position: "absolute", left: l.x * W * sc - 110, top: l.y * H * sc - 26, width: 220, textAlign: "center" }}>
            <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, color: C.pearl, background: "rgba(10,26,51,0.88)", padding: "6px 14px", borderRadius: 10, direction: "rtl" }}>{l.txt}</span>
          </Pop>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1470, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 20, direction: "rtl" }}>
        <Pop at={2.3}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 200, lineHeight: 1, color: C.sapphire }}>
            {area}
            <span style={{ fontSize: 90, color: "#8A6A2E" }}> م²</span>
          </div>
        </Pop>
        <Pop at={2.6}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#8A6A2E" }}>المساحة</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 4 — app-style listing card over a real walkthrough */
const Listing: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const card = spring({ frame: f - 4, fps: FPS, config: { damping: 18, stiffness: 110 } });
  const price = Math.round(425000 * pr(t, 0.4, 2.0, Easing.out(Easing.cubic)));
  const thumbs = ["i_salon1.jpg", "i_kitchen.jpg", "i_bed.jpg", "i_bath.jpg", "i_salon3.jpg"];
  const active = Math.floor(t / 1.3) % thumbs.length;
  const projIn = pr(t, 3.3, 4.1);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={A("walk.mp4")} video dur={7} rate={1.25} z={[1.02, 1.08]} />
      <Shade top={0.6} bot={0.2} mid={0} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Label at={0.05}>الشقة النموذجية · <bdi dir="ltr">2+1</bdi></Label>
      </div>
      {/* glass listing card */}
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: 260,
          borderRadius: 40,
          padding: 30,
          ...GLASS,
          background: "linear-gradient(160deg, rgba(10,26,51,0.86), rgba(7,18,38,0.78))",
          transform: `translateY(${(1 - card) * 900}px)`,
          direction: "rtl",
        }}
      >
        {/* gallery */}
        <div style={{ position: "relative", height: 380, borderRadius: 26, overflow: "hidden" }}>
          <Img src={A(thumbs[active])} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + 0.05 * ((t % 1.3) / 1.3)})` }} />
          <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", gap: 8 }}>
            {thumbs.map((_, i) => (
              <div key={i} style={{ width: i === active ? 34 : 12, height: 12, borderRadius: 6, background: i === active ? C.goldLight : "rgba(255,255,255,0.55)" }} />
            ))}
          </div>
          <div style={{ position: "absolute", right: 16, top: 16, fontFamily: BODY, fontWeight: 800, fontSize: 26, color: C.sapphire, background: GOLD, padding: "6px 16px", borderRadius: 999 }}>للبيع</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24 }}>
          <div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.goldLight }}>السعر</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 112, lineHeight: 1.05, direction: "ltr", textAlign: "right" }}>
              <GoldText>{price.toLocaleString("en-US")}$</GoldText>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            {["2+1", "116 م²", "باسن إكسبريس"].map((c, i) => (
              <span key={c} dir={i === 0 ? "ltr" : "rtl"} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: C.pearl, border: "1.5px solid rgba(242,221,176,0.5)", borderRadius: 999, padding: "6px 18px" }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(242,221,176,0.25)", opacity: projIn, transform: `translateY(${(1 - projIn) * 20}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.goldLight }}>في مشروع</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: C.pearl, direction: "ltr", textAlign: "right" }}>Avrupa Konutları Güneşli</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 5 — construction becomes completion (real drone), developer + land area */
const Build: React.FC = () => {
  const t = useT();
  const p = pr(t, 0.3, 6.0, Easing.linear);
  const land = Math.round(88000 * pr(t, 5.3, 7.0, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={G("v_transform.mp4")} video dur={10} rate={0.66} z={[1.0, 1.1]} pos="45% 50%" />
      <Shade top={0.85} bot={0.95} />
      {/* progress UI */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...GLASS, borderRadius: 22, padding: "18px 24px", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BODY, fontWeight: 800, fontSize: 30, color: C.pearl }}>
          <span>{p < 1 ? "من الإنشاء…" : "✓ إلى الاكتمال"}</span>
          <span style={{ color: C.goldLight, direction: "ltr" }}>{Math.round(p * 100)}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.15)", marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", background: GOLD, marginRight: 0, marginLeft: "auto" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 400, ...RTL }}>
        <Rise at={0.2}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, lineHeight: 1.25, color: C.pearl }}>مشروع سكني وتجاري</div>
        </Rise>
        <Rise at={0.4}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, lineHeight: 1.25 }}>
            <GoldText>متكامل</GoldText>
          </div>
        </Rise>
        <Pop at={2.4} style={{ marginTop: 14 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, ...GLASS, borderRadius: 18, padding: "12px 24px" }}>
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.goldLight }}>من تطوير</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: C.pearl, direction: "ltr" }}>Artaş Holding</span>
          </div>
        </Pop>
        <Pop at={5.2} style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, lineHeight: 1, direction: "ltr" }}>
              <GoldText>{land.toLocaleString("en-US")}</GoldText>
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.pearl, lineHeight: 1.2 }}>
              م²
              <br />
              مساحة الأرض
            </div>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 6 — project stats over the maquette, with unit-type selector */
const Stat: React.FC<{ at: number; n: number; label: string; icon: IconName }> = ({ at, n, label, icon }) => {
  const t = useT();
  const v = Math.round(n * pr(t, at, at + 1.3, Easing.out(Easing.cubic)));
  const blur = Math.max(0, 6 - (t - at) * 6);
  return (
    <Pop at={at}>
      <div style={{ ...GLASS, borderRadius: 28, padding: "24px 26px", display: "flex", alignItems: "center", gap: 20, direction: "rtl", background: "linear-gradient(160deg, rgba(10,26,51,0.82), rgba(7,18,38,0.7))" }}>
        <Icon n={icon} size={84} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, lineHeight: 1, direction: "ltr", textAlign: "right", filter: `blur(${blur}px)` }}>
            <GoldText>{v.toLocaleString("en-US")}</GoldText>
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, color: C.pearl }}>{label}</div>
        </div>
      </div>
    </Pop>
  );
};

const Stats: React.FC = () => {
  const t = useT();
  const types = ["1+1", "2+1", "3+1", "4+1"];
  const sel = pr(t, 8.8, 12.0, inOut) * 3;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={A("maquette.jpg")} dur={13} z={[1.25, 1.05]} pos="50% 72%" filter="brightness(0.62) saturate(1.1)" />
      <Shade top={0.8} bot={0.9} mid={0.15} />
      <Dust n={16} opacity={0.5} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Label at={0.05}>المشروع بالأرقام</Label>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 420, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Stat at={0.1} n={11} label="مبنى" icon="building" />
        <Stat at={2.2} n={1556} label="شقة سكنية" icon="key" />
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 720 }}>
        <Stat at={5.8} n={24} label="وحدة تجارية" icon="shop" />
      </div>
      {/* unit type segmented control */}
      <Pop at={8.6} style={{ position: "absolute", left: 50, right: 50, top: 1030 }}>
        <div style={{ ...RTL, fontFamily: BODY, fontWeight: 800, fontSize: 38, color: C.goldLight, marginBottom: 16 }}>خيارات متنوعة من</div>
        <div style={{ position: "relative", display: "flex", direction: "ltr", ...GLASS, borderRadius: 999, padding: 10, background: "rgba(7,18,38,0.75)" }}>
          <div style={{ position: "absolute", top: 10, bottom: 10, left: 10 + sel * 235, width: 225, borderRadius: 999, background: GOLD, boxShadow: `0 0 30px rgba(216,182,119,0.6)` }} />
          {types.map((x, i) => (
            <div key={x} style={{ position: "relative", flex: 1, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, padding: "14px 0", color: Math.abs(sel - i) < 0.5 ? C.sapphire : C.pearl }}>
              {x}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", direction: "ltr", marginTop: 14, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.pearl, opacity: 0.85 }}>
          <span>1+1</span>
          <span>→</span>
          <span>4+1</span>
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

/** 7 — lifestyle: 3D floating gallery */
const CARDS3D = [
  { src: "ex_C5.jpg", at: 0.2, x: -330, y: -300, rz: -6, ry: 22 },
  { src: "ex_c6.jpg", at: 0.5, x: 330, y: -250, rz: 5, ry: -22 },
  { src: "ex_C4.jpg", at: 8.4, x: -250, y: 620, rz: -4, ry: 14 },
];
const Life: React.FC = () => {
  const t = useT();
  const chips: { at: number; txt: string; icon: IconName }[] = [
    { at: 2.5, txt: "المساحات الخضراء والحدائق", icon: "tree" },
    { at: 7.4, txt: "البحيرة المركزية", icon: "lake" },
    { at: 9.8, txt: "مناطق ألعاب الأطفال", icon: "kids" },
  ];
  const cam = interpolate(t, [0, 11.3], [0, -8], cl);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.sapphire2} 0%, ${C.night} 75%)` }}>
      <Dust n={20} opacity={0.6} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Rise at={0.05}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 88, lineHeight: 1.2, color: C.pearl }}>
            استمتعوا بحياة <GoldText>عصرية</GoldText>
          </div>
        </Rise>
      </div>
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transformStyle: "preserve-3d", transform: `rotateY(${cam}deg)` }}>
          {/* centre hero: lake clip */}
          <Pop at={0.0} scale style={{ position: "absolute", left: 90, top: 640, width: 900, height: 620 }}>
            <div style={{ width: 900, height: 620, borderRadius: 34, overflow: "hidden", border: `3px solid ${C.gold}`, boxShadow: "0 50px 120px rgba(0,0,0,0.6)" }}>
              <Media src={G("v_lake.mp4")} video dur={11.3} rate={0.55} z={[1.0, 1.08]} />
            </div>
          </Pop>
          {CARDS3D.map((c) => {
            const p = pr(t, c.at, c.at + 1.0);
            return (
              <div
                key={c.src}
                style={{
                  position: "absolute",
                  left: 540 - 230 + c.x,
                  top: 950 - 150 + c.y,
                  width: 460,
                  height: 300,
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "2px solid rgba(242,221,176,0.6)",
                  boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
                  opacity: p,
                  transform: `translateZ(${120 - 260 * (1 - p)}px) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) translateY(${Math.sin(t * 1.2 + c.x) * 8}px)`,
                }}
              >
                <Img src={A(c.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 50, right: 50, top: 1330, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
        {chips.map((c) => (
          <Pop key={c.txt} at={c.at}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 14, ...GLASS, borderRadius: 999, padding: "12px 28px", direction: "rtl", background: "rgba(10,26,51,0.75)" }}>
              <Icon n={c.icon} size={52} c={C.lake} />
              <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.pearl }}>{c.txt}</span>
            </div>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 8 — amenities: glowing tile grid */
const AM: { at: number; txt: string; icon: IconName }[] = [
  { at: 2.1, txt: "مسابح داخلية", icon: "pool" },
  { at: 3.5, txt: "نادٍ رياضي", icon: "gym" },
  { at: 5.7, txt: "ساونا وحمام تركي", icon: "sauna" },
  { at: 8.8, txt: "مناطق مخصصة للعائلات", icon: "family" },
];
const Amen: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={A("d3_garden.mp4")} video dur={10.5} rate={0.3} z={[1.1, 1.2]} filter="brightness(0.35) blur(8px)" />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Rise at={0.05}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 96, color: C.pearl, lineHeight: 1.2 }}>
            مرافق <GoldText>متكاملة</GoldText>
          </div>
        </Rise>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 560, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {AM.map((a) => {
          const on = pr(t, a.at, a.at + 0.5);
          return (
            <div
              key={a.txt}
              style={{
                height: 430,
                borderRadius: 34,
                padding: 30,
                ...GLASS,
                background: on > 0.5 ? "linear-gradient(160deg, rgba(216,182,119,0.32), rgba(10,26,51,0.85))" : "rgba(10,26,51,0.6)",
                borderColor: on > 0.5 ? C.gold : "rgba(242,221,176,0.25)",
                boxShadow: on > 0.5 ? `0 0 60px rgba(216,182,119,${0.45 * on}), 0 30px 80px rgba(0,0,0,0.45)` : "0 30px 80px rgba(0,0,0,0.45)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                direction: "rtl",
                transform: `scale(${0.94 + 0.06 * on})`,
              }}
            >
              <div style={{ alignSelf: "flex-start", opacity: 0.4 + 0.6 * on }}>
                <Icon n={a.icon} size={150} c={on > 0.5 ? C.goldLight : "rgba(246,242,234,0.5)"} sw={2.6} />
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, lineHeight: 1.2, color: on > 0.5 ? C.pearl : "rgba(246,242,234,0.45)" }}>{a.txt}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 9 — location: zoom into the real project map */
const MapScene: React.FC = () => {
  const t = useT();
  const MW = 4400, MH = 2200;
  const pin = { x: 0.336, y: 0.335 };
  const z = interpolate(t, [0, 2.2, 11.9], [0.55, 1.0, 1.08], { ...cl, easing: inOut });
  const w = 1080 * 2.2 * z;
  const h = w * (MH / MW);
  const cx = interpolate(t, [0, 2.2], [0.5, pin.x], { ...cl, easing: inOut });
  const cy = interpolate(t, [0, 2.2], [0.5, pin.y + 0.1], { ...cl, easing: inOut });
  const left = 540 - cx * w;
  const top = 960 - cy * h;
  const pulse = (t * 0.8) % 1;
  const marks: { at: number; x: number; y: number; txt: string; icon: IconName; c: string }[] = [
    { at: 3.9, x: 0.355, y: 0.29, txt: "مترو", icon: "metro", c: "#1E63C6" },
    { at: 5.0, x: 0.51, y: 0.73, txt: "مرمراي", icon: "train", c: "#7A3DB8" },
    { at: 7.9, x: 0.355, y: 0.77, txt: "E-5", icon: "road", c: "#2D8BD8" },
    { at: 9.6, x: 0.47, y: 0.085, txt: "TEM", icon: "road", c: "#2FA84F" },
  ];
  return (
    <AbsoluteFill style={{ background: C.pearl }}>
      <div style={{ position: "absolute", left, top, width: w, height: h }}>
        <Img src={A("map.jpg")} style={{ width: "100%", height: "100%" }} />
        {/* cover the source bubble with our own pin */}
        <div style={{ position: "absolute", left: (pin.x - 0.06) * w, top: (pin.y - 0.3) * h, width: 0.12 * w, height: 0.3 * h, background: "transparent" }} />
        <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
          <circle cx={pin.x * w} cy={pin.y * h} r={40 + pulse * 160} fill="none" stroke={C.gold} strokeWidth={8} opacity={1 - pulse} />
          {marks.map((m) => {
            const p = pr(t, m.at, m.at + 0.6);
            return <circle key={m.txt} cx={m.x * w} cy={m.y * h} r={60 * p} fill="none" stroke={m.c} strokeWidth={10} opacity={p} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: pin.x * w - 230, top: pin.y * h - 330, width: 460 }}>
          <Pop at={1.8} scale>
            <div style={{ background: C.sapphire, borderRadius: 30, padding: "20px 24px", textAlign: "center", boxShadow: "0 30px 60px rgba(10,26,51,0.45)", border: `3px solid ${C.gold}` }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, color: C.goldLight, lineHeight: 1.2 }}>مشروعنا</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.pearl, direction: "ltr" }}>Avrupa Konutları Güneşli</div>
            </div>
            <div style={{ width: 0, height: 0, margin: "0 auto", borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: `40px solid ${C.gold}` }} />
          </Pop>
        </div>
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,18,38,0.85) 0%, rgba(7,18,38,0) 26%, rgba(7,18,38,0) 70%, rgba(7,18,38,0.9) 100%)" }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Rise at={0.1}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, lineHeight: 1.2, color: C.pearl }}>
            موقع <GoldText>استراتيجي</GoldText>
          </div>
        </Rise>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, bottom: 300, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {marks.map((m) => (
          <Pop key={m.txt} at={m.at}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(10,26,51,0.88)", border: `2px solid ${m.c}`, borderRadius: 22, padding: "14px 20px", direction: "rtl" }}>
              <Icon n={m.icon} size={54} c={C.pearl} />
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, color: C.pearl, unicodeBidi: "plaintext" }}>{m.txt}</span>
            </div>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 10 — investment value */
const Invest: React.FC = () => {
  const t = useT();
  const line = pr(t, 0.4, 3.2, Easing.inOut(Easing.cubic));
  const L = 1600;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={A("dr_aerial.mp4")} video dur={7.1} rate={1.0} z={[1.05, 1.15]} filter="brightness(0.55)" />
      <Shade top={0.8} bot={0.92} mid={0.15} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ig" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.gold} stopOpacity="0.2" />
            <stop offset="1" stopColor={C.goldLight} />
          </linearGradient>
        </defs>
        <path d="M60 1240 C 260 1220, 330 1130, 470 1100 S 720 980, 820 900 S 980 760, 1030 700" fill="none" stroke="url(#ig)" strokeWidth={10} strokeDasharray={L} strokeDashoffset={L * (1 - line)} strokeLinecap="round" />
        <circle cx={1030} cy={700} r={16 * line} fill={C.goldLight} />
      </svg>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, ...RTL }}>
        <Rise at={0.1}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 92, lineHeight: 1.2, color: C.pearl }}>فرصة استثمارية</div>
        </Rise>
        <Rise at={0.3}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 92, lineHeight: 1.2 }}>
            <GoldText>في منطقة حيوية</GoldText>
          </div>
        </Rise>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 1300, display: "flex", flexDirection: "column", gap: 20 }}>
        {[
          { at: 2.2, txt: "طلب إيجاري", icon: "key" as IconName },
          { at: 5.2, txt: "إمكانات واعدة لإعادة البيع", icon: "trend" as IconName },
        ].map((k) => (
          <Pop key={k.txt} at={k.at}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, ...GLASS, borderRadius: 26, padding: "20px 28px", direction: "rtl", background: "rgba(10,26,51,0.82)" }}>
              <Icon n={k.icon} size={70} />
              <span style={{ flex: 1, fontFamily: BODY, fontWeight: 900, fontSize: 50, color: C.pearl }}>{k.txt}</span>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: C.lake }}>↗</span>
            </div>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 11 — expected delivery: flip calendar over real construction */
const Deliver: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const flip = interpolate(t, [0.3, 1.1], [-90, 0], { ...cl, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={A("dr_cranes.mp4")} video dur={2.9} rate={1.2} z={[1.05, 1.12]} filter="brightness(0.5)" />
      <Shade top={0.7} bot={0.85} mid={0.2} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 330, ...RTL }}>
        <Label at={0.05}>موعد التسليم المتوقع</Label>
      </div>
      <div style={{ position: "absolute", left: 240, top: 620, width: 600, perspective: 1400 }}>
        <div style={{ borderRadius: 34, overflow: "hidden", boxShadow: "0 50px 120px rgba(0,0,0,0.6)", transformOrigin: "top", transform: `rotateX(${flip}deg)` }}>
          <div style={{ height: 150, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, color: C.sapphire }}>يوليو</span>
          </div>
          <div style={{ height: 420, background: C.pearl, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 210, color: C.sapphire }}>2027</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 12 — end card */
const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sp = spring({ frame: f - 4, fps: FPS, config: { damping: 15, stiffness: 90 } });
  const ring = pr(t, 0.1, 1.4, inOut);
  const pulse = 1 + 0.025 * Math.sin(t * Math.PI * 2.2);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Media src={G("v_night.mp4")} video dur={6.6} rate={0.6} start={1} z={[1.3, 1.4]} filter="blur(12px) brightness(0.35)" />
      <Dust n={30} opacity={0.8} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={720} r={360} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray={2300} strokeDashoffset={2300 * (1 - ring)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center" }}>
        <div style={{ background: C.pearl, borderRadius: 40, padding: "44px 48px", transform: `scale(${0.8 + 0.2 * sp})`, opacity: sp, boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <Img src={A("logo_dark.png")} style={{ width: 520, display: "block" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1180, textAlign: "center" }}>
        <Pop at={0.6}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 76, color: C.pearl, direction: "rtl" }}>
            تواصل <GoldText>الآن</GoldText>
          </div>
        </Pop>
        <Pop at={0.9} style={{ marginTop: 30 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, background: GOLD, padding: "30px 50px", borderRadius: 999, transform: `scale(${pulse})`, boxShadow: "0 25px 70px rgba(216,182,119,0.45)" }}>
            <svg width={62} height={62} viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="none" stroke={C.sapphire} strokeWidth={2} />
            </svg>
            <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 72, color: C.sapphire, direction: "ltr" }}>{PHONE}</span>
          </div>
        </Pop>
        <Pop at={1.4} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.goldLight, direction: "rtl" }}>شقة <bdi dir="ltr">2+1</bdi> · 116 م² · باسن إكسبريس، إسطنبول</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- global overlays */
const BrandCorner: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [s(1.2), s(1.6), s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: "rgba(246,242,234,0.95)", padding: "14px 18px 10px", borderRadius: 20, borderBottom: `5px solid ${C.gold}`, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
      <Img src={A("logo_dark.png")} style={{ width: 210, display: "block" }} />
    </div>
  );
};

const SECTIONS: [number, string][] = [
  [T.citizen[0], "الفرصة"],
  [T.plan[0], "الشقة"],
  [T.build[0], "المشروع"],
  [T.life[0], "الحياة"],
  [T.map[0], "الموقع"],
  [T.invest[0], "الاستثمار"],
];
const SectionIndex: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < T.citizen[0] || t >= T.end[0]) return null;
  let cur = 0;
  SECTIONS.forEach(([st], i) => {
    if (t >= st) cur = i;
  });
  return (
    <div style={{ position: "absolute", right: 44, top: 70, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: C.pearl, background: "rgba(7,18,38,0.6)", border: `1.5px solid ${C.gold}`, borderRadius: 999, padding: "6px 18px", direction: "rtl" }}>
        {SECTIONS[cur][1]} <span style={{ color: C.goldLight }}>0{cur + 1}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {SECTIONS.map((_, i) => (
          <div key={i} style={{ width: i === cur ? 30 : 10, height: 6, borderRadius: 3, background: i <= cur ? C.gold : "rgba(255,255,255,0.35)" }} />
        ))}
      </div>
    </div>
  );
};

/** Gold light-sweep + flash between scenes */
const Wipes: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = [T.citizen, T.plan, T.listing, T.build, T.stats, T.life, T.amen, T.map, T.invest, T.deliver, T.end].map((r) => s(r[0]));
  return (
    <>
      {cuts.map((c) => {
        const l = f - c;
        if (l < -9 || l > 9) return null;
        const p = interpolate(l, [-9, 9], [0, 1], cl);
        const x = interpolate(p, [0, 1], [-1400, 1400], { easing: inOut });
        const flash = interpolate(l, [-2, 0, 6], [0, 0.55, 0], cl);
        return (
          <AbsoluteFill key={c} style={{ pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: -400, bottom: -400, width: 700, left: 190 + x, transform: "rotate(18deg)", background: `linear-gradient(90deg, transparent, rgba(242,221,176,0.85), #FFFFFF, rgba(242,221,176,0.85), transparent)`, filter: "blur(10px)" }} />
            <AbsoluteFill style={{ background: `rgba(255,244,214,${flash})` }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.09 }}>
      <svg width="100%" height="100%">
        <filter id={`gn${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#gn${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", right: 0, bottom: 0, height: 7, width: `${(f / TOTAL) * 100}%`, background: GOLD }} />;
};

/* ============================================================ composition */
export const Gunesli: React.FC = () => {
  const music = (f: number) => interpolate(f, [0, 20, s(95.7), s(96.3), TOTAL - 45, TOTAL], [0, 0.17, 0.17, 0.42, 0.42, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Scene r={T.hook}><Hook /></Scene>
      <Scene r={T.citizen}><Citizen /></Scene>
      <Scene r={T.plan}><Plan /></Scene>
      <Scene r={T.listing}><Listing /></Scene>
      <Scene r={T.build}><Build /></Scene>
      <Scene r={T.stats}><Stats /></Scene>
      <Scene r={T.life}><Life /></Scene>
      <Scene r={T.amen}><Amen /></Scene>
      <Scene r={T.map}><MapScene /></Scene>
      <Scene r={T.invest}><Invest /></Scene>
      <Scene r={T.deliver}><Deliver /></Scene>
      <Scene r={T.end}><End /></Scene>

      <Wipes />
      <Grain />
      <BrandCorner />
      <SectionIndex />
      <Progress />

      <Audio src={G("vo.mp3")} />
      <Audio src={G("music.mp3")} volume={music} />
    </AbsoluteFill>
  );
};
