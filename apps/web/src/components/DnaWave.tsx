import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function DnaWave() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || !containerRef.current) return;

    const points = 20; // Number of points per strand
    const container = containerRef.current;
    const width = 200;
    const height = 40;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create strands
    const strand1: HTMLDivElement[] = [];
    const strand2: HTMLDivElement[] = [];

    for (let i = 0; i < points; i++) {
        const createPoint = (className: string) => {
            const point = document.createElement('div');
            point.className = `absolute w-1.5 h-1.5 rounded-full ${className}`;
            container.appendChild(point);
            return point;
        };

        strand1.push(createPoint('bg-primary/60'));
        strand2.push(createPoint('bg-primary/30'));
    }

    const tl = gsap.timeline({ repeat: -1 });

    strand1.forEach((point, i) => {
      const progress = i / (points - 1);
      const x = progress * width;
      
      // Initial position
      gsap.set(point, { x, y: height / 2 });
      gsap.set(strand2[i], { x, y: height / 2 });

      // Animate Strand 1
      gsap.to(point, {
        y: 0,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: -2 * progress // Phase shift
      });
      
       // Animate Strand 2 (Opposite phase)
       gsap.to(strand2[i], {
        y: height, // Note: relative to top, so checks bounds
        keyframes: {
             "0%": { y: height / 2 },
             "50%": { y: 0 },
             "100%": { y: height }
        },
        duration: 2,
        ease: "sine.inOut", // Basic sine motion
         // We need manual sine wave calculation for precise DNA look usually, but let's try Keyframes or just offsets
      });
    });
    
    // Let's do a simpler approach for a cleaner sine wave using onUpdate or just pure sine keyframes
    // Actually, simpler standard GSAP yoyo is fine, but we need them to cross.
    
    // Better Approach: 
    // Animate a `progress` value and calculate Y in a loop or verify standard sine ease.
    // Standard Sine ease is perfect.
    
    strand1.forEach((p, i) => {
        const delay = -1 * (i / points) * 2; // Spread phase
        
        gsap.to(p, {
            y: height - 6, // Go down
            startAt: { y: 0 }, // Start up
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: delay
        });
        
        gsap.to(p, {
            scale: 0.5,
            startAt: { scale: 1 },
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: delay - 0.75 // 90 degree phase shift for depth? Or just keep it simple.
        });
    });

    strand2.forEach((p, i) => {
        const delay = -1 * (i / points) * 2;
        
        gsap.to(p, {
            y: 0, // Go up
            startAt: { y: height - 6 }, // Start down
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: delay
        });

          gsap.to(p, {
            scale: 1,
            startAt: { scale: 0.5 },
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: delay - 0.75
        });
    });


    return () => {
      tl.kill();
      gsap.killTweensOf(strand1);
      gsap.killTweensOf(strand2);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-[200px] h-[40px] pointer-events-none mx-auto opacity-80 scale-75 md:scale-100"
      aria-hidden="true" 
    />
  );
}

