import type { CSSProperties } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

const glowOverlay = "/overlays/capsule-glow.png";

function MiniBars() {
  return (
    <div className="mini-bars" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          style={{ "--bar": `${20 + ((index * 17) % 58)}%` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function CapsuleHero({
  videoSrc,
  tint,
  className = "",
}: {
  videoSrc: string;
  tint: [number, number, number];
  className?: string;
}) {
  return (
    <div className={`phone-capsule ${className}`}>
      <div className="phone-capsule__platform" />
      <div className="phone-capsule__halo" />
      <div className="phone-capsule__canvas">
        <Capsule videoSrc={videoSrc} tint={tint} scrollSpeed={0.52} />
      </div>
      <img className="phone-capsule__overlay" src={glowOverlay} alt="" />
    </div>
  );
}

function MemoryPhone() {
  const capsule = CAPSULES[4];

  return (
    <section className="phone-card phone-card--memory" aria-label="Memory app demo">
      <div className="phone-card__noise" />
      <div className="phone-card__content">
        <p className="phone-date">Aug 09</p>
        <h2>Firenze memory</h2>
        <p className="phone-subtitle">A short day kept in glass.</p>

        <CapsuleHero
          className="phone-capsule--memory"
          videoSrc={capsule.videoSrc}
          tint={[1.04, 1.0, 0.98]}
        />

        <div className="scrub-row">
          <div>
            <strong>00:12 / 00:23</strong>
            <span>Drag gently to scrub time</span>
          </div>
          <button aria-label="Pause memory">Ⅱ</button>
        </div>
        <div className="timeline">
          <span />
        </div>

        <p className="people-label">People</p>
        <div className="chips">
          <span>Mina</span>
          <span>Leo</span>
          <span className="is-active">Ocean</span>
        </div>

        <nav className="phone-tabs" aria-label="Memory app navigation">
          <span>Shelf</span>
          <span>Search</span>
          <strong>Today</strong>
        </nav>
      </div>
    </section>
  );
}

function MusicPhone() {
  const capsule = CAPSULES[1];

  return (
    <section className="phone-card phone-card--music" aria-label="Music app demo">
      <div className="phone-card__orb" />
      <div className="phone-card__content">
        <div className="music-topline">
          <strong>Pulse</strong>
          <span>LIVE MIX</span>
        </div>
        <p className="now-playing">Now Playing</p>
        <h2>Velvet Bass No. 09</h2>
        <p className="phone-subtitle">Hana Vale · 128 BPM · spatial mix</p>

        <CapsuleHero
          className="phone-capsule--music"
          videoSrc={capsule.videoSrc}
          tint={[1.0, 1.0, 1.0]}
        />

        <div className="frequency-card">
          <div>
            <strong>Frequency Field</strong>
            <span>03:18</span>
          </div>
          <MiniBars />
        </div>

        <div className="track-card">
          <span className="album-dot" />
          <div>
            <strong>Crimson Bloom</strong>
            <small>glass room edit</small>
          </div>
          <button aria-label="Pause mix">Ⅱ</button>
        </div>

        <div className="chips chips--music">
          <span className="is-active">Bass +7</span>
          <span>Warm</span>
          <span>Club</span>
        </div>

        <nav className="phone-tabs phone-tabs--music" aria-label="Music app navigation">
          <span>Radio</span>
          <strong>Mix</strong>
          <span>Library</span>
        </nav>
      </div>
    </section>
  );
}

export function AppDemo() {
  return (
    <main className="app-demo-page">
      <div className="app-demo-stage">
        <MemoryPhone />
        <MusicPhone />
      </div>
    </main>
  );
}
