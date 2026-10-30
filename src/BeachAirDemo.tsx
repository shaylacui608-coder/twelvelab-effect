import { useState } from "react";
import { Capsule } from "./components/Capsule";

const CLIP = {
  videoSrc: "/clips/shibuya.webm",
  tint: [1.02, 1.0, 0.98] as [number, number, number],
};

const BODY = Array(9).fill("A short day kept in glass.").join(" ");

export function BeachAirDemo() {
  const [scrub, setScrub] = useState(0.12);

  return (
    <main className="beach-page">
      <div className="beach-frame">
        <header className="beach-tag">
          <span>BEACH AIR</span>
        </header>

        <section className="beach-stage" aria-label="Memory capsule">
          {/* Wireframe box in perspective — a rounded rectangle tilted into
              the floor plane so it echoes the capsule's own footprint. */}
          <div className="beach-stage__box" aria-hidden="true" />

          <div className="beach-stage__pin beach-stage__pin--tl" aria-hidden="true">+</div>
          <div className="beach-stage__pin beach-stage__pin--mid" aria-hidden="true">+</div>

          {/* Soft curved crescent shadow — follows the capsule base */}
          <svg
            className="beach-capsule-shadow"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <filter id="beach-shadow-blur" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <radialGradient id="beach-shadow-fade" cx="50%" cy="55%" r="60%" fx="50%" fy="70%">
                <stop offset="0%" stopColor="rgba(60, 68, 82, 0.36)" />
                <stop offset="55%" stopColor="rgba(60, 68, 82, 0.14)" />
                <stop offset="100%" stopColor="rgba(60, 68, 82, 0)" />
              </radialGradient>
            </defs>
            <path
              d="M 30 32 Q 200 108 370 32 Q 370 70 200 118 Q 30 70 30 32 Z"
              fill="url(#beach-shadow-fade)"
              filter="url(#beach-shadow-blur)"
            />
          </svg>

          <div className="beach-capsule">
            <Capsule videoSrc={CLIP.videoSrc} tint={CLIP.tint} scrollSpeed={0.5} />
          </div>
        </section>

        <div className="beach-scrub" role="slider" aria-label="Scrub time"
             aria-valuemin={0} aria-valuemax={100}
             aria-valuenow={Math.round(scrub * 100)}>
          <div className="beach-scrub__rule" />
          <button
            type="button"
            className="beach-scrub__thumb"
            style={{ left: `${scrub * 100}%` }}
            onMouseDown={(e) => {
              const rail = (e.currentTarget.parentElement as HTMLElement);
              const rect = rail.getBoundingClientRect();
              const move = (ev: MouseEvent) => {
                const t = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
                setScrub(t);
              };
              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };
              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
          />
        </div>

        <div className="beach-meta">
          <span className="beach-meta__code">//CASE 005 - 2026-08-09</span>
          <span className="beach-meta__tag">travel</span>
        </div>

        <div className="beach-divider" aria-hidden="true" />

        <p className="beach-body">{BODY}</p>

        <div className="beach-divider" aria-hidden="true" />

        <div className="beach-actions">
          <button type="button" className="beach-btn">NEXT</button>
          <button type="button" className="beach-btn">DELETE</button>
        </div>
      </div>
    </main>
  );
}
