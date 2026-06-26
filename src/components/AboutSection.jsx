import { useEffect, useRef } from "react";
import "./AboutSection.css";

export default function AboutSection({ theme }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = 400;
    const H = canvas.height = 400;
    const cx = W / 2, cy = H / 2;

    // Parse accent color to rgb
    const hex = theme.accent.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Generate brain-like nodes in 3D (spherical distribution biased upward)
    const nodes = [];
    const seed = 42;
    const rng = (i) => {
      let x = Math.sin(i * 127.1 + seed) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 180; i++) {
      const phi = Math.acos(1 - 2 * rng(i * 3));
      const theta = 2 * Math.PI * rng(i * 3 + 1);
      const radius = 100 + rng(i * 3 + 2) * 30;

      // Squish vertically slightly for brain shape
      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
      const pz = radius * Math.cos(phi);

      nodes.push({ x: px, y: py, z: pz, size: 1.2 + rng(i) * 2 });
    }

    // Connections: nearby nodes
    const connections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 55 && connections.length < 280) {
          connections.push([i, j, dist]);
        }
      }
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      const angle = t * 0.4;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const tiltCos = Math.cos(0.3);
      const tiltSin = Math.sin(0.3);

      const project = (node) => {
        const rx = node.x * cosA - node.z * sinA;
        const rz = node.x * sinA + node.z * cosA;
        const ry = node.y * tiltCos - rz * tiltSin;
        const rz2 = node.y * tiltSin + rz * tiltCos;
        const fov = 380;
        const scale = fov / (fov + rz2);
        return {
          px: cx + rx * scale,
          py: cy + ry * scale,
          scale,
          depth: rz2,
        };
      };

      // Draw connections
      for (let k = 0; k < connections.length; k++) {
        const [i, j, dist] = connections[k];
        const pi = project(nodes[i]);
        const pj = project(nodes[j]);
        const avgDepth = (pi.depth + pj.depth) / 2;
        const maxDepth = 130;
        const alpha = Math.max(0, (maxDepth - Math.abs(avgDepth)) / maxDepth) * 0.35;
        const grad = ctx.createLinearGradient(pi.px, pi.py, pj.px, pj.py);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * pi.scale})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${alpha * pj.scale})`);
        ctx.beginPath();
        ctx.moveTo(pi.px, pi.py);
        ctx.lineTo(pj.px, pj.py);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Draw nodes sorted back to front
      const projected = nodes.map((n, idx) => ({ ...project(n), size: n.size, idx }));
      projected.sort((a, b) => a.depth - b.depth);

      for (const p of projected) {
        const alpha = Math.max(0.1, Math.min(1, (p.scale * 1.3)));
        const sz = p.size * p.scale * 1.5;

        const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, sz * 2.5);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.9})`);
        grd.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.3})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(p.px, p.py, sz * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.px, p.py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(cx, cy, 80, cx, cy, 170);
      outerGlow.addColorStop(0, `rgba(${r},${g},${b},0)`);
      outerGlow.addColorStop(0.7, `rgba(${r},${g},${b},0.04)`);
      outerGlow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();
    };

    const animate = (ts) => {
      timeRef.current = ts / 1000;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [theme.accent]);

  return (
    <section className="about-section">
      <div className="about-left">
        <p className="about-eyebrow" style={{ color: theme.accent }}>About MindBridge+</p>
        <h2 className="about-title">Built to reach people <br /> before the breaking point.</h2>
        <p className="about-body">
          MindBridge+ listens across voice, text, and behavioral signals — not to surveil, but to understand. 
          Our AI surfaces early warning patterns up to 72 hours before a mental health crisis peaks, giving care 
          teams the window they need to intervene with precision, not panic.
        </p>
        <p className="about-body">
          Designed for campuses, clinics, and care networks — where every hour counts and every signal matters.
        </p>
        <div className="about-stats">
          <div className="stat">
            <span className="stat-num" style={{ color: theme.accent }}>72h</span>
            <span className="stat-label">Early warning window</span>
          </div>
          <div className="stat-divider" style={{ background: theme.accent + "30" }} />
          <div className="stat">
            <span className="stat-num" style={{ color: theme.accent }}>3x</span>
            <span className="stat-label">Faster intervention rate</span>
          </div>
          <div className="stat-divider" style={{ background: theme.accent + "30" }} />
          <div className="stat">
            <span className="stat-num" style={{ color: theme.accent }}>AWS</span>
            <span className="stat-label">Native infrastructure</span>
          </div>
        </div>
      </div>

      <div className="about-right">
        <div className="brain-container">
          <canvas ref={canvasRef} className="brain-canvas" />
          <p className="brain-label" style={{ color: theme.accent + "99" }}>Neural activity model</p>
        </div>
      </div>
    </section>
  );
}
