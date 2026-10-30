import {
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls, RoundedBox, SoftShadows } from "@react-three/drei";
import * as THREE from "three";

import { CapsuleMesh } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

const SITE_CAPSULES = CAPSULES.map((capsule, index) => ({
  ...capsule,
  videoSrc: `${import.meta.env.BASE_URL}clips/site-${String(index + 1).padStart(2, "0")}.m4v`,
}));

/**
 * MUSEUM — Direction A: Editorial catalog.
 *
 * Shelf view: pure 3D scene with corner-mounted archival metadata and a
 * small masthead title at the top. No visible chrome on the scene itself.
 *
 * Detail view: on click, camera dollies so the capsule sits in the LEFT
 * half of the frame; the right half fills with an editorial panel —
 * eyebrow, big display title, prose caption, specification table.
 */

// -------- Editorial content per capsule --------
type CapsuleMeta = {
  code: string;
  category: string;
  title: string[];
  description: string;
  location: string;
  date: string;
  duration: string;
  tint: string;
  people: string;
};

type MuseumSound = "open" | "tick" | "close";

function useMuseumAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const lastPlayed = useRef(0);

  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close().catch(() => {});
  }, []);

  return useCallback((kind: MuseumSound) => {
    // Keep rapid clicks from accumulating into a loud burst.
    const stamp = performance.now();
    if (stamp - lastPlayed.current < 75) return;
    lastPlayed.current = stamp;
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      const play = () => {
        if (contextRef.current !== context || context.state !== "running") return;
        const start = context.currentTime + 0.005;
        const tone = (frequency: number, endFrequency: number, volume: number, duration: number, delay = 0) => {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          const time = start + delay;
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, time);
          oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
          envelope.gain.setValueAtTime(0, time);
          envelope.gain.linearRampToValueAtTime(volume, time + 0.004);
          envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          oscillator.connect(envelope);
          envelope.connect(context.destination);
          oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
          oscillator.start(time);
          oscillator.stop(time + duration + 0.01);
        };

        if (kind === "open") {
          tone(180, 95, 0.065, 0.11);
          tone(1480, 1430, 0.025, 0.24, 0.015);
          tone(2240, 2180, 0.008, 0.14, 0.018);
        } else if (kind === "tick") {
          tone(460, 210, 0.045, 0.055);
          tone(1720, 1350, 0.016, 0.075);
        } else {
          tone(230, 85, 0.06, 0.13);
          tone(960, 680, 0.016, 0.1);
        }
      };
      if (context.state === "suspended") void context.resume().then(play).catch(() => {});
      else play();
    } catch {
      // Audio availability must never interrupt camera interactions.
    }
  }, []);
}

const CAPSULE_META: CapsuleMeta[] = [
  {
    code: "M-01",
    category: "TRAVEL",
    title: ["ITALY", "MK.I"],
    description:
      "Roma at dusk, dust from the streets still on the lens. A short handheld take that came back thinner and warmer than expected.",
    location: "ROMA · IT",
    date: "AUG 2024",
    duration: "0:14",
    tint: "WARM",
    people: "3",
  },
  {
    code: "M-02",
    category: "TRAVEL",
    title: ["EGYPT", "MK.II"],
    description:
      "Late afternoon at Giza. Camera on the tripod. Wind carried more than it should have. Kept the whole take.",
    location: "GIZA · EG",
    date: "MAR 2024",
    duration: "0:22",
    tint: "SAND",
    people: "2",
  },
  {
    code: "M-03",
    category: "TRAVEL",
    title: ["HK", "MK.III"],
    description:
      "Nathan Road, an hour before rain. Neon soaked the sensor. One of the takes that convinced me the archive was worth keeping.",
    location: "HONG KONG",
    date: "OCT 2023",
    duration: "0:18",
    tint: "NEON",
    people: "8",
  },
  {
    code: "M-04",
    category: "LANDSCAPE",
    title: ["GUIZHOU", "MK.IV"],
    description:
      "Karst mountains, low fog. The path from the guesthouse to the rock. Almost every frame is green.",
    location: "GUIZHOU · CN",
    date: "MAY 2024",
    duration: "0:26",
    tint: "MOSS",
    people: "1",
  },
  {
    code: "M-05",
    category: "TRAVEL",
    title: ["FLORENCE", "MK.V"],
    description:
      "The wall of the Duomo, seen from too close. A quiet afternoon. Kept for the tone rather than the subject.",
    location: "FIRENZE · IT",
    date: "AUG 2024",
    duration: "0:23",
    tint: "STONE",
    people: "3",
  },
  {
    code: "M-06",
    category: "OCEAN",
    title: ["MALDIVES", "MK.VI"],
    description:
      "Low tide, an hour after dawn. The reef under the water made the whole strip iridescent. Favourite to look at while working.",
    location: "MALÉ ATOLL",
    date: "JUN 2024",
    duration: "0:31",
    tint: "AZURE",
    people: "2",
  },
];

