import { useEffect, useRef, useState } from "react";
import "./AboutSection.css";

// Brain lobe regions — actual neuroanatomy-inspired positions
const LOBES = [
  // Frontal lobe (front top)
  { cx:0,   cy:-60, cz: 60, rx:55, ry:50, rz:45, count:38, name:"Frontal" },
  // Parietal lobe (top back)
  { cx:0,   cy:-55, cz:-20, rx:50, ry:45, rz:40, count:30, name:"Parietal" },
  // Temporal lobe left
  { cx:-70, cy: 20, cz: 10, rx:35, ry:30, rz:50, count:22, name:"Temporal L" },
  // Temporal lobe right
  { cx: 70, cy: 20, cz: 10, rx:35, ry:30, rz:50, count:22, name:"Temporal R" },
  // Occipital lobe (back)
  { cx:0,   cy:-20, cz:-80, rx:40, ry:35, rz:35, count:18, name:"Occipital" },
  // Cerebellum (bottom back)
  { cx:0,   cy: 60, cz:-50, rx:45, ry:30, rz:35, count:20, name:"Cerebellum" },
  // Brain stem
  { cx:0,   cy: 80, cz: 0,  rx:15, ry:40, rz:15, count:10, name:"Stem" },
];

function buildBrain() {
  const rng = (seed) => {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  };

  const nodes = [];
  let idx = 0;
  LOBES.forEach((lobe, li) => {
    const r = rng(li * 999 + 42);
    for (let i = 0; i < lobe.count; i++) {
      // Ellipsoid distribution inside each lobe
      const u = r() * 2 - 1, v = r() * 2 - 1, w = r() * 2 - 1;
      const len = Math.sqrt(u*u + v*v + w*w) || 1;
      const t = Math.cbrt(r()); // volume-uniform
      nodes.push({
        x: lobe.cx + (u/len) * t * lobe.rx + (r()-0.5)*8,
        y: lobe.cy + (v/len) * t * lobe.ry + (r()-0.5)*8,
        z: lobe.cz + (w/len) * t * lobe.rz + (r()-0.5)*8,
        lobe: li,
        size: 1.5 + r() * 2.5,
        pulse: r() * Math.PI * 2,
        idx: idx++,
      });
    }
  });

  // Connect: same-lobe close + cross-lobe bridges
  const connections = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i+1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const sameLobe = nodes[i].lobe === nodes[j].lobe;
      if ((sameLobe && d < 45) || (!sameLobe && d < 35 && connections.length < 400)) {
        connections.push({ i, j, d, sameLobe });
      }
    }
  }
  return { nodes, connections };
}

const { nodes: NODES, connections: CONNECTIONS } = buildBrain();

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

