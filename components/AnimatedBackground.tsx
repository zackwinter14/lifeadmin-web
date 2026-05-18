"use client";

import { useRef, useEffect } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();

    type Particle = {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      drift: number;
    };

    const particles: Particle[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 0.6 + 0.15,
      opacity: Math.random() * 0.6 + 0.15,
      drift: (Math.random() - 0.5) * 0.4,
    }));

    let animId: number;
    const getParticleColor = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-hex")
        .trim() || "#3EA758";

    let particleColor = getParticleColor();

    const observer = new MutationObserver(() => {
      particleColor = getParticleColor();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(particleColor, p.opacity);
        ctx.fill();
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -4) {
          p.y = canvas.height + 4;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -3, mixBlendMode: "screen" }}
      />

      {/* Moving gradient orbs */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: -5 }}
      >
        <div className="orb-1 absolute -top-60 -left-60 h-[800px] w-[800px] rounded-full blur-[100px]" style={{ background: "var(--orb-color)" }} />
        <div className="orb-2 absolute top-1/3 -right-80 h-[700px] w-[700px] rounded-full blur-[90px]" style={{ background: "var(--orb-color)" }} />
        <div className="orb-3 absolute top-2/3 left-1/4 h-[600px] w-[600px] rounded-full blur-[80px]" style={{ background: "var(--orb-color-light)" }} />
        <div className="orb-4 absolute -bottom-60 right-1/4 h-[600px] w-[600px] rounded-full blur-[100px]" style={{ background: "var(--orb-color)" }} />
        <div className="aurora absolute -top-20 left-1/2 -translate-x-1/2 h-[350px] w-[1000px] rounded-full blur-[60px]" style={{ background: "var(--orb-color)" }} />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none bg-grid"
        style={{ zIndex: -4 }}
      />
    </>
  );
}
