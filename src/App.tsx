import { CaptionPill } from "./components/CaptionPill";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

export function App() {
  return (
    <main className="page">
      <p className="page__lede">Video-in-glass study · after TwelveLabs</p>
      <div className="grid">
        {CAPSULES.map((c) => (
          <div className="cell" key={c.label}>
            <CaptionPill label={c.label} />
            <div className="capsule-canvas">
              <Capsule
                videoSrc={c.videoSrc}
                tint={c.tint}
                tiles={c.tiles}
                scrollSpeed={c.scrollSpeed}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
