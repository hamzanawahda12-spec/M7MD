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
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBarlow } from "@remotion/google-fonts/Barlow";

const { fontFamily: HEAD } = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BODY } = loadBarlow("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });

export const FPS = 30;
const s = (x: number) => Math.round(x * FPS);
const R = (n: string) => staticFile(`dukkan/r/${n}`);
const D = (n: string) => staticFile(`dukkan/${n}`);

/* ----------------------------------------------------------------- tokens */
const C = {
  ink: "#111214",
  steel: "#26292E",
  yellow: "#FFC629",
  red: "#E63329",
  white: "#F7F5F0",
  sign: "#1E5AA8", // road sign blue
  motorway: "#0E7A45", // motorway green
};
const PHONE = "+90 534 878 42 22";

/** Scene timing (seconds) synced to the Harrison Turkish voiceover */
const T = {
  hook: [0, 6.2],
  front: [6.2, 11.7],
  price: [11.7, 15.0],
  shop: [15.0, 20.8],
  loc: [20.8, 29.5],
  wet: [29.5, 32.5],
  near: [32.5, 41.2],
  amen: [41.2, 52.3],
  rise: [52.3, 57.4],
  end: [57.4, 63.0],
} as const;
export const TOTAL = s(63);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / FPS;
const pr = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...cl, easing: e });

/* ------------------------------------------------------------- primitives */
const Up: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; out?: number }> = ({ at, children, style, out }) => {
  const t = useT();
  const p = pr(t, at, at + 0.6);
  const o = out !== undefined ? 1 - pr(t, out, out + 0.3) : 1;
  return (
    <div style={{ overflow: "hidden", paddingTop: 10, marginTop: -10, ...style, opacity: o }}>
      <div style={{ transform: `translateY(${(1 - p) * 115}%)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number; scale?: boolean; out?: number }> = ({ at, children, style, dist = 60, scale, out }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 14, stiffness: 150, mass: 0.7 } });
  const t = f / FPS;
  const o = out !== undefined ? 1 - pr(t, out, out + 0.3) : 1;
  return (
    <div style={{ ...style, opacity: Math.min(1, sp * 1.5) * o, transform: scale ? `scale(${0.5 + 0.5 * sp})` : `translateY(${(1 - sp) * dist}px)` }}>{children}</div>
  );
};

/** Yellow highlighter bar that sweeps behind a word */
const Mark: React.FC<{ at: number; children: React.ReactNode; color?: string; text?: string }> = ({ at, children, color = C.yellow, text = C.ink }) => {
  const t = useT();
  const p = pr(t, at, at + 0.45, inOut);
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 14px" }}>
      <span style={{ position: "absolute", left: 0, top: "8%", bottom: "4%", width: `${p * 100}%`, background: color, zIndex: 0 }} />
      <span style={{ position: "relative", zIndex: 1, color: p > 0.5 ? text : C.white }}>{children}</span>
    </span>
  );
};

const Media: React.FC<{ src: string; video?: boolean; rate?: number; start?: number; dur: number; z?: [number, number]; pos?: string; filter?: string; y?: [number, number] }> = ({
  src,
  video,
  rate = 1,
  start = 0,
  dur,
  z = [1.04, 1.14],
  pos = "center",
  filter,
  y = [0, 0],
}) => {
  const t = useT();
  const p = interpolate(t, [0, dur], [0, 1], cl);
  const st: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    filter,
    transform: `scale(${z[0] + (z[1] - z[0]) * p}) translateY(${y[0] + (y[1] - y[0]) * p}%)`,
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {video ? <OffthreadVideo src={src} muted playbackRate={rate} startFrom={s(start)} style={st} /> : <Img src={src} style={st} />}
    </AbsoluteFill>
  );
};

/** Signature transition: a metal roll-up shop shutter. p=0 closed, p=1 rolled up */
const Shutter: React.FC<{ p: number; color?: string; label?: boolean }> = ({ p, color = "#B9BCC2", label }) => {
  const h = 1920 * (1 - p);
  const slat = 46;
  const n = Math.ceil(1920 / slat);
  if (h <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, overflow: "hidden", boxShadow: "0 18px 30px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1920 }}>
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            style={{
              height: slat,
              background: `linear-gradient(180deg, #8E9298 0%, ${color} 18%, #E6E8EB 45%, ${color} 70%, #6E7278 100%)`,
              borderBottom: "2px solid #55595F",
            }}
          />
        ))}
      </div>
      {label && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 520, textAlign: "center" }}>
          <div style={{ fontFamily: HEAD, fontSize: 210, lineHeight: 0.95, color: C.red, textShadow: "0 3px 0 rgba(0,0,0,0.25)" }}>SATILIK</div>
          <div style={{ fontFamily: HEAD, fontSize: 150, lineHeight: 1.0, color: C.ink }}>DÜKKÂN</div>
          <div style={{ display: "inline-block", marginTop: 20, fontFamily: BODY, fontWeight: 900, fontSize: 54, color: C.ink, background: C.yellow, padding: "6px 26px" }}>ARNAVUTKÖY · ANA CADDE</div>
        </div>
      )}
      {/* bottom bar + handle */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: "linear-gradient(180deg,#4A4E54,#24272B)" }} />
      <div style={{ position: "absolute", left: 470, width: 140, bottom: 8, height: 14, borderRadius: 7, background: C.yellow }} />
    </div>
  );
};

