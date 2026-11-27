import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadKufi } from "@remotion/google-fonts/NotoKufiArabic";
import { loadFont as loadMont } from "@remotion/google-fonts/Montserrat";

const { fontFamily: AR } = loadKufi("normal", { weights: ["700", "800", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: LAT } = loadMont("normal", { weights: ["300", "500", "800", "900"], subsets: ["latin", "latin-ext"] });

export const FPS = 30;
export const TEASER_TOTAL = 450; // 15 s
const s = (x: number) => Math.round(x * FPS);
const A = (n: string) => staticFile(`bagcilar/a/${n}`);
const G = (n: string) => staticFile(`bagcilar/${n}`);

const C = { char: "#14110F", terra: "#9C4A2E", cream: "#F4ECE1", sand: "#E7CFA9", gold: "#E2B66B" };
const WARM = `linear-gradient(120deg, #FFE9C7 0%, ${C.sand} 25%, ${C.gold} 55%, #C97A55 100%)`;
const PHONE = "+90 534 878 42 22";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Shots on a 77-bpm grid (beat ≈ 0.78 s); cuts land on every 2nd/3rd beat */
const SHOTS = [
  { k: "build", from: 0, to: 3.9, dir: 1 },
  { k: "orbit", from: 3.9, to: 6.25, dir: -1 },
  { k: "partner", from: 6.25, to: 8.6, dir: 1 },
  { k: "flash", from: 8.6, to: 10.15, dir: -1 },
  { k: "end", from: 10.15, to: 15, dir: 1 },
] as const;
const W = 8; // whip frames on each side of a cut

/** Whip-pan wrapper: content slides + streaks + blurs through the cut */
const Whip: React.FC<{ len: number; dirIn: number; dirOut: number; first: boolean; last: boolean; children: React.ReactNode }> = ({ len, dirIn, dirOut, first, last, children }) => {
  const f = useCurrentFrame();
  const inP = first ? 1 : interpolate(f, [0, W], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const outP = last ? 0 : interpolate(f, [len - W, len], [0, 1], { ...cl, easing: Easing.in(Easing.cubic) });
  const x = (1 - inP) * dirIn * 900 - outP * dirOut * 900;
  const blur = (1 - inP) * 28 + outP * 28;
  const sc = 1 + (1 - inP) * 0.12 + outP * 0.12;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${x}px) scale(${sc}) skewX(${(x / 900) * -8}deg)`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ src: string; rate: number; start?: number; z: [number, number]; dur: number; filter?: string; pos?: string }> = ({ src, rate, start = 0, z, dur, filter, pos = "center" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, s(dur)], [0, 1], cl);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={src} muted playbackRate={rate} startFrom={s(start)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter, transform: `scale(${z[0] + (z[1] - z[0]) * p})` }} />
    </AbsoluteFill>
  );
};

const Still: React.FC<{ src: string; z: [number, number]; dur: number; x?: [number, number] }> = ({ src, z, dur, x = [0, 0] }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, s(dur)], [0, 1], { ...cl, easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z[0] + (z[1] - z[0]) * p}) translateX(${x[0] + (x[1] - x[0]) * p}%)` }} />
    </AbsoluteFill>
  );
};