// -------- 3D scene constants --------
const PILL_OFFSET = 0.663;
/* Yaw around Y — turned further so the pill's clean live-video face
   (the shader's LEFT face) rotates into view. 0.32 rad showed mostly
   the trailing slit-scan face; 0.78 rad gives a 3/4 view where both
   the clean face and the trail read clearly. */
const PILL_ROTATION: [number, number, number] = [0, 0.78, 0];

/* NYT "ABCs of CBD" composition — two matte-white shelves stacked
   vertically, viewed almost frontally with a small tilt. Narrower
   than the frame so there's clear breathing room around the shelves. */
const SHELF_WIDTH = 12.4;
const SHELF_DEPTH = 3.8;
const SHELF_THICKNESS = 0.085;
const SHELF1_TOP_Y = 0.5;
const SHELF2_TOP_Y = 3.0;

/* Column X positions. At the wider yaw (0.78 rad) each pill's X
   footprint is ~2.85, so ±3.6 keeps a clean ~0.75-unit gap between
   adjacent capsules. */
const COLS = [-3.9, 0, 3.9];

const POSITIONS: Array<[number, number, number]> = [
  [COLS[0], SHELF1_TOP_Y + PILL_OFFSET, 0],
  [COLS[1], SHELF1_TOP_Y + PILL_OFFSET, 0],
  [COLS[2], SHELF1_TOP_Y + PILL_OFFSET, 0],
  [COLS[0], SHELF2_TOP_Y + PILL_OFFSET, 0],
  [COLS[1], SHELF2_TOP_Y + PILL_OFFSET, 0],
  [COLS[2], SHELF2_TOP_Y + PILL_OFFSET, 0],
];

/* Camera pulled well back so both shelves and all six capsules sit
   comfortably inside the frame with white space around them, like
   the NYT reference. Telephoto FOV keeps perspective flat. */
const HOME_EYE: [number, number, number] = [1.2, 8.6, 30.8];
const HOME_TARGET: [number, number, number] = [0, 2, 0];

// Detail view: shift camera target right so the capsule sits left
// of centre. Bumped in step with the wider zoom distance so the
// panel still sits over an empty area, not on top of the pill.
const DETAIL_TARGET_OFFSET_X = 1.2;

// Palette matched to the NYT "ABCs of CBD" reference — warm
// off-white throughout, shelves only very subtly lighter than the
// background so their top surfaces don't glow like platforms. The
// darker front-edge strip is the primary shelf indicator.
const SHELF_COLOR = "#f0f3f3";
const BG_COLOR = "#f1f4f4";