const Shade: React.FC<{ top?: number; bot?: number }> = ({ top = 0.7, bot = 0.92 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(17,18,20,${top}) 0%, rgba(17,18,20,0) 30%, rgba(17,18,20,0) 50%, rgba(17,18,20,${bot}) 100%)` }} />
);

/** Phone-style frame for real site footage */
const RealCard: React.FC<{ src: string; at?: number; dur: number; style?: React.CSSProperties; rate?: number; start?: number }> = ({ src, at = 0, dur, style, rate = 1, start = 0 }) => {
  const t = useT();
  const p = pr(t, at, at + 0.6);
  return (
    <div
      style={{
        position: "absolute",
        width: 560,
        height: 940,
        borderRadius: 34,
        overflow: "hidden",
        border: `8px solid ${C.white}`,
        boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
        transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * 8 - 3}deg)`,
        opacity: p,
        ...style,
      }}
    >
      <Media src={src} video dur={dur} rate={rate} start={start} z={[1.02, 1.08]} />
      <div style={{ position: "absolute", left: 18, top: 18, display: "flex", alignItems: "center", gap: 10, background: "rgba(17,18,20,0.75)", padding: "8px 14px", borderRadius: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: C.red, opacity: Math.round(t * 2) % 2 ? 1 : 0.35 }} />
        <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: C.white, letterSpacing: 2 }}>GERÇEK ÇEKİM</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ icons */
