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
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: SANS } = loadMontserrat("normal", {
  weights: ["500", "600", "700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: SERIF } = loadPlayfair("italic", {
  weights: ["600", "700"],
  subsets: ["latin", "latin-ext"],
});

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const f = (name: string) => staticFile(`arnavutkoy/${name}`);

// Brand palette
const BRONZE = "#C99463";
const BRONZE_LIGHT = "#E8C39A";
const BRONZE_DEEP = "#8A5A36";
const INK = "#0D0B09";
const CREAM = "#F6EFE6";
const GOLD_GRAD = `linear-gradient(180deg, #FFE7C4 0%, ${BRONZE_LIGHT} 35%, ${BRONZE} 70%, ${BRONZE_DEEP} 100%)`;

const PHONE = "+90 534 878 42 22";

/* ---------------------------------- scene timing (seconds, synced to VO) --------------------------------- */
const T = {
  hook: [0, 8.3],
  location: [8.3, 18.7],
  proximity: [18.7, 28.6],
  officeA: [28.6, 34.4],
  officeB: [34.4, 39.3],
  officeC: [39.3, 44.0],
  amenities: [44.0, 50.8],
  price: [50.8, 57.3],
  end: [57.3, 64.0],
} as const;
export const TOTAL_FRAMES = s(64);

/* ---------------------------------------------- primitives ------------------------------------------------ */

const useLocalSec = () => {
  const frame = useCurrentFrame();
  return frame / FPS;
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Masked slide-up reveal for big type */
const Reveal: React.FC<{
  at: number; // seconds, local to the Sequence
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
  out?: number; // optional local second to fade out
}> = ({ at, children, style, dur = 0.7, out }) => {
  const t = useLocalSec();
  const p = interpolate(t, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const o = out !== undefined ? interpolate(t, [out, out + 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ overflow: "hidden", ...style, opacity: o }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

const FadeUp: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number; out?: number }> = ({
  at,
  children,
  style,
  dist = 40,
  out,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - s(at), fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  const t = frame / fps;
  const o = out !== undefined ? interpolate(t, [out, out + 0.35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ ...style, opacity: Math.min(sp, 1) * o, transform: `translateY(${(1 - sp) * dist}px)` }}>{children}</div>
  );
};

const KenBurns: React.FC<{
  src: string;
  from?: number;
  to?: number;
  x?: [number, number];
  y?: [number, number];
  pos?: string;
  durSec: number;
  filter?: string;
}> = ({ src, from = 1.08, to = 1.22, x = [0, 0], y = [0, 0], pos = "center", durSec, filter }) => {
  const t = useLocalSec();
  const p = interpolate(t, [0, durSec], [0, 1], { extrapolateRight: "clamp" });
  const sc = from + (to - from) * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: pos,
          transform: `scale(${sc}) translate(${x[0] + (x[1] - x[0]) * p}%, ${y[0] + (y[1] - y[0]) * p}%)`,
          filter,
        }}
      />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ src: string; rate?: number; pos?: string; filter?: string; zoom?: [number, number]; durSec: number }> = ({
  src,
  rate = 1,
  pos = "center",
  filter,
  zoom = [1.0, 1.06],
  durSec,
}) => {
  const t = useLocalSec();
  const sc = interpolate(t, [0, durSec], zoom, { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={src}
        muted
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${sc})`, filter }}
      />
    </AbsoluteFill>
  );
};

const Shade: React.FC<{ top?: number; bottom?: number; flat?: number }> = ({ top = 0.75, bottom = 0.85, flat = 0 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(13,11,9,${top}) 0%, rgba(13,11,9,0) 34%, rgba(13,11,9,0) 52%, rgba(13,11,9,${bottom}) 100%)`,
    }}
  >
    {flat > 0 && <AbsoluteFill style={{ background: `rgba(13,11,9,${flat})` }} />}
  </AbsoluteFill>
);

/** Section chapter marker: big outlined number + label */
const Chapter: React.FC<{ n: string; label: string; at?: number; top?: number }> = ({ n, label, at = 0.1, top = 300 }) => {
  const t = useLocalSec();
  const line = interpolate(t, [at + 0.15, at + 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <div style={{ position: "absolute", left: 64, right: 64, top }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Reveal at={at}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 92,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `2.5px ${BRONZE_LIGHT}`,
              letterSpacing: -2,
            }}
          >
            {n}
          </div>
        </Reveal>
        <div style={{ flex: 1 }}>
          <div style={{ height: 3, width: `${line * 100}%`, background: GOLD_GRAD.replace("180deg", "90deg"), marginBottom: 12 }} />
          <Reveal at={at + 0.2}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: CREAM, textTransform: "uppercase" }}>
              {label}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

const GoldText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    style={{
      background: GOLD_GRAD,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))",
      ...style,
    }}
  >
    {children}
  </span>
);

