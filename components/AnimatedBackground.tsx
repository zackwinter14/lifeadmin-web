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
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(62,167,88,${p.opacity})`;
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
        <div className="orb-1 absolute -top-60 -left-60 h-[800px] w-[800px] rounded-full bg-brand/20 blur-[100px]" />
        <div className="orb-2 absolute top-1/3 -right-80 h-[700px] w-[700px] rounded-full bg-brand/15 blur-[90px]" />
        <div className="orb-3 absolute top-2/3 left-1/4 h-[600px] w-[600px] rounded-full bg-brand-light/10 blur-[80px]" />
        <div className="orb-4 absolute -bottom-60 right-1/4 h-[600px] w-[600px] rounded-full bg-brand/15 blur-[100px]" />
        <div className="aurora absolute -top-20 left-1/2 -translate-x-1/2 h-[350px] w-[1000px] rounded-full bg-brand/20 blur-[60px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none bg-grid"
        style={{ zIndex: -4 }}
      />
    </>
  );
}