type IconName = "hosp" | "kitchen" | "bath" | "wc" | "city" | "metro" | "road" | "plane" | "meeting" | "sofa" | "parking" | "shield" | "camera" | "drops" | "pin" | "cross3";
const Icon: React.FC<{ n: IconName; size?: number; c?: string; sw?: number }> = ({ n, size = 64, c = C.ink, sw = 3.4 }) => {
  const p = { fill: "none", stroke: c, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const m: Record<IconName, React.ReactNode> = {
    hosp: (<><rect x="10" y="10" width="44" height="44" rx="6" {...p} /><path d="M32 20v24M20 32h24" {...p} /></>),
    kitchen: (<><path d="M10 26h44v6a14 14 0 0 1-14 14H24a14 14 0 0 1-14-14z" {...p} /><path d="M6 26h52M24 18c0-4 4-4 4-8M34 18c0-4 4-4 4-8" {...p} /></>),
    bath: (<><path d="M6 32h52v6a12 12 0 0 1-12 12H18A12 12 0 0 1 6 38z" {...p} /><path d="M14 32V14a6 6 0 0 1 12 0M16 50l-2 6M48 50l2 6" {...p} /></>),
    wc: (<><rect x="8" y="10" width="48" height="44" rx="4" {...p} /><path d="M16 24l4 16 4-12 4 12 4-16M48 26a6 6 0 1 0 0 12" {...p} /></>),
    city: (<><path d="M8 56V22l16-8v42M24 56V28h16v28M40 56V16h16v40M4 56h56" {...p} /></>),
    metro: (<><rect x="14" y="8" width="36" height="38" rx="8" {...p} /><path d="M14 30h36M22 46l-6 10M42 46l6 10" {...p} /></>),
    road: (<><path d="M22 6L10 58M42 6l12 52M32 10v8M32 26v8M32 42v8" {...p} /></>),
    plane: (<><path d="M30 6c2-2 6 0 6 4v14l20 12v6l-20-6v12l6 6v4l-10-3-10 3v-4l6-6V36L8 42v-6l20-12V10c0-2 1-3 2-4z" {...p} /></>),
    meeting: (<><rect x="14" y="26" width="36" height="12" {...p} /><circle cx="18" cy="16" r="5" {...p} /><circle cx="46" cy="16" r="5" {...p} /><circle cx="18" cy="50" r="5" {...p} /><circle cx="46" cy="50" r="5" {...p} /></>),
    sofa: (<><path d="M10 30V22a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v8" {...p} /><path d="M6 30h52v16H6zM12 46v6M52 46v6" {...p} /></>),
    parking: (<><rect x="8" y="8" width="48" height="48" rx="6" {...p} /><path d="M24 46V18h10a8 8 0 0 1 0 16H24" {...p} /></>),
    shield: (<><path d="M32 6l22 8v16c0 14-10 22-22 28C20 52 10 44 10 30V14z" {...p} /><path d="M22 32l7 7 13-14" {...p} /></>),
    camera: (<><path d="M8 18l34 8-4 14-34-8z" {...p} /><path d="M38 34l10 4 4 14H40M8 26v20" {...p} /></>),
    drops: (<><path d="M32 6c8 12 12 18 12 24a12 12 0 0 1-24 0c0-6 4-12 12-24z" {...p} /><path d="M14 40c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10zM50 40c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10z" {...p} /></>),
    pin: (<><path d="M32 58S12 38 12 24a20 20 0 0 1 40 0c0 14-20 34-20 34z" {...p} /><circle cx="32" cy="24" r="7" {...p} /></>),
    cross3: (<><path d="M32 58V32M32 32L10 12M32 32l22-20" {...p} /><circle cx="32" cy="32" r="5" {...p} /></>),
  };
  return <svg width={size} height={size} viewBox="0 0 64 64">{m[n]}</svg>;
};

const Scene: React.FC<{ r: readonly [number, number]; children: React.ReactNode }> = ({ r, children }) => (
  <Sequence from={s(r[0])} durationInFrames={s(r[1]) - s(r[0])} premountFor={30}>
    {children}
  </Sequence>
);

/* ================================================================= SCENES */

/** 1 — shutter rolls up on the building rising from scaffolding */
const Hook: React.FC = () => {
  const t = useT();
  const up = pr(t, 0.35, 1.35, inOut);
  const swap = t >= 3.25;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={D("v_ext.mp4")} video dur={6.2} rate={1.05} z={[1.0, 1.08]} pos="55% 50%" />
      <Shade top={0.55} bot={0.95} />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 400 }}>
        {!swap ? (
          <>
            <Up at={0.5}>
              <div style={{ fontFamily: HEAD, fontSize: 84, lineHeight: 1.05, color: C.white, letterSpacing: 1 }}>ARNAVUTKÖY'DE</div>
            </Up>
            <Up at={0.7}>
              <div style={{ fontFamily: HEAD, fontSize: 190, lineHeight: 1.0, color: C.yellow }}>SATILIK</div>
            </Up>
            <Up at={0.9}>
              <div style={{ fontFamily: HEAD, fontSize: 190, lineHeight: 1.0, color: C.white }}>DÜKKÂN!</div>
            </Up>
            <Pop at={1.6} style={{ marginTop: 20 }}>
              <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, background: C.red, color: C.white, padding: "8px 22px", letterSpacing: 2 }}>PRESTİJLİ KONUM</span>
            </Pop>
          </>
        ) : (
          <>
            <Up at={3.3}>
              <div style={{ fontFamily: HEAD, fontSize: 120, lineHeight: 1.05, color: C.white }}>ANA CADDE</div>
            </Up>
            <Up at={3.45}>
              <div style={{ fontFamily: HEAD, fontSize: 120, lineHeight: 1.05, color: C.white }}>ÜZERİNDE</div>
            </Up>
            <Up at={3.7} style={{ marginTop: 10 }}>
              <div style={{ fontFamily: HEAD, fontSize: 104, lineHeight: 1.1 }}>
                <Mark at={3.9}>KAÇIRILMAYACAK</Mark>
              </div>
            </Up>
            <Up at={3.9}>
              <div style={{ fontFamily: HEAD, fontSize: 104, lineHeight: 1.1, color: C.yellow }}>FIRSAT!</div>
            </Up>
          </>
        )}
      </div>
      <Shutter p={up} label />
    </AbsoluteFill>
  );
};

