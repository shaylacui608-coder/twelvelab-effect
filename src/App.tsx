import type { CSSProperties } from "react";
import { Capsule } from "./components/Capsule";
import { CAPSULES } from "./data/capsules";

export function App() {
  const shelves = [CAPSULES.slice(0, 3), CAPSULES.slice(3, 6)];
  const specimenTags = ["Italy", "Egypt", "Hongkong", "Guizhou", "Florence", "Maldives"];

  return (
    <main className="page">
      <section className="archive-frame" aria-label="Frosted video capsule shelf">
        <div className="archive-frame__grain" />
        <div className="archive-rail" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="archive-stamp" aria-hidden="true">CASE NO. M-08</div>
        <div className="archive-top-shelf" aria-hidden="true">
          <div className="archive-top-shelf__surface" />
          <div className="archive-top-shelf__front" />
        </div>
        <header className="archive-title">
          <div className="archive-title__copy">
            <p>Personal Archive</p>
            <h1>My memory shelf</h1>
          </div>
          <aside className="archive-note" aria-hidden="true">
            <strong>For the record</strong>
            <span><b>Collection</b><i>moving memories</i></span>
            <span><b>Format</b><i>glass video capsules</i></span>
          </aside>
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
            <div className="shelf__divider shelf__divider--left" aria-hidden="true" />
            <div className="shelf__divider shelf__divider--right" aria-hidden="true" />
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
                      <span>{specimenTags[index]}</span>
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