/** letter-by-letter 3D reveal for Latin title */
const Letters: React.FC<{ text: string; at: number; size: number; spacing?: number; weight?: number; color?: string }> = ({ text, at, size, spacing = 6, weight = 900, color = C.cream }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", justifyContent: "center", perspective: 900, direction: "ltr" }}>
      {text.split("").map((ch, i) => {
        const sp = spring({ frame: f - s(at) - i * 1.6, fps: FPS, config: { damping: 13, stiffness: 140, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: LAT,
              fontWeight: weight,
              fontSize: size,
              letterSpacing: spacing,
              color,
              whiteSpace: "pre",
              opacity: Math.min(1, sp * 1.5),
              transform: `translateY(${(1 - sp) * 60}px) rotateX(${(1 - sp) * -90}deg)`,
              textShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const Rise: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(at), fps: FPS, config: { damping: 15, stiffness: 130 } });
  return <div style={{ ...style, opacity: Math.min(1, sp * 1.5), transform: `translateY(${(1 - sp) * 70}px)`, filter: `blur(${(1 - Math.min(1, sp)) * 8}px)` }}>{children}</div>;
};

const Line: React.FC<{ at: number; w?: number }> = ({ at, w = 260 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [s(at), s(at + 0.6)], [0, 1], { ...cl, easing: ease });
  return <div style={{ width: w * p, height: 4, background: WARM, margin: "18px auto", borderRadius: 2 }} />;
};

const Shade: React.FC<{ a?: number }> = ({ a = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(20,17,15,${a * 0.35}) 0%, rgba(20,17,15,${a}) 70%, rgba(20,17,15,${a + 0.2}) 100%)` }} />
);

/* ----------------------------------------------------------------- shots */
const Build: React.FC = () => (
  <AbsoluteFill style={{ background: C.char }}>
    <Clip src={G("v_transform.mp4")} rate={1.75} z={[1.25, 1.05]} dur={3.9} />
    <Shade a={0.45} />
    <AbsoluteFill style={{ justifyContent: "center" }}>
      <div style={{ marginTop: -80 }}>
        <Letters text="BAŞAK EVLER" at={0.5} size={64} spacing={18} weight={500} color={C.sand} />
        <Letters text="INTAYA" at={0.9} size={190} spacing={22} />
        <Line at={1.6} w={420} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Orbit: React.FC = () => (
  <AbsoluteFill style={{ background: C.char }}>
    <Clip src={G("v_orbit.mp4")} rate={2.2} z={[1.05, 1.2]} dur={2.35} />
    <Shade a={0.4} />
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 430 }}>
      <Rise at={0.25} style={{ textAlign: "center" }}>
        <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 96, color: C.cream, direction: "rtl", lineHeight: 1.4, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>غونشلي · إسطنبول</div>
        <div style={{ fontFamily: LAT, fontWeight: 500, fontSize: 34, letterSpacing: 14, color: C.sand }}>GÜNEŞLİ · ISTANBUL</div>
      </Rise>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Partner: React.FC = () => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f - s(0.2), fps: FPS, config: { damping: 15, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Clip src={G("v_living.mp4")} rate={0.9} z={[1.05, 1.15]} dur={2.35} />
      <Shade a={0.5} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1600 }}>
        <div
          style={{
            transform: `rotateY(${(1 - sp) * -70}deg) translateZ(${(1 - sp) * -500}px)`,
            opacity: Math.min(1, sp * 1.4),
            background: "linear-gradient(150deg, rgba(33,28,25,0.88), rgba(20,17,15,0.72))",
            border: "2px solid rgba(231,207,169,0.55)",
            borderRadius: 34,
            padding: "40px 56px",
            textAlign: "center",
            boxShadow: "0 50px 110px rgba(0,0,0,0.6)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div style={{ fontFamily: AR, fontWeight: 800, fontSize: 46, color: C.sand, direction: "rtl" }}>بالشراكة مع</div>
          <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 96, lineHeight: 1.45, direction: "rtl" }}>
            <span style={{ background: WARM, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>بلدية باغجلار</span>
          </div>
          <div style={{ fontFamily: LAT, fontWeight: 500, fontSize: 30, letterSpacing: 8, color: C.cream }}>BAĞCILAR BELEDİYESİ</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** three beat-cut flashes (0.52 s each) */
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const imgs = ["ext8.jpg", "IMG_4629.jpg", "ext1.jpg"];
  const seg = Math.min(2, Math.floor(f / s(0.52)));
  const local = f - seg * s(0.52);
  const flash = interpolate(local, [0, 3], [0.55, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Sequence from={seg * s(0.52)} durationInFrames={s(0.6)}>
        <Still src={A(imgs[seg])} z={[1.25, 1.08]} dur={0.55} x={[seg % 2 ? 3 : -3, 0]} />
      </Sequence>
      <AbsoluteFill style={{ background: `rgba(255,240,215,${flash})` }} />
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const logo = spring({ frame: f - s(0.1), fps: FPS, config: { damping: 14, stiffness: 90 } });
  const pulse = 1 + 0.03 * Math.sin(t * Math.PI * 2 * (77 / 60));
  const sweep = interpolate(t, [1.6, 2.6], [-30, 130], cl);
  return (
    <AbsoluteFill style={{ background: C.char }}>
      <Clip src={G("v_orbit.mp4")} rate={0.5} start={2} z={[1.3, 1.4]} dur={4.85} filter="blur(14px) brightness(0.35)" />
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", transform: `rotateY(${(1 - logo) * 90}deg)`, opacity: Math.min(1, logo * 1.5) }}>
          <div style={{ background: C.cream, borderRadius: 40, padding: "40px 46px", boxShadow: "0 50px 120px rgba(0,0,0,0.6)" }}>
            <Img src={A("logo_dark.png")} style={{ width: 470, display: "block" }} />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 50, right: 50, top: 980, textAlign: "center" }}>
        <Letters text="BAŞAK EVLER INTAYA" at={0.5} size={44} spacing={8} weight={800} color={C.sand} />
        <Rise at={0.9} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 64, color: C.cream, direction: "rtl", lineHeight: 1.5 }}>
            باقي التفاصيل
            <br />
            <span style={{ background: WARM, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>عند التواصل</span>
          </div>
        </Rise>
        <Rise at={1.4} style={{ marginTop: 36 }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 20, background: WARM, padding: "26px 46px", borderRadius: 999, overflow: "hidden", transform: `scale(${pulse})`, boxShadow: "0 25px 70px rgba(226,182,107,0.45)" }}>
            <svg width={56} height={56} viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="none" stroke={C.char} strokeWidth={2} />
            </svg>
            <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 60, color: C.char, letterSpacing: 1 }}>{PHONE}</span>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${sweep - 15}%, rgba(255,255,255,0.6) ${sweep}%, transparent ${sweep + 15}%)` }} />
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

const COMPS: Record<string, React.FC> = { build: Build, orbit: Orbit, partner: Partner, flash: Flash, end: End };

/** persistent logo (hidden on the end card where the big logo lives) */
const Corner: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [6, 16, s(10.15) - 6, s(10.15)], [0, 1, 1, 0], cl);
  return (
    <div style={{ position: "absolute", left: 44, top: 56, opacity: o, background: "rgba(244,236,225,0.95)", padding: "14px 18px 10px", borderRadius: 20, borderBottom: `5px solid ${C.terra}` }}>
      <Img src={A("logo_dark.png")} style={{ width: 200, display: "block" }} />
    </div>
  );
};

const Bars: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "#000" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "#000" }} />
  </>
);

export const BagcilarTeaser: React.FC = () => {
  const vol = (f: number) => interpolate(f, [0, 6, TEASER_TOTAL - 25, TEASER_TOTAL], [0, 0.9, 0.9, 0], cl);
  return (
    <AbsoluteFill style={{ background: C.char }}>
      {SHOTS.map((sh, i) => {
        const Comp = COMPS[sh.k];
        const from = Math.max(0, s(sh.from) - (i === 0 ? 0 : W));
        const to = s(sh.to) + (i === SHOTS.length - 1 ? 0 : W);
        const prev = SHOTS[i - 1];
        return (
          <Sequence key={sh.k} from={from} durationInFrames={to - from}>
            <Whip len={to - from} dirIn={prev ? prev.dir : 1} dirOut={sh.dir} first={i === 0} last={i === SHOTS.length - 1}>
              <Comp />
            </Whip>
          </Sequence>
        );
      })}
      <Corner />
      <Bars />
      <Audio src={G("teaser_music.mp3")} volume={vol} />
    </AbsoluteFill>
  );
};