/** 2 — the storefront: highlight box draws around the shop unit */
const BOX = { x: 0.372, y: 0.6, w: 0.13, h: 0.205 }; // relative to building_clean.png
const Front: React.FC = () => {
  const t = useT();
  // image is landscape; show it fit to width in the middle band then zoom onto the shop
  const zoom = interpolate(t, [0.2, 2.6], [1, 2.1], { ...cl, easing: inOut });
  const W = 1080 * zoom;
  const H = W * (1066 / 1600);
  const cx = interpolate(zoom, [1, 2.1], [0.5, BOX.x + BOX.w / 2]);
  const cy = interpolate(zoom, [1, 2.1], [0.5, BOX.y + BOX.h / 2]);
  const left = 540 - cx * W;
  const top = 900 - cy * H;
  const draw = pr(t, 2.2, 3.0, inOut);
  const per = 2 * (BOX.w * W + BOX.h * H);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <AbsoluteFill style={{ filter: "blur(30px) brightness(0.45)" }}>
        <Img src={R("building_clean.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left, top, width: W, height: H }}>
        <Img src={R("building_clean.png")} style={{ width: "100%", height: "100%" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect
            x={BOX.x * W}
            y={BOX.y * H}
            width={BOX.w * W}
            height={BOX.h * H}
            fill={`rgba(255,198,41,${0.18 * draw})`}
            stroke={C.yellow}
            strokeWidth={8}
            strokeDasharray={per}
            strokeDashoffset={per * (1 - draw)}
          />
        </svg>
      </div>
      {/* arrow + label pointing at the shop */}
      <Pop at={2.9} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, background: C.yellow, color: C.ink, padding: "10px 24px" }}>▼ SİZİN DÜKKÂNINIZ</span>
      </Pop>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300 }}>
        <Up at={0.15}>
          <div style={{ fontFamily: HEAD, fontSize: 76, color: C.white, lineHeight: 1.1 }}>İŞ MERKEZİNDE · ANA CADDE CEPHELİ</div>
        </Up>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 380, display: "flex", alignItems: "flex-end", gap: 26 }}>
        <Pop at={2.8}>
          <div style={{ fontFamily: HEAD, fontSize: 250, lineHeight: 0.9, color: C.yellow }}>
            48<span style={{ fontSize: 120 }}>m²</span>
          </div>
        </Pop>
        <Up at={3.1}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, lineHeight: 1.1, color: C.white, paddingBottom: 18 }}>
            GİRİŞ KAT
            <br />
            DÜKKÂN MAĞAZASI
          </div>
        </Up>
      </div>
    </AbsoluteFill>
  );
};

/** 3 — swinging price tag */
const Price: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const drop = spring({ frame: f - 3, fps: FPS, config: { damping: 9, stiffness: 70, mass: 1 } });
  const swing = Math.sin(t * 3.2) * 9 * Math.exp(-t * 0.9);
  const val = Math.round((16000000 * pr(t, 0.5, 1.7, Easing.out(Easing.cubic))) / 100000) * 100000;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={R("end_shop.png")} dur={3.3} z={[1.15, 1.25]} filter="brightness(0.38) blur(4px)" />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, textAlign: "center" }}>
        <Up at={0.05}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 48, letterSpacing: 8, color: C.yellow }}>DÜKKÂN SATIŞ FİYATI</div>
        </Up>
      </div>
      {/* string */}
      <div style={{ position: "absolute", left: 538, top: 0, width: 4, height: 520 * drop, background: C.white, opacity: 0.8 }} />
      <div
        style={{
          position: "absolute",
          left: 90,
          width: 900,
          top: -760 + 1280 * drop,
          height: 720,
          transformOrigin: "450px -40px",
          transform: `rotate(${swing}deg)`,
        }}
      >
        <svg width={900} height={720} style={{ position: "absolute", inset: 0 }}>
          <path d="M120 0 H780 L900 120 V680 a40 40 0 0 1 -40 40 H40 a40 40 0 0 1 -40 -40 V120 Z" fill={C.yellow} />
          <circle cx={450} cy={70} r={26} fill={C.ink} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
          <div style={{ fontFamily: HEAD, fontSize: 168, lineHeight: 1, color: C.ink }}>{val.toLocaleString("tr-TR")}</div>
          <div style={{ fontFamily: HEAD, fontSize: 130, lineHeight: 1.1, color: C.ink }}>TL</div>
          <div style={{ marginTop: 18, display: "inline-block", fontFamily: BODY, fontWeight: 900, fontSize: 40, color: C.white, background: C.ink, padding: "8px 22px" }}>48 m² · ANA CADDE CEPHELİ</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 4 — empty shop becomes a finished store */
