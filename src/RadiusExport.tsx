import { useEffect, useMemo, useState } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

const DURATION = 5200;

function radiusFromCoating(coating: number) {
  return 0.12 + (coating / 3) * 0.38;
}

export function RadiusExport() {
  const isManual = new URLSearchParams(window.location.search).has("manual");
  const [coating, setCoating] = useState(0);
  const radius = useMemo(() => radiusFromCoating(coating), [coating]);
  const capsule = CAPSULES[5];

  useEffect(() => {
    (
      window as unknown as {
        __setRadiusExportCoating?: (value: number) => void;
      }
    ).__setRadiusExportCoating = setCoating;

    return () => {
      delete (
        window as unknown as {
          __setRadiusExportCoating?: (value: number) => void;
        }
      ).__setRadiusExportCoating;
    };
  }, []);

  useEffect(() => {
    if (isManual) return;

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
  }, [isManual]);

  return (
    <main className="radius-export-page">
      <div className="radius-export-glow" />
      <div className="radius-export-capsule">
        <Capsule
          videoSrc={capsule.videoSrc}
          tint={[1.0, 1.0, 1.0]}
          scrollSpeed={0.52}
          radius={radius}
          cameraZoom={214}
        />
      </div>
    </main>
  );
}
