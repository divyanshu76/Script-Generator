import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

export const ParticleField = ({ theme, prefersReducedMotion, density = 'normal' }: { theme: 'light' | 'dark', prefersReducedMotion: boolean, density?: 'normal' | 'high' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    let width = 0;
    let height = 0;
    
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;
      
      let count = isMobile ? 55 : isTablet ? 85 : 130;
      if (density === 'high') count = Math.floor(count * 1.5);
      
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 1.2 + 1;
        
        // Depth layer: 1 (fast, small, bright), 2 (medium), 3 (slow, large, blurred)
        const layer = Math.random() > 0.6 ? 1 : Math.random() > 0.3 ? 2 : 3;
        
        // Base colors
        let r, g, b, a;
        if (theme === 'dark') {
           const colors = [
             [96, 165, 250],  // soft blue
             [129, 140, 248], // blue-violet
             [167, 139, 250], // indigo
             [255, 255, 255], // white
             [34, 211, 238]   // cyan
           ];
           const color = colors[Math.floor(Math.random() * colors.length)];
           r = color[0]; g = color[1]; b = color[2];
           a = (Math.random() * 0.45 + 0.20) * (layer === 1 ? 1 : layer === 2 ? 0.7 : 0.4);
        } else {
           const colors = [
             [59, 130, 246], // soft blue
             [99, 102, 241], // pale indigo
             [139, 92, 246], // lavender
             [6, 182, 212],  // subtle cyan
             [100, 116, 139] // grey-blue
           ];
           const color = colors[Math.floor(Math.random() * colors.length)];
           r = color[0]; g = color[1]; b = color[2];
           a = (Math.random() * 0.45 + 0.20) * (layer === 1 ? 1 : layer === 2 ? 0.7 : 0.4);
        }

        const speedBaseX = (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
        const speedBaseY = (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: prefersReducedMotion ? 0 : speedBaseX * (layer === 1 ? 1.5 : layer === 2 ? 0.8 : 0.4),
          vy: prefersReducedMotion ? 0 : speedBaseY * (layer === 1 ? 1.5 : layer === 2 ? 0.8 : 0.4),
          size: size * (layer === 3 ? 1.5 : 1),
          r, g, b, a,
          layer,
          hasTrail: Math.random() < 0.10 // 10% have trails
        });
      }
    };

    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 200);
    };

    window.addEventListener('resize', handleResize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw slower layers first
      [3, 2, 1].forEach(currentLayer => {
        particles.forEach(p => {
          if (p.layer !== currentLayer) return;

          if (!prefersReducedMotion) {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around with slight padding
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;
          }

          // Draw trail
          if (p.hasTrail && !prefersReducedMotion) {
            ctx.beginPath();
            ctx.moveTo(p.x - p.vx * 25, p.y - p.vy * 25);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a * 0.3})`;
            ctx.lineWidth = p.size;
            ctx.stroke();
          }
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a})`;
          
          if (p.layer === 3) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a})`;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        });
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    if (prefersReducedMotion) {
      draw();
    } else {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [theme, prefersReducedMotion, density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export const AnimatedBackground = ({ theme }: { theme: 'light' | 'dark' }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const baseBg = theme === 'dark' ? 'bg-[#050507]' : 'bg-[#FAFAFA]';

  if (prefersReducedMotion) {
    return (
      <div className={`fixed inset-0 pointer-events-none -z-10 transition-colors duration-1000 ${baseBg}`}>
        <div className={`absolute top-0 left-0 w-full h-full opacity-30 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.15),transparent_50%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(147,197,253,0.2),transparent_50%)]'}`} />
        <div className={`absolute bottom-0 right-0 w-full h-full opacity-30 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]' : 'bg-[radial-gradient(circle_at_80%_80%,rgba(196,181,253,0.2),transparent_50%)]'}`} />
        <ParticleField theme={theme} prefersReducedMotion={true} />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-colors duration-1000 ${baseBg}`}>
      {/* Orb 1: Top Left */}
      <motion.div
        animate={{
          x: [0, 50, -20, 0],
          y: [0, 30, -40, 0],
          scale: [1, 1.1, 0.95, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] ${
          theme === 'dark' ? 'bg-indigo-600' : 'bg-blue-300'
        }`}
      />
      
      {/* Orb 2: Top Right */}
      <motion.div
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.05, 1.15, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className={`absolute -top-[5%] -right-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full blur-[140px] ${
          theme === 'dark' ? 'bg-violet-800' : 'bg-purple-200'
        }`}
      />

      {/* Orb 3: Center ambient */}
      <motion.div
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className={`absolute top-[30%] left-[25%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[150px] ${
          theme === 'dark' ? 'bg-purple-900' : 'bg-fuchsia-200'
        }`}
      />

      {/* Orb 4: Bottom Left */}
      <motion.div
        animate={{
          x: [0, 70, -30, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.15, 0.9, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className={`absolute -bottom-[15%] -left-[5%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[160px] ${
          theme === 'dark' ? 'bg-blue-900' : 'bg-indigo-200'
        }`}
      />

      {/* Orb 5: Bottom Right */}
      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, -30, 60, 0],
          scale: [1, 1.2, 0.85, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className={`absolute -bottom-[10%] -right-[15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[130px] ${
          theme === 'dark' ? 'bg-cyan-900/60' : 'bg-cyan-200'
        }`}
      />
      
      {/* Orb 6: Large slow moving light field */}
      <motion.div
        animate={{
          x: [0, 100, -100, 0],
          y: [0, 50, -50, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.25), transparent 45%)' 
            : 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.4), transparent 45%)'
        }}
      />

      <ParticleField theme={theme} prefersReducedMotion={false} />

      {/* Very subtle noise layer (above particles) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        theme === 'dark' ? 'opacity-[0.025]' : 'opacity-[0.04]'
      }`} 
      style={{
        zIndex: 2,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        mixBlendMode: theme === 'dark' ? 'screen' : 'multiply'
      }} />
    </div>
  );
};