const Shop: React.FC = () => {
  const t = useT();
  const p = pr(t, 0.3, 4.4, Easing.linear);
  const done = t >= 4.4;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={D("v_shop.mp4")} video dur={5.8} rate={1.1} z={[1.0, 1.06]} />
      <Shade top={0.75} bot={0.92} />
      <div style={{ position: "absolute", right: 56, top: 300, width: 340 }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 2, textAlign: "center", padding: "10px 0", color: done ? C.ink : C.white, background: done ? C.yellow : "rgba(17,18,20,0.7)", border: `3px solid ${C.yellow}` }}>
          {done ? "✓ KULLANIMA HAZIR" : `DÖNÜŞÜM %${Math.round(p * 100)}`}
        </div>
        <div style={{ height: 8, marginTop: 8, background: "rgba(255,255,255,0.2)" }}>
          <div style={{ height: "100%", width: `${p * 100}%`, background: C.yellow }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 380 }}>
        <Up at={0.2}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 4, color: C.yellow }}>İSTANBUL'UN YÜKSELEN YATIRIM BÖLGESİ</div>
        </Up>
        <Up at={1.0}>
          <div style={{ fontFamily: HEAD, fontSize: 112, lineHeight: 1.05, color: C.white }}>GELECEĞİN</div>
        </Up>
        <Up at={1.2}>
          <div style={{ fontFamily: HEAD, fontSize: 112, lineHeight: 1.05 }}>
            <Mark at={1.5}>TİCARET MERKEZİ</Mark>
          </div>
        </Up>
        <Pop at={3.2} style={{ marginTop: 16 }}>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.white }}>Yerinizi alın!</span>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 5 — location with real footage proof */
const LocBadge: React.FC<{ at: number; out?: number; kicker: string; title: string; badge: string; icon: IconName }> = ({ at, out, kicker, title, badge, icon }) => (
  <Pop at={at} out={out} dist={80}>
    <div style={{ background: C.white, padding: "26px 28px", display: "flex", gap: 22, alignItems: "center", borderLeft: `14px solid ${C.yellow}`, boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
      <Icon n={icon} size={96} c={C.ink} />
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: C.red }}>{kicker}</div>
        <div style={{ fontFamily: HEAD, fontSize: 60, lineHeight: 1.08, color: C.ink }}>{title}</div>
        <div style={{ display: "inline-block", marginTop: 8, fontFamily: BODY, fontWeight: 900, fontSize: 34, background: C.ink, color: C.yellow, padding: "6px 16px", letterSpacing: 2 }}>{badge}</div>
      </div>
    </div>
  </Pop>
);

const Loc: React.FC = () => {
  const t = useT();
  const clip = t < 2.8 ? "sign" : t < 6.3 ? "street" : "mosque";
  const pin = spring({ frame: useCurrentFrame() - 6, fps: FPS, config: { damping: 8, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={R("v_hero.mp4")} video dur={8.7} rate={0.7} z={[1.25, 1.35]} filter="brightness(0.3) blur(10px)" />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ transform: `translateY(${(1 - pin) * -200}px)` }}>
          <Icon n="pin" size={90} c={C.yellow} sw={4} />
        </div>
        <Up at={0.2}>
          <div style={{ fontFamily: HEAD, fontSize: 80, color: C.white, lineHeight: 1.05 }}>EŞSİZ VE STRATEJİK KONUM</div>
        </Up>
      </div>
      {clip === "sign" && <RealCard key="a" src={R("sign.mp4")} dur={2.8} rate={0.65} at={0} style={{ right: 60, top: 470 }} />}
      {clip === "street" && <RealCard key="b" src={R("street.mp4")} dur={3.5} rate={1.2} at={2.8} style={{ right: 60, top: 470 }} />}
      {clip === "mosque" && <RealCard key="c" src={R("mosque.mp4")} dur={2.4} rate={0.85} at={6.3} style={{ right: 60, top: 470 }} />}
      <div style={{ position: "absolute", left: 50, width: 760, top: 1060 }}>
        {t < 6.3 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <LocBadge at={0.2} kicker="PLANLANAN" title="ESENYURT ÜNİVERSİTESİ KAMPÜSÜ" badge="TAM KARŞISINDA" icon="city" />
            <LocBadge at={2.9} kicker="PLANLANAN" title="ARNAVUTKÖY DEVLET HASTANESİ" badge="TAM KARŞISINDA" icon="hosp" />
          </div>
        ) : (
          <LocBadge at={6.3} kicker="KAVŞAK" title="3 FARKLI YÖNE AÇILAN YOL KAVŞAĞINDA" badge="KAVŞAK NOKTASINDA" icon="cross3" />
        )}
      </div>
    </AbsoluteFill>
  );
};