/** Glassy pill with bronze edge */
const Chip: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 18,
      padding: "22px 34px",
      borderRadius: 26,
      background: "rgba(13,11,9,0.62)",
      border: `2px solid rgba(232,195,154,0.55)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      backdropFilter: "blur(14px)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** "Before → after" progress tag shown on transformation clips */
const BuildTag: React.FC<{ durSec: number; doneAt: number; top?: number }> = ({ durSec, doneAt, top = 300 }) => {
  const t = useLocalSec();
  const p = interpolate(t, [0.3, doneAt], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = t >= doneAt;
  const o = interpolate(t, [0, 0.3, durSec - 0.4, durSec], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right: 56, top, opacity: o, width: 330 }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 3,
          color: done ? INK : CREAM,
          background: done ? GOLD_GRAD : "rgba(13,11,9,0.6)",
          border: `2px solid ${BRONZE_LIGHT}`,
          borderRadius: 999,
          padding: "12px 22px",
          textAlign: "center",
        }}
      >
        {done ? "✓ TESLİME HAZIR" : `İNŞAAT  %${Math.round(p * 100)}`}
      </div>
      <div style={{ height: 6, marginTop: 10, borderRadius: 6, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p * 100}%`, background: GOLD_GRAD.replace("180deg", "90deg") }} />
      </div>
    </div>
  );
};

/** Scene wrapper: soft zoom-in entrance + quick light flash at the start */
const Scene: React.FC<{ range: readonly [number, number]; children: React.ReactNode; flash?: boolean }> = ({
  range,
  children,
  flash = true,
}) => {
  const from = s(range[0]);
  const dur = s(range[1]) - from;
  return (
    <Sequence from={from} durationInFrames={dur} premountFor={30}>
      <SceneInner dur={dur} flash={flash}>
        {children}
      </SceneInner>
    </Sequence>
  );
};

const SceneInner: React.FC<{ dur: number; flash: boolean; children: React.ReactNode }> = ({ dur, flash, children }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const flashO = flash ? interpolate(frame, [0, 2, 9], [0.0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const outO = interpolate(frame, [dur - 6, dur], [1, 0.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: (flash ? Math.min(1, inP * 1.5) : 1) * (0.35 + 0.65 * outO), transform: `scale(${1.04 - 0.04 * inP})` }}>
      {children}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, rgba(255,226,186,${flashO}) 0%, rgba(255,226,186,${flashO * 0.4}) 60%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};

/* --------------------------------------------- persistent overlays ----------------------------------------- */

const BrandCorner: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [8, 24, s(T.end[0]) - 8, s(T.end[0])], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: 56,
        opacity: o,
        padding: "18px 22px 14px",
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(13,11,9,0.55), rgba(13,11,9,0.25))",
        border: "1.5px solid rgba(232,195,154,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Img src={f("logo_light.png")} style={{ width: 230, display: "block", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }} />
    </div>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.16 }}>
      <svg width="100%" height="100%">
        <filter id={`n${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#n${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
);

/** Thin timeline bar at the very bottom */
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const p = frame / TOTAL_FRAMES;
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${p * 100}%`, background: GOLD_GRAD.replace("180deg", "90deg") }} />
  );
};

/* ----------------------------------------------------- scenes --------------------------------------------- */