function SpecimenLabel({ index }: { index: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 180;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f3f6f5";
    ctx.fillRect(0, 0, 640, 180);
    ctx.fillStyle = "#617772";
    ctx.font = "22px monospace";
    ctx.fillText("MEMORY LAB", 36, 62);
    ctx.fillStyle = "#303c3a";
    ctx.font = "34px monospace";
    ctx.fillText(`SAMPLE ${String(index + 1).padStart(2, "0")}`, 36, 117);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [index]);
  useEffect(() => () => texture.dispose(), [texture]);
  const [x, y] = POSITIONS[index];
  return <group position={[x - 1.25, y - PILL_OFFSET, 1.28]}
    rotation={[0, -PILL_ROTATION[1], 0]}>
    <group rotation={[-Math.PI / 22.5, 0, 0]} position={[0, 0.0013, 0]}>
    <RoundedBox args={[1.4, 0.41, 0.0175]} radius={0.004}
      position={[0, 0.205, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#f3f6f5" roughness={0.9} />
    </RoundedBox>
    <mesh position={[0, 0.205, 0.0095]}>
      <planeGeometry args={[1.394, 0.404]} />
      <meshBasicMaterial map={texture} />
    </mesh>
    </group>
  </group>;
}

function FrostedShelfMaterial() {
  const grain = useMemo(() => {
    const pixels = new Uint8Array(128 * 128 * 4);
    let seed = 37;
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = seed >>> 24;
      pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 128, 128);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 6);
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);
  return <meshStandardMaterial color={SHELF_COLOR} roughness={0.96}
    metalness={0} bumpMap={grain} bumpScale={0.004} />;
}

/** Keep the specimen seated while preserving pointer interactions. */
function HoverCapsule({
  index,
  base,
  rotation,
  onHover,
  onClick,
  spec,
  paused,
}: {
  index: number;
  base: [number, number, number];
  rotation: [number, number, number];
  hovered: boolean;
  focused: boolean;
  onHover: (i: number | null) => void;
  onClick: (i: number) => void;
  spec: (typeof CAPSULES)[number];
  paused: boolean;
}) {
  return (
    <group
      position={base}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      <CapsuleMesh
        videoSrc={spec.videoSrc}
        tint={spec.tint}
        scrollSpeed={spec.scrollSpeed}
        pasteWidth={spec.pasteWidth}
        autoRotate={false}
        reflectionStrength={0.7}
        castShadow
        stripSize={[1024, 256]}
        paused={paused}
      />
    </group>
  );
}

function Scene({
  focusedIdx,
  onFocus,
  onReset,
}: {
  focusedIdx: number | null;
  onFocus: (i: number) => void;
  onReset: () => void;
}) {
  const controls = useRef<CameraControls>(null!);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const homeDistance = Math.max(30.8, 46 / aspect);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const applyView = (idx: number | null) => {
    if (idx === null) {
      const [ex, ey, ez] = HOME_EYE;
      const [tx, ty, tz] = HOME_TARGET;
      controls.current?.setLookAt(ex, ty + (ey - ty) * homeDistance / ez, homeDistance, tx, ty, tz, true);
      return;
    }
    const [x, y, z] = POSITIONS[idx];
    const tx = x + DETAIL_TARGET_OFFSET_X;
    // Pull the camera well back — with the 45° pill yaw, distance
    // 5.8 filled the frame with the capsule. 9.2 gives generous
    // margin on all sides so the whole shape is legible.
    controls.current?.setLookAt(
      tx,
      y + 2.2,
      z + 18.4,
      tx,
      y,
      z,
      true,
    );
  };

  useLatchedEffect(focusedIdx, applyView);

  /* Disable manual dolly (wheel + middle-click) and pan (right-click)
     so users can only rotate slightly. Distance is set by our own
     click-to-detail transitions, never by the user's scroll.
     Also runs a subtle entrance choreography: camera starts slightly
     further back + higher, then settles into HOME framing over ~1.4s. */
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.wheel = 0;
    c.mouseButtons.middle = 0;
    c.mouseButtons.right = 0;
    c.touches.two = 0;
    c.touches.three = 0;

    // Entrance: snap to an outer/higher framing, then tween in.
    const [ex, ey, ez] = HOME_EYE;
    const [tx, ty, tz] = HOME_TARGET;
    const homeY = ty + (ey - ty) * homeDistance / ez;
    c.setLookAt(ex, homeY, homeDistance, tx, ty, tz, false);
    // Small timeout so the initial snap actually paints before the tween.
    const id = window.setTimeout(() => {
      c.setLookAt(ex, homeY, homeDistance, tx, ty, tz, true);
    }, 60);
    return () => window.clearTimeout(id);
  }, [homeDistance]);

  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <SoftShadows size={35} samples={12} focus={0.3} />

      {/* Neutral hemisphere: white sky, softly cooler ground — clean lab light */}
      <hemisphereLight args={["#ffffff", "#b7bdc2", 1.4]} />
      <directionalLight
        position={[-3, 9, 6]}
        intensity={2.1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
        shadow-radius={5}
      />
      {/* Very soft neutral fill so silhouettes stay round */}
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.15}
        color="#ffffff"
      />

      {/* Floor — matches the background so the whole scene reads as one
          continuous light space, with the shelves as the only surface. */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={BG_COLOR} roughness={1} />
      </mesh>

      {/* No back wall — the space stays one continuous light tone,
          like the NYT reference. Shelves themselves + contact shadows
          under each pill are the only structural cues. */}

      {/* Bottom shelf */}
      <RoundedBox
        args={[SHELF_WIDTH, SHELF_THICKNESS, SHELF_DEPTH]}
        radius={0.02}
        smoothness={4}
        receiveShadow
        position={[0, SHELF1_TOP_Y - SHELF_THICKNESS / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
      >
        <FrostedShelfMaterial />
      </RoundedBox>
      {/* Front-edge accent — thin darker strip on the visible front face
          so the eye reads a real shelf edge, not a floating plane. */}

      {/* Top shelf */}
      <RoundedBox
        args={[SHELF_WIDTH, SHELF_THICKNESS, SHELF_DEPTH]}
        radius={0.02}
        smoothness={4}
        receiveShadow
        position={[0, SHELF2_TOP_Y - SHELF_THICKNESS / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
      >
        <FrostedShelfMaterial />
      </RoundedBox>
      {/* Front-edge accent for the top shelf — same treatment so it
          reads as a mounted shelf rather than a floating slab. */}

      {/* Capsule bottoms remain at the shelf surface throughout navigation. */}
      {SITE_CAPSULES.map((c, i) => (
        <HoverCapsule
          key={i}
          index={i}
          base={POSITIONS[i]}
          rotation={PILL_ROTATION}
          hovered={hoveredIdx === i}
          focused={focusedIdx !== null}
          onHover={setHoveredIdx}
          onClick={onFocus}
          spec={c}
          paused={focusedIdx !== null && focusedIdx !== i}
        />
      ))}

      {CAPSULES.map((_, i) => <SpecimenLabel key={`label-${i}`} index={i} />)}

      <CameraControls
        ref={controls}
        makeDefault
        /* Soft orbit only — user can nudge the view a few degrees but
           can't wander far from the curated home framing. */
        minAzimuthAngle={-0.05 - Math.PI / 30}
        maxAzimuthAngle={0.26 + Math.PI / 30}
        minPolarAngle={Math.PI / 2 - 0.32}
        maxPolarAngle={Math.PI / 2 - 0.16}
        /* Distance range still generous so click-to-detail (which uses
           setLookAt to a much closer position) works freely. Manual
           dolly / pan are disabled below via mouseButtons. */
        minDistance={4}
        maxDistance={140}
        dollyToCursor={false}
        smoothTime={0.55}
      />
    </>
  );
}

function useLatchedEffect<T>(value: T, fn: (v: T) => void) {
  useEffect(() => {
    fn(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(err: Error) {
    console.error("Museum 3D error:", err);
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

function Fallback() {
  return (
    <div className="museum-fallback">
      <p>3D scene couldn't start. Loading the 2D shelf instead…</p>
      <a href="/">Go to shelf</a>
    </div>
  );
}

export function Museum() {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const playSound = useMuseumAudio();
  const focusCapsule = useCallback((index: number) => {
    if (index === focusedIdx) return;
    playSound(focusedIdx === null ? "open" : "tick");
    setFocusedIdx(index);
  }, [focusedIdx, playSound]);
  const resetFocus = useCallback(() => {
    if (focusedIdx === null) return;
    playSound("close");
    setFocusedIdx(null);
  }, [focusedIdx, playSound]);
  const meta = focusedIdx !== null ? CAPSULE_META[focusedIdx] : null;
  const focused = focusedIdx !== null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetFocus]);

  return (
    <main className={`museum-page ${focused ? "is-focused" : ""}`}>
      <Boundary fallback={<Fallback />}>
        <Canvas
          dpr={[1, 2]}
          shadows
          flat
          camera={{ position: HOME_EYE, fov: 15.26, near: 0.1, far: 200 }}
          gl={{ antialias: true, preserveDrawingBuffer: false }}
        >
          <Suspense fallback={null}>
            <Scene
              focusedIdx={focusedIdx}
              onFocus={focusCapsule}
              onReset={resetFocus}
            />
          </Suspense>
        </Canvas>
      </Boundary>

      {/* ---------- Editorial vertical masthead (far left) ---------- */}
      <div className="museum-sidebar" aria-hidden="true">
        <span>PERSONAL ARCHIVE · M-08</span>
        <span>MEMORY VOLUME · 01 · 2024</span>
      </div>

      {/* ---------- Header: identity + counter ---------- */}
      <div className="museum-topbar">
        <div className="museum-topbar__left">
          <div className="museum-topbar__eye">MEMORY LAB / PERSONAL ARCHIVE</div>
          <div className="museum-topbar__title">My memory shelf</div>
        </div>
        <div className="museum-topbar__right">
          <span className="museum-topbar__count">
            {focusedIdx !== null
              ? String(focusedIdx + 1).padStart(2, "0")
              : "06"}
            <em>&nbsp;/&nbsp;06</em>
          </span>
          <span className="museum-topbar__lot">COLLECTION 08 / 2026</span>
        </div>
      </div>

      {/* ---------- Editorial detail card (floating) ---------- */}
      <aside
        className={`museum-card ${focused ? "is-open" : ""}`}
        aria-hidden={!focused}
      >
        {meta && (
          <>
            <button
              type="button"
              className="museum-card__close"
              aria-label="Back to shelf"
              onClick={resetFocus}
            >
              ×
            </button>
            <div className="museum-card__eye">{meta.code} / {meta.category}</div>
            <h2 className="museum-card__title">
              {meta.title.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h2>
            <p className="museum-card__body">{meta.description}</p>
            <dl className="museum-card__specs">
              <div><dt>Location</dt><dd>{meta.location}</dd></div>
              <div><dt>Date</dt><dd>{meta.date}</dd></div>
              <div><dt>Duration</dt><dd>{meta.duration}</dd></div>
              <div><dt>Tint</dt><dd>{meta.tint}</dd></div>
              <div><dt>People</dt><dd>{meta.people}</dd></div>
              <div><dt>Code</dt><dd>{meta.code}</dd></div>
            </dl>
          </>
        )}
      </aside>

      {/* ---------- Bottom thumbnail rail ---------- */}
      <nav className="museum-rail" aria-label="Memories">
        {CAPSULE_META.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`museum-rail__chip ${focusedIdx === i ? "is-active" : ""}`}
            onClick={() => focusCapsule(i)}
          >
            <span className="museum-rail__idx">
              {m.code}
            </span>
            <span className="museum-rail__name">{m.title[0]}</span>
            <span className="museum-rail__meta">{m.date}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