/** 6 — private kitchen / bath / WC with real footage */
const Wet: React.FC = () => (
  <AbsoluteFill style={{ background: C.yellow }}>
    <RealCard src={R("wet.mp4")} dur={3} rate={1.1} style={{ left: 60, top: 420, width: 520, height: 880 }} />
    <div style={{ position: "absolute", right: 50, top: 420, width: 420, display: "flex", flexDirection: "column", gap: 24 }}>
      <Up at={0.05}>
        <div style={{ fontFamily: HEAD, fontSize: 96, lineHeight: 1, color: C.ink }}>ÖZEL</div>
      </Up>
      {[
        { n: "kitchen" as IconName, l: "MUTFAK", at: 0.2 },
        { n: "bath" as IconName, l: "BANYO", at: 1.1 },
        { n: "wc" as IconName, l: "WC", at: 1.6 },
      ].map((x) => (
        <Pop key={x.l} at={x.at}>
          <div style={{ background: C.ink, padding: "22px 24px", display: "flex", alignItems: "center", gap: 20 }}>
            <Icon n={x.n} size={84} c={C.yellow} />
            <span style={{ fontFamily: HEAD, fontSize: 72, color: C.white }}>{x.l}</span>
          </div>
        </Pop>
      ))}
    </div>
  </AbsoluteFill>
);