const Hook: React.FC = () => {
  const dur = T.hook[1] - T.hook[0];
  return (
    <>
      <Clip src={f("v_building.mp4")} rate={0.78} pos="62% 50%" durSec={dur} zoom={[1.0, 1.08]} />
      <Shade top={0.8} bottom={0.95} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 45%, rgba(13,11,9,0.55) 70%, rgba(13,11,9,0.85) 100%)" }} />
      <BuildTag durSec={dur} doneAt={6.6} top={330} />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 330 }}>
        <Reveal at={0.15}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 72, letterSpacing: 6, color: BRONZE_LIGHT, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>ARNAVUTKÖY'DE</div>
        </Reveal>
        <Reveal at={0.35}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 196, lineHeight: 0.95, letterSpacing: -4, color: CREAM }}>
            SATILIK
          </div>
        </Reveal>
        <Reveal at={0.6}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 104, lineHeight: 1.0, letterSpacing: -1 }}>
            <GoldText>KOMPLE İŞ</GoldText>
          </div>
        </Reveal>
        <Reveal at={0.8}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 104, lineHeight: 1.05, letterSpacing: -1 }}>
            <GoldText>MERKEZİ</GoldText>
          </div>
        </Reveal>
        <FadeUp at={3.0} style={{ marginTop: 28 }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 54, lineHeight: 1.2, color: CREAM }}>
            Geleceğin ticaret merkezinde
            <br />
            <span style={{ color: BRONZE_LIGHT }}>yerinizi alın.</span>
          </div>
        </FadeUp>
      </div>
    </>
  );
};

const LocCard: React.FC<{ at: number; kicker: string; title: string; badge: string; out?: number }> = ({ at, kicker, title, badge, out }) => (
  <FadeUp at={at} out={out} style={{ marginBottom: 26 }}>
    <Chip style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "26px 34px" }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: BRONZE_LIGHT }}>{kicker}</div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 58, lineHeight: 1.05, color: CREAM }}>{title}</div>
      <div
        style={{
          marginTop: 8,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 40,
          letterSpacing: 2,
          color: INK,
          background: GOLD_GRAD,
          borderRadius: 14,
          padding: "8px 20px",
        }}
      >
        {badge}
      </div>
    </Chip>
  </FadeUp>
);

const Location: React.FC = () => {
  const dur = T.location[1] - T.location[0];
  const t = useLocalSec();
  // Hero building (16:9) in the upper band, blurred fill behind
  const kav = interpolate(t, [7.9, 8.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Clip src={f("v_hero.mp4")} rate={0.6} durSec={dur} filter="blur(28px) brightness(0.55)" zoom={[1.3, 1.35]} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, height: 608, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <Clip src={f("v_hero.mp4")} rate={0.6} durSec={dur} zoom={[1.0, 1.1]} />
        <AbsoluteFill style={{ opacity: kav }}>
          <KenBurns src={f("view_road.jpg")} durSec={3} from={1.05} to={1.15} pos="50% 70%" />
        </AbsoluteFill>
        <div style={{ position: "absolute", inset: 0, border: `3px solid rgba(232,195,154,0.6)` }} />
      </div>
      <Shade top={0.6} bottom={0.8} flat={0.1} />
      <Chapter n="01" label="Eşsiz ve stratejik konum" at={0.1} top={310} />
      <div style={{ position: "absolute", left: 56, right: 56, top: 1110 }}>
        <LocCard at={2.1} out={7.7} kicker="PLANLANAN" title="Esenyurt Üniversitesi Kampüsü" badge="TAM KARŞISINDA" />
        <LocCard at={4.7} out={7.7} kicker="PLANLANAN" title="Arnavutköy Devlet Hastanesi" badge="TAM KARŞISINDA" />
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 1150 }}>
        <FadeUp at={8.0}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 260, lineHeight: 0.85 }}>
              <GoldText>3</GoldText>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 68, lineHeight: 1.05, color: CREAM }}>
              YÖNE AÇILAN
              <br />
              YOL KAVŞAĞINDA
            </div>
          </div>
        </FadeUp>
      </div>
    </>
  );
};

