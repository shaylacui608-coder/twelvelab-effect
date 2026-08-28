import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

function radiusFromLevel(level: number) {
  const progress = (level - 1) / 2;
  return 0.18 + progress * 0.28;
}

export function RadiusDemo() {
  const [level, setLevel] = useState(1);
  const radius = useMemo(() => radiusFromLevel(level), [level]);
  const progress = (level - 1) / 2;
  const capsule = CAPSULES[5];

  useEffect(() => {
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      if (now - last > 33) {
        const loop = 5200;
        const phase = (now % loop) / loop;
        const wave = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5;
        const nextLevel = Math.round((1 + wave * 2) * 100) / 100;
        setLevel(nextLevel);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="radius-demo-page">
      <section className="radius-demo-panel">
        <div
          className="radius-control"
          style={{ "--progress": progress } as CSSProperties}
        >
          <span className="radius-control__label">Radius<br />level</span>
          <div className="radius-control__track">
            <span className="radius-control__value">{level.toFixed(1)}</span>
          </div>
        </div>

        <div className="radius-demo-stage" aria-label="Animated radius capsule">
          <div className="radius-demo-glow" />
          <div className="radius-demo-capsule">
            <Capsule
              videoSrc={capsule.videoSrc}
              tint={[1.0, 1.0, 1.0]}
              scrollSpeed={0.52}
              radius={radius}
              cameraZoom={218}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