/** 7 — proximity as road signs */
const SIGNS: { at: number; title: string; min: string; icon: IconName; bg: string }[] = [
  { at: 0.1, title: "ARNAVUTKÖY BELEDİYESİ", min: "1", icon: "city", bg: C.sign },
  { at: 2.6, title: "METRO İSTASYONU", min: "5", icon: "metro", bg: C.sign },
  { at: 3.3, title: "KUZEY MARMARA OTOYOLU", min: "5", icon: "road", bg: C.motorway },
  { at: 6.0, title: "İSTANBUL HAVALİMANI", min: "12", icon: "plane", bg: C.sign },
];
const Near: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={R("street.mp4")} video dur={8.7} rate={0.5} z={[1.2, 1.3]} filter="brightness(0.35) blur(6px)" />
      <div style={{ position: "absolute", left: 60, right: 60, top: 300 }}>
        <Up at={0.05}>
          <div style={{ fontFamily: HEAD, fontSize: 84, color: C.white, lineHeight: 1.05 }}>
            ÖNEMLİ NOKTALARA <span style={{ color: C.yellow }}>YAKINLIK</span>
          </div>
        </Up>
      </div>
      {/* sign pole */}
      <div style={{ position: "absolute", left: 150, top: 470, width: 26, bottom: 0, background: "linear-gradient(90deg,#7A7E84,#C9CCD1,#7A7E84)" }} />
      {SIGNS.map((sg, i) => {
        const p = spring({ frame: useCurrentFrame() - s(sg.at), fps: FPS, config: { damping: 12, stiffness: 120 } });
        return (
          <div
            key={sg.title}
            style={{
              position: "absolute",
              left: 90,
              right: 60,
              top: 500 + i * 270,
              height: 230,
              background: sg.bg,
              border: `6px solid ${C.white}`,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 30px",
              clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)",
              transform: `translateX(${(1 - p) * -1100}px)`,
              opacity: t >= sg.at ? 1 : 0,
            }}
          >
            <div style={{ background: C.white, borderRadius: 12, padding: 10 }}>
              <Icon n={sg.icon} size={90} c={sg.bg} sw={4} />
            </div>
            <div style={{ flex: 1, fontFamily: HEAD, fontSize: 56, lineHeight: 1.05, color: C.white }}>{sg.title}</div>
            <div style={{ textAlign: "center", marginRight: 60 }}>
              <div style={{ fontFamily: HEAD, fontSize: 120, lineHeight: 0.95, color: C.yellow }}>{sg.min}</div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: C.white, letterSpacing: 3 }}>DAKİKA</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 8 — amenities on a sliding shelf */
const AM: { at: number; t: string; icon: IconName; img?: string }[] = [
  { at: 0.1, t: "TOPLANTI SALONLARI", icon: "meeting", img: "end_meeting.png" },
  { at: 1.5, t: "GENİŞ ORTAK KULLANIM ALANLARI", icon: "sofa", img: "lounge.jpg" },
  { at: 3.4, t: "KAPALI OTOPARK", icon: "parking" },
  { at: 4.6, t: "7/24 PROFESYONEL GÜVENLİK", icon: "shield" },
  { at: 6.6, t: "7/24 KAMERA GÜVENLİK SİSTEMİ", icon: "camera" },
  { at: 8.1, t: "YANGIN ALGILAMA & OTOMATİK SPRINKLER", icon: "drops" },
];
const Amen: React.FC = () => {
  const t = useT();
  let cur = 0;
  AM.forEach((a, i) => {
    if (t >= a.at) cur = i;
  });
  const CARD = 760;
  const GAP = 40;
  const target = cur * (CARD + GAP);
  // smooth slide: interpolate between previous and current index
  const prevAt = AM[cur].at;
  const k = pr(t, prevAt, prevAt + 0.55, inOut);
  const x = 160 - ((cur - 1 + k) * (CARD + GAP));
  return (
    <AbsoluteFill style={{ background: C.steel }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300 }}>
        <Up at={0.05}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: C.yellow }}>PRESTİJLİ İŞ MERKEZİ</div>
        </Up>
        <Up at={0.2}>
          <div style={{ fontFamily: HEAD, fontSize: 104, color: C.white, lineHeight: 1 }}>OLANAKLARI</div>
        </Up>
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, height: 960, width: 1080, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: cur === 0 ? 160 - (k - 1) * 0 : x, display: "flex", gap: GAP }}>
          {AM.map((a, i) => (
            <div
              key={a.t}
              style={{
                width: CARD,
                height: 900,
                background: i === cur ? C.white : "#3A3E44",
                transform: `scale(${i === cur ? 1 : 0.88})`,
                transition: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {a.img ? (
                <Img src={R(a.img)} style={{ width: "100%", height: 560, objectFit: "cover", opacity: i === cur ? 1 : 0.4 }} />
              ) : (
                <div style={{ height: 560, display: "flex", alignItems: "center", justifyContent: "center", background: i === cur ? C.yellow : "#2F3237" }}>
                  <Icon n={a.icon} size={300} c={C.ink} sw={2.6} />
                </div>
              )}
              <div style={{ padding: "26px 34px", display: "flex", gap: 20, alignItems: "center" }}>
                <Icon n={a.icon} size={80} c={i === cur ? C.ink : "#8A8E94"} />
                <div style={{ fontFamily: HEAD, fontSize: 60, lineHeight: 1.08, color: i === cur ? C.ink : "#8A8E94" }}>{a.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1540, display: "flex", justifyContent: "center", gap: 12 }}>
        {AM.map((a, i) => (
          <div key={a.t} style={{ width: i === cur ? 70 : 22, height: 12, background: i <= cur ? C.yellow : "#55595F" }} />
        ))}
      </div>
      {target < 0 ? null : null}
    </AbsoluteFill>
  );
};

/** 9 — rising value */
const Rise: React.FC = () => {
  const t = useT();
  const line = pr(t, 0.3, 2.4, Easing.inOut(Easing.cubic));
  const L = 1400;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Media src={R("end_ext.png")} dur={5.1} z={[1.05, 1.15]} pos="55% 50%" />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(17,18,20,0.9) 0%, rgba(17,18,20,0.4) 35%, rgba(17,18,20,0.1) 55%, rgba(17,18,20,0.95) 100%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d="M40 1330 L230 1260 L380 1290 L540 1130 L690 1160 L860 960 L1040 820" fill="none" stroke={C.yellow} strokeWidth={12} strokeDasharray={L} strokeDashoffset={L * (1 - line)} strokeLinejoin="round" />
        <path d="M1040 820 l-46 4 l26 36 z" fill={C.yellow} opacity={line > 0.97 ? 1 : 0} />
      </svg>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300 }}>
        <Up at={0.1}>
          <div style={{ fontFamily: HEAD, fontSize: 104, color: C.white, lineHeight: 1.03 }}>ARNAVUTKÖY'ÜN</div>
        </Up>
        <Up at={0.3}>
          <div style={{ fontFamily: HEAD, fontSize: 104, lineHeight: 1.08 }}>
            <Mark at={0.6}>YÜKSELEN DEĞERİNDE</Mark>
          </div>
        </Up>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 380 }}>
        <Pop at={2.0}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 52, color: C.white }}>prestijli bir iş merkezinde</div>
          <div style={{ fontFamily: HEAD, fontSize: 130, lineHeight: 1.05, color: C.yellow }}>YERİNİZİ ALIN!</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