export default function AboutSection({ theme }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, over: false });
  const rotRef = useRef({ y: 0, x: 0.25, vy: 0.005, vx: 0 });
  const hoveredLobeRef = useRef(null);
  const [hoveredLobe, setHoveredLobe] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 420, H = 420;
    canvas.width = W; canvas.height = H;
    const cx = W/2, cy = H/2;

    const [r, g, b] = hexToRgb(theme.accent);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        over: true,
      };
    };
    const handleMouseLeave = () => { mouseRef.current.over = false; };
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const project = (node, angleY, angleX) => {
      // Rotate Y
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
      const rx = node.x * cosY - node.z * sinY;
      const rz = node.x * sinY + node.z * cosY;
      // Rotate X (tilt)
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const ry = node.y * cosX - rz * sinX;
      const rz2 = node.y * sinX + rz * cosX;
      const fov = 420;
      const s = fov / (fov + rz2 + 50);
      return { px: cx + rx*s, py: cy + ry*s, s, depth: rz2 };
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      const rot = rotRef.current;

      // Auto rotate, slow down on hover
      if (!mouseRef.current.over) {
        rot.y += rot.vy;
        rot.x += rot.vx;
        rot.x = Math.max(-0.5, Math.min(0.5, rot.x));
      }

      // Mouse drag-like rotation
      if (mouseRef.current.over) {
        const tx = (mouseRef.current.x - cx) / cx * 0.8;
        const ty = (mouseRef.current.y - cy) / cy * 0.3;
        rot.y += (tx * 0.02 - rot.vy) * 0.05;
        rot.x += (ty * 0.015 - rot.vx) * 0.05;
      }

      const projected = NODES.map((n, i) => {
        const p = project(n, rot.y, rot.x);
        const pulse = Math.sin(t * 1.8 + n.pulse) * 0.3 + 0.7;
        return { ...p, n, pulse, i };
      });

      // Detect hovered lobe
      let closestLobe = null, closestDist = 30;
      if (mouseRef.current.over) {
        projected.forEach(p => {
          const dx = p.px - mouseRef.current.x;
          const dy = p.py - mouseRef.current.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < closestDist) { closestDist = d; closestLobe = p.n.lobe; }
        });
      }
      if (hoveredLobeRef.current !== closestLobe) {
        hoveredLobeRef.current = closestLobe;
        setHoveredLobe(closestLobe !== null ? LOBES[closestLobe].name : null);
      }

      // Outer atmosphere glow
      const atmo = ctx.createRadialGradient(cx, cy, 60, cx, cy, 200);
      atmo.addColorStop(0, `rgba(${r},${g},${b},0)`);
      atmo.addColorStop(0.6, `rgba(${r},${g},${b},0.04)`);
      atmo.addColorStop(1, `rgba(${r},${g},${b},0.01)`);
      ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI*2);
      ctx.fillStyle = atmo; ctx.fill();

      // Draw connections back to front
      const sortedConns = [...CONNECTIONS].sort((a,b) => {
        const da = (projected[a.i].depth + projected[a.j].depth)/2;
        const db = (projected[b.i].depth + projected[b.j].depth)/2;
        return da - db;
      });

      sortedConns.forEach(({ i, j, sameLobe }) => {
        const pi = projected[i], pj = projected[j];
        const avgDepth = (pi.depth + pj.depth) / 2;
        const depthFade = Math.max(0, (160 - Math.abs(avgDepth)) / 160);
        const lobeHovered = hoveredLobeRef.current !== null &&
          (NODES[i].lobe === hoveredLobeRef.current || NODES[j].lobe === hoveredLobeRef.current);
        const baseAlpha = sameLobe ? 0.4 : 0.15;
        const alpha = depthFade * baseAlpha * (lobeHovered ? 2.5 : 1) * (pi.pulse + pj.pulse) / 2;

        const grad = ctx.createLinearGradient(pi.px, pi.py, pj.px, pj.py);
        grad.addColorStop(0, `rgba(${r},${g},${b},${Math.min(1, alpha * pi.s)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${Math.min(1, alpha * pj.s)})`);
        ctx.beginPath();
        ctx.moveTo(pi.px, pi.py);
        ctx.lineTo(pj.px, pj.py);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lobeHovered ? 1.2 : 0.6;
        ctx.stroke();
      });

      // Draw nodes sorted back to front
      [...projected].sort((a,b) => a.depth - b.depth).forEach(p => {
        const isHoveredLobe = hoveredLobeRef.current === p.n.lobe;
        const sz = p.n.size * p.s * (isHoveredLobe ? 2.2 : 1.4) * (0.85 + p.pulse * 0.15);
        const alpha = Math.max(0.15, Math.min(0.95, p.s * 1.2)) * (isHoveredLobe ? 1 : 0.8);

        // Glow
        const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, sz * 3);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.6})`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.15})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(p.px, p.py, sz * 3, 0, Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(p.px, p.py, sz, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Highlight
        if (isHoveredLobe) {
          ctx.beginPath(); ctx.arc(p.px - sz*0.3, p.py - sz*0.3, sz*0.35, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,255,255,0.6)`; ctx.fill();
        }
      });

      // Lobe label on hover
      if (hoveredLobeRef.current !== null && mouseRef.current.over) {
        const lobe = LOBES[hoveredLobeRef.current];
        const labelProj = project({ x: lobe.cx, y: lobe.cy - 20, z: lobe.cz }, rot.y, rot.x);
        ctx.font = "600 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.fillText(lobe.name + " Lobe", labelProj.px, labelProj.py - 10);
      }
    };

    const animate = (ts) => {
      draw(ts / 1000);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [theme.accent]);

  return (
    <section className="about-section">
      <div className="about-left">
        <p className="about-eyebrow" style={{ color: theme.accent }}>About MindBridge+</p>
        <h2 className="about-title">Built to reach people<br />before the breaking point.</h2>
        <p className="about-body">
          MindBridge+ listens across voice, text, and behavioral signals — not to surveil, but to understand.
          Our AI surfaces early warning patterns up to 72 hours before a mental health crisis peaks, giving
          care teams the window they need to intervene with precision, not panic.
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
            <span className="stat-label">Faster intervention</span>
          </div>
          <div className="stat-divider" style={{ background: theme.accent + "30" }} />
          <div className="stat">
            <span className="stat-num" style={{ color: theme.accent }}>AWS</span>
            <span className="stat-label">Native infrastructure</span>
          </div>
        </div>
      </div>

      <div className="about-right">
        <div className="brain-wrap">
          <canvas ref={canvasRef} className="brain-canvas" title="Hover over brain regions to explore" />
          <div className="brain-meta">
            <span className="brain-label" style={{ color: theme.accent + "99" }}>
              {hoveredLobe ? `${hoveredLobe} Lobe` : "Neural activity model"}
            </span>
            <span className="brain-hint">hover to explore regions</span>
          </div>
        </div>
      </div>
    </section>
  );
}