const ProxRow: React.FC<{ at: number; num: number; unit: string; label: string; icon: string }> = ({ at, num, unit, label, icon }) => {
  const t = useLocalSec();
  const p = interpolate(t, [at, at + 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const shown = Math.max(1, Math.round(num * p));
  const R = 62;
  const C = 2 * Math.PI * R;
  return (
    <FadeUp at={at} dist={60} style={{ marginBottom: 46 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
          padding: "22px 30px",
          borderRadius: 30,
          background: "rgba(13,11,9,0.6)",
          border: "2px solid rgba(232,195,154,0.4)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
          <svg width={150} height={150} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={75} cy={75} r={R} stroke="rgba(255,255,255,0.15)" strokeWidth={8} fill="none" />
            <circle cx={75} cy={75} r={R} stroke={BRONZE_LIGHT} strokeWidth={8} fill="none" strokeDasharray={C} strokeDashoffset={C * (1 - p)} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{icon}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: CREAM }}>{label}</div>
        </div>
        <div style={{ textAlign: "right", minWidth: 190 }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 118, lineHeight: 0.9 }}>
            <GoldText>{shown}</GoldText>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: BRONZE_LIGHT }}>{unit}</div>
        </div>
      </div>
    </FadeUp>
  );
};

const Proximity: React.FC = () => {
  const dur = T.proximity[1] - T.proximity[0];
  return (
    <>
      <KenBurns src={f("view_hotel.jpg")} durSec={dur} from={1.1} to={1.28} y={[0, -2]} pos="50% 60%" filter="brightness(0.8) saturate(1.1)" />
      <Shade top={0.75} bottom={0.75} flat={0.35} />
      <Chapter n="02" label="Önemli noktalara yakınlık" at={0.1} top={310} />
      <div style={{ position: "absolute", left: 50, right: 50, top: 590 }}>
        <ProxRow at={0.25} num={1} unit="DAKİKA" label="Arnavutköy Belediyesi" icon="🏛️" />
        <ProxRow at={2.9} num={5} unit="DAKİKA" label="Metro İstasyonu" icon="🚇" />
        <ProxRow at={4.6} num={5} unit="DAKİKA" label="Kuzey Marmara Otoyolu" icon="🛣️" />
        <ProxRow at={6.9} num={12} unit="DAKİKA" label="İstanbul Havalimanı" icon="✈️" />
      </div>
    </>
  );
};

const FeatureLine: React.FC<{ at: number; big: string; small?: string; out?: number }> = ({ at, big, small, out }) => (
  <FadeUp at={at} out={out} style={{ marginTop: 22 }}>
    <Chip style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 62, lineHeight: 1.02, color: CREAM }}>{big}</div>
      {small && <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 1, color: BRONZE_LIGHT }}>{small}</div>}
    </Chip>
  </FadeUp>
);

const OfficeA: React.FC = () => {
  const dur = T.officeA[1] - T.officeA[0];
  return (
    <>
      <Clip src={f("v_exec.mp4")} rate={1.0} durSec={dur} pos="50% 50%" />
      <Shade top={0.75} bottom={0.9} />
      <Chapter n="03" label="Modern & anahtar teslim" at={0.1} top={310} />
      <BuildTag durSec={dur} doneAt={5.4} top={470} />
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 330 }}>
        <Reveal at={0.3}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 0.98, color: CREAM, letterSpacing: -2 }}>ANAHTAR</div>
        </Reveal>
        <Reveal at={0.5}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 1.0, letterSpacing: -2 }}>
            <GoldText>TESLİM OFİSLER</GoldText>
          </div>
        </Reveal>
        <FeatureLine at={2.6} big="Mutfak · Banyo · WC" small="Her ofise özel" />
      </div>
    </>
  );
};

const OfficeB: React.FC = () => {
  const dur = T.officeB[1] - T.officeB[0];
  return (
    <>
      <Clip src={f("v_lounge.mp4")} rate={1.22} durSec={dur} pos="50% 50%" />
      <Shade top={0.7} bottom={0.9} />
      <BuildTag durSec={dur} doneAt={4.0} top={330} />
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 330 }}>
        <FeatureLine at={0.2} big="Mitsubishi VRV" small="Merkezi ısıtma & soğutma sistemi" />
        <FeatureLine at={3.1} big="Akıllı Ofis Otomasyonu" small="Uzaktan kontrol edilebilir" />
      </div>
    </>
  );
};