/** 10 — end card: shutter comes down, logo + phone on yellow */
const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sp = spring({ frame: f - 10, fps: FPS, config: { damping: 14, stiffness: 90 } });
  const down = 1 - pr(t, 0, 0.7, inOut);
  const pulse = 1 + 0.03 * Math.sin(t * Math.PI * 2.2);
  return (
    <AbsoluteFill style={{ background: C.yellow }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 380, background: C.white, padding: "60px 40px", display: "flex", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.18)", transform: `scale(${0.85 + 0.15 * sp})`, opacity: sp }}>
        <Img src={R("logo_dark.png")} style={{ width: 640 }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1180, textAlign: "center" }}>
        <Pop at={0.8}>
          <div style={{ fontFamily: HEAD, fontSize: 96, color: C.ink, lineHeight: 1 }}>HEMEN ARAYIN</div>
        </Pop>
        <Pop at={1.1} style={{ marginTop: 30 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, background: C.ink, padding: "30px 48px", transform: `scale(${pulse})` }}>
            <svg width={64} height={64} viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="none" stroke={C.yellow} strokeWidth={2} />
            </svg>
            <span style={{ fontFamily: HEAD, fontSize: 84, color: C.white, letterSpacing: 1 }}>{PHONE}</span>
          </div>
        </Pop>
        <Pop at={1.5} style={{ marginTop: 34 }}>
          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 44, color: C.ink }}>48 m² DÜKKÂN · 16.000.000 TL · ARNAVUTKÖY</span>
        </Pop>
      </div>
      <Shutter p={1 - down} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- global overlays */
const BrandCorner: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [12, 26, s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: C.white, padding: "14px 18px 10px", borderBottom: `6px solid ${C.yellow}`, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
      <Img src={R("logo_dark.png")} style={{ width: 210, display: "block" }} />
    </div>
  );
};

/** Red SATILIK ribbon, top-right */
const Ribbon: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [20, 34, s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", right: -70, top: 90, width: 380, transform: "rotate(38deg)", background: C.red, textAlign: "center", padding: "12px 0", opacity: o, boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}>
      <span style={{ fontFamily: HEAD, fontSize: 44, color: C.white, letterSpacing: 4 }}>SATILIK</span>
    </div>
  );
};

/** Scrolling ticker tape */
const Ticker: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [s(6.2), s(6.6), s(T.end[0]) - 6, s(T.end[0])], [0, 1, 1, 0], cl);
  const txt = "SATILIK DÜKKÂN  •  ANA CADDE CEPHELİ  •  48 m²  •  16.000.000 TL  •  ARNAVUTKÖY  •  İŞ MERKEZİNDE  •  ";
  const x = -((f * 4) % 2400);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1650, height: 74, background: C.yellow, overflow: "hidden", opacity: o, transform: "rotate(-2deg)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
      <div style={{ position: "absolute", left: x, top: 10, whiteSpace: "nowrap", fontFamily: HEAD, fontSize: 46, color: C.ink, letterSpacing: 2 }}>
        {txt}
        {txt}
        {txt}
      </div>
    </div>
  );
};

/** Quick shutter-slat wipe between scenes */
const Wipes: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = [T.front, T.price, T.shop, T.loc, T.wet, T.near, T.amen, T.rise].map((r) => s(r[0]));
  return (
    <>
      {cuts.map((c) => {
        const l = f - c;
        if (l < -8 || l > 8) return null;
        const p = interpolate(l, [-8, 0, 8], [0, 1, 0], { ...cl, easing: inOut });
        return (
          <AbsoluteFill key={c} style={{ pointerEvents: "none" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 160, height: 160 * p, background: i % 2 ? C.yellow : C.ink }} />
            ))}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: C.yellow }} />;
};

/* ============================================================ composition */
export const Dukkan: React.FC = () => {
  const music = (f: number) => interpolate(f, [0, 15, s(59.3), s(59.9), TOTAL - 40, TOTAL], [0, 0.2, 0.2, 0.45, 0.45, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Scene r={T.hook}><Hook /></Scene>
      <Scene r={T.front}><Front /></Scene>
      <Scene r={T.price}><Price /></Scene>
      <Scene r={T.shop}><Shop /></Scene>
      <Scene r={T.loc}><Loc /></Scene>
      <Scene r={T.wet}><Wet /></Scene>
      <Scene r={T.near}><Near /></Scene>
      <Scene r={T.amen}><Amen /></Scene>
      <Scene r={T.rise}><Rise /></Scene>
      <Scene r={T.end}><End /></Scene>

      <Ticker />
      <Wipes />
      <BrandCorner />
      <Ribbon />
      <Progress />

      <Audio src={D("vo.mp3")} />
      <Audio src={D("music.mp3")} volume={music} />
    </AbsoluteFill>
  );
};
