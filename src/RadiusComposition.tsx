import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

const DURATION = 5200;

function radiusFromCoating(coating: number) {
  return 0.12 + (coating / 3) * 0.38;
}

export function RadiusComposition() {
  const [coating, setCoating] = useState(0);
  const radius = useMemo(() => radiusFromCoating(coating), [coating]);
  const progress = coating / 3;
  const capsule = CAPSULES[5];

  useEffect(() => {
    let frame = 0;
    let startedAt = 0;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const phase = ((now - startedAt) % DURATION) / DURATION;
      const eased = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5;
      setCoating(Math.round(eased * 300) / 100);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="radius-composition-page">
      <section className="radius-composition-frame">
        <div
          className="radius-control composition-radius-control"
          style={{ "--progress": progress } as CSSProperties}
        >
          <span className="radius-control__label">Radius<br />level</span>
          <div className="radius-control__track">
            <span className="radius-control__value">{coating.toFixed(1)}</span>
          </div>
        </div>
        <div className="radius-composition-glow" />
        <div className="radius-composition-capsule">
          <Capsule
            videoSrc={capsule.videoSrc}
            tint={[1.0, 1.0, 1.0]}
            scrollSpeed={0.52}
            radius={radius}
            cameraZoom={178}
          />
        </div>
      </section>
    </main>
  );
}
