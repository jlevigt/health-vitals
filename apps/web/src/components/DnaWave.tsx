import { gsap } from "gsap";
import { useEffect, useRef } from "react";

export function DnaWave() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsCount = 20;
  const width = 200;
  const height = 40;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !containerRef.current) {
      return;
    }

    const points = containerRef.current.querySelectorAll(".dna-point");
    const strand1 = Array.from(points).slice(0, pointsCount);
    const strand2 = Array.from(points).slice(pointsCount);

    const tl = gsap.timeline({ repeat: -1 });

    strand1.forEach((p, i) => {
      const delay = -1 * (i / pointsCount) * 2;

      gsap.to(p, {
        y: height - 6,
        startAt: { y: 0 },
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay,
      });

      gsap.to(p, {
        scale: 0.5,
        startAt: { scale: 1 },
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay - 0.75,
      });
    });

    strand2.forEach((p, i) => {
      const delay = -1 * (i / pointsCount) * 2;

      gsap.to(p, {
        y: 0,
        startAt: { y: height - 6 },
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay,
      });

      gsap.to(p, {
        scale: 1,
        startAt: { scale: 0.5 },
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: delay - 0.75,
      });
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(points);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-[200px] h-[40px] pointer-events-none mx-auto opacity-80 scale-75 md:scale-100"
      aria-hidden="true"
    >
      {[...Array(pointsCount)].map((_, i) => (
        <div
          key={`s1-${i}`}
          className="dna-point absolute w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{ left: (i / (pointsCount - 1)) * width }}
        />
      ))}
      {[...Array(pointsCount)].map((_, i) => (
        <div
          key={`s2-${i}`}
          className="dna-point absolute w-1.5 h-1.5 rounded-full bg-primary/30"
          style={{ left: (i / (pointsCount - 1)) * width }}
        />
      ))}
    </div>
  );
}
