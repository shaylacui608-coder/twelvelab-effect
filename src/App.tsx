import type { CSSProperties } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

export function App() {
  const shelves = [CAPSULES.slice(0, 3), CAPSULES.slice(3, 6)];

  return (
    <main className="page">
      <section className="archive-frame" aria-label="Frosted video capsule shelf">
        <div className="archive-frame__grain" />
        <header className="archive-title">
          <p>Personal Archive</p>
          <h1>My memory shelf</h1>
        </header>
        {shelves.map((items, shelfIndex) => (
          <section
            className={`shelf shelf--${shelfIndex + 1}`}
            aria-label={`Capsule shelf ${shelfIndex + 1}`}
            key={shelfIndex}
          >
            <div className="shelf__back" />
            <div className="shelf__surface" />
            <div className="shelf__front" />
            <div className="specimen-row">
              {items.map((c, itemIndex) => {
                const index = shelfIndex * 3 + itemIndex;
                return (
                  <article
                    className="specimen"
                    key={c.label}
                    style={{ "--delay": `${index * 100}ms` } as CSSProperties}
                  >
                    <div className="specimen__stage">
                      <div className="capsule-canvas">
                        <Capsule
                          videoSrc={c.videoSrc}
                          tint={c.tint}
                          scrollSpeed={c.scrollSpeed}
                          pasteWidth={c.pasteWidth}
                        />
                      </div>
                    </div>
                    <div className="specimen__plate">
                      <span>VIDEO SPECIMEN {String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