const OfficeC: React.FC = () => {
  const dur = T.officeC[1] - T.officeC[0];
  const t = useLocalSec();
  const sw = interpolate(t, [2.0, 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <>
      <KenBurns src={f("kitchen.jpg")} durSec={dur} from={1.12} to={1.25} pos="40% 50%" />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${(1 - sw) * 100}%)` }}>
        <KenBurns src={f("office_clean.png")} durSec={dur} from={1.05} to={1.15} pos="50% 50%" />
      </div>
      <Shade top={0.7} bottom={0.9} />
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 330 }}>
        <FeatureLine at={0.15} big="Ses & Isı Yalıtımı" small="Üst düzey yalıtımlı yapı sistemi" />
        <FeatureLine at={2.2} big="Yükseltilmiş Döşeme" small="Yangına dayanıklı · İthal sistem" />
      </div>
    </>
  );
};

const AMEN = [
  { at: 0.2, icon: "🛎️", label: "Profesyonel Resepsiyon" },
  { at: 1.6, icon: "🤝", label: "Toplantı Salonları" },
  { at: 3.0, icon: "🅿️", label: "Kapalı Otopark" },
  { at: 4.2, icon: "🛡️", label: "7/24 Güvenlik" },
  { at: 4.9, icon: "📹", label: "7/24 Kamera Sistemi" },
  { at: 5.5, icon: "🔥", label: "Sprinkler & Yangın Algılama" },
];

const Amenities: React.FC = () => {
  const dur = T.amenities[1] - T.amenities[0];
  return (
    <>
      <Clip src={f("v_meeting.mp4")} rate={0.9} durSec={dur} pos="50% 50%" />
      <Shade top={0.7} bottom={0.92} flat={0.05} />
      <Chapter n="04" label="Prestijli iş merkezi olanakları" at={0.05} top={310} />
      <BuildTag durSec={dur} doneAt={5.0} top={470} />
      <div
        style={{
          position: "absolute",
          left: 44,
          right: 44,
          bottom: 300,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {AMEN.map((a) => (
          <FadeUp key={a.label} at={a.at} dist={50}>
            <div
              style={{
                height: 168,
                borderRadius: 26,
                padding: "20px 22px",
                background: "rgba(13,11,9,0.66)",
                border: "2px solid rgba(232,195,154,0.45)",
                backdropFilter: "blur(14px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 50 }}>{a.icon}</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, lineHeight: 1.1, color: CREAM }}>{a.label}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </>
  );
};

const Price: React.FC = () => {
  const dur = T.price[1] - T.price[0];
  const t = useLocalSec();
  const p = interpolate(t, [3.3, 4.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const val = Math.round((8500000 * p) / 10000) * 10000;
  const priceStr = val.toLocaleString("tr-TR");
  const shine = interpolate(t, [4.7, 5.6], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <KenBurns src={f("end_exec.png")} durSec={dur} from={1.08} to={1.2} y={[2, -2]} pos="50% 50%" filter="brightness(0.6)" />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(13,11,9,0.35) 0%, rgba(13,11,9,0.88) 75%)" }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 480, textAlign: "center" }}>
        <Reveal at={0.1}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: BRONZE_LIGHT }}>OFİSİN SATIŞ FİYATI</div>
        </Reveal>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 50 }}>
          <FadeUp at={0.3}>
            <div style={{ border: `3px solid ${BRONZE_LIGHT}`, borderRadius: 32, padding: "26px 40px", background: "rgba(13,11,9,0.5)" }}>
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 132, lineHeight: 0.95, color: CREAM }}>
                85<span style={{ fontSize: 70 }}> m²</span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: BRONZE_LIGHT, marginTop: 6 }}>OFİS ALANI</div>
            </div>
          </FadeUp>
          <FadeUp at={0.55}>
            <div style={{ border: `3px solid ${BRONZE_LIGHT}`, borderRadius: 32, padding: "26px 40px", background: "rgba(13,11,9,0.5)" }}>
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 132, lineHeight: 0.95, color: CREAM }}>
                4.<span style={{ fontSize: 70 }}> KAT</span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: BRONZE_LIGHT, marginTop: 6 }}>BULUNDUĞU KAT</div>
            </div>
          </FadeUp>
        </div>
        <FadeUp at={3.2} style={{ marginTop: 110 }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 60, color: CREAM }}>sadece</div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 148, lineHeight: 1, letterSpacing: -3 }}>
              <GoldText>{priceStr}</GoldText>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, transparent ${shine - 20}%, rgba(255,255,255,0.55) ${shine}%, transparent ${shine + 20}%)`,
                mixBlendMode: "overlay",
              }}
            />
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 92, letterSpacing: 10, color: CREAM, marginTop: 4 }}>TL</div>
        </FadeUp>
      </div>
    </>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 90 } });
  const pulse = 1 + 0.03 * Math.sin((frame / fps) * Math.PI * 2 * 1.2);
  const t = frame / fps;
  const ring = interpolate(t, [0.2, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <>
      <KenBurns src={f("building_clean.png")} durSec={6.7} from={1.6} to={1.75} pos="45% 55%" filter="blur(10px) brightness(0.35)" />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(46,33,24,0.55) 0%, ${INK} 85%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div
          style={{
            width: 700,
            height: 700,
            borderRadius: "50%",
            border: `2px solid rgba(232,195,154,${0.5 * ring})`,
            position: "absolute",
            top: 330,
            transform: `scale(${0.8 + 0.2 * ring})`,
          }}
        />
        <div style={{ position: "absolute", top: 420, transform: `scale(${0.7 + 0.3 * sp})`, opacity: sp }}>
          <Img src={f("logo_light.png")} style={{ width: 620 }} />
        </div>
        <div style={{ position: "absolute", top: 1180, left: 60, right: 60, textAlign: "center" }}>
          <FadeUp at={0.8}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: 10, color: BRONZE_LIGHT }}>HEMEN ARAYIN</div>
          </FadeUp>
          <FadeUp at={1.1} style={{ marginTop: 26 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 22,
                padding: "30px 48px",
                borderRadius: 999,
                background: GOLD_GRAD,
                boxShadow: "0 25px 60px rgba(201,148,99,0.35)",
                transform: `scale(${pulse})`,
              }}
            >
              <span style={{ fontSize: 64 }}>📞</span>
              <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 76, color: INK, letterSpacing: 1 }}>{PHONE}</span>
            </div>
          </FadeUp>
          <FadeUp at={1.6} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 50, color: CREAM }}>Bu fırsatı kaçırmayın.</div>
          </FadeUp>
        </div>
      </AbsoluteFill>
    </>
  );
};

/* --------------------------------------------------- composition ------------------------------------------- */

export const Arnavutkoy: React.FC = () => {
  const musicVol = (fr: number) =>
    interpolate(fr, [0, 20, s(60.6), s(61.2), TOTAL_FRAMES - 45, TOTAL_FRAMES], [0, 0.2, 0.2, 0.4, 0.4, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Scene range={T.hook} flash={false}>
        <Hook />
      </Scene>
      <Scene range={T.location}>
        <Location />
      </Scene>
      <Scene range={T.proximity}>
        <Proximity />
      </Scene>
      <Scene range={T.officeA}>
        <OfficeA />
      </Scene>
      <Scene range={T.officeB}>
        <OfficeB />
      </Scene>
      <Scene range={T.officeC}>
        <OfficeC />
      </Scene>
      <Scene range={T.amenities}>
        <Amenities />
      </Scene>
      <Scene range={T.price}>
        <Price />
      </Scene>
      <Scene range={T.end}>
        <EndCard />
      </Scene>

      <Vignette />
      <Grain />
      <BrandCorner />
      <Progress />

      <Audio src={f("vo.mp3")} volume={1} />
      <Audio src={f("music.mp3")} volume={musicVol} />
    </AbsoluteFill>
  );
};
