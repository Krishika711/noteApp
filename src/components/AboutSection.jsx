import { useEffect, useRef } from "react";
import "./AboutSection.css";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// Brain silhouette outline — control points for the outer shell (side view, then we rotate)
function generateBrainMesh() {
  const rng = (seed) => {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  };
  const r = rng(777);

  // Brain shape: squished sphere with cerebellum bump
  // Main cortex nodes — packed dense on surface of brain-shaped ellipsoid
  const nodes = [];

  // Main brain — large oblate ellipsoid, slightly pointed front
  for (let i = 0; i < 320; i++) {
    let x, y, z, len;
    // rejection sample inside ellipsoid
    do {
      x = (r() * 2 - 1);
      y = (r() * 2 - 1);
      z = (r() * 2 - 1);
      len = Math.sqrt((x/1.4)**2 + (y/0.95)**2 + (z/1.1)**2);
    } while (len > 1 || len < 0.55); // shell only — surface nodes

    // Scale to brain size
    const sx = x * 130 + (z * 15); // slight forward taper
    const sy = y * 90;
    const sz = z * 105;

    // Add gyri-like wrinkle perturbation
    const wrinkle = (r()-0.5)*18;
    nodes.push({
      x: sx + wrinkle * 0.4,
      y: sy + wrinkle * 0.3,
      z: sz + wrinkle * 0.2,
      type: 'cortex',
      size: 1.2 + r() * 1.8,
      pulse: r() * Math.PI * 2,
    });
  }

  // Cerebellum — back bottom, smaller ellipsoid
  for (let i = 0; i < 60; i++) {
    let x, y, z, len;
    do {
      x = (r() * 2 - 1); y = (r() * 2 - 1); z = (r() * 2 - 1);
      len = Math.sqrt((x/0.9)**2 + (y/0.65)**2 + (z/0.75)**2);
    } while (len > 1 || len < 0.45);
    nodes.push({
      x: x * 70 + (r()-0.5)*12,
      y: y * 52 + 65,
      z: z * 60 - 65,
      type: 'cerebellum',
      size: 1.0 + r() * 1.5,
      pulse: r() * Math.PI * 2,
    });
  }

  // Brain stem
  for (let i = 0; i < 25; i++) {
    const t = r();
    nodes.push({
      x: (r()-0.5) * 28,
      y: 55 + t * 70,
      z: -20 + (r()-0.5) * 20,
      type: 'stem',
      size: 1.0 + r() * 1.2,
      pulse: r() * Math.PI * 2,
    });
  }

  // Build mesh connections — nearby nodes only
  const connections = [];
  const maxDist = { cortex: 52, cerebellum: 48, stem: 38 };
  for (let i = 0; i < nodes.length; i++) {
    let connCount = 0;
    for (let j = i+1; j < nodes.length && connCount < 5; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const limit = maxDist[nodes[i].type] || 50;
      if (d < limit) {
        connections.push([i, j, d]);
        connCount++;
      }
    }
  }

  return { nodes, connections };
}

const { nodes: NODES, connections: CONNECTIONS } = generateBrainMesh();

export default function AboutSection({ theme }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, over: false });
  const rotRef = useRef({ y: 0.3, x: 0.12 });
  const targetRotRef = useRef({ y: 0.3, x: 0.12 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 520, H = 520;
    canvas.width = W; canvas.height = H;
    const cx = W / 2, cy = H / 2 + 10;

    const [r, g, b] = hexToRgb(theme.accent);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      mouseRef.current = { x: mx, y: my, over: true };
      // Target rotation follows cursor
      targetRotRef.current.y = 0.3 + ((mx - cx) / cx) * 0.7;
      targetRotRef.current.x = 0.12 + ((my - cy) / cy) * 0.35;
    };
    const onLeave = () => {
      mouseRef.current.over = false;
      targetRotRef.current.y = 0.3;
      targetRotRef.current.x = 0.12;
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const project = (node, ry, rx) => {
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const px0 = node.x * cosY - node.z * sinY;
      const pz0 = node.x * sinY + node.z * cosY;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const py1 = node.y * cosX - pz0 * sinX;
      const pz1 = node.y * sinX + pz0 * cosX;
      const fov = 500;
      const s = fov / (fov + pz1 + 80);
      return { px: cx + px0 * s, py: cy + py1 * s, s, depth: pz1 };
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      const rot = rotRef.current;
      const target = targetRotRef.current;

      // Smooth lerp toward target (auto-rotate when not hovering)
      if (!mouseRef.current.over) {
        target.y += 0.004;
      }
      rot.y += (target.y - rot.y) * 0.04;
      rot.x += (target.x - rot.x) * 0.04;

      // Project all nodes
      const proj = NODES.map((n, i) => {
        const p = project(n, rot.y, rot.x);
        const pulse = 0.7 + Math.sin(t * 1.5 + n.pulse) * 0.3;
        return { ...p, n, pulse, i };
      });

      // Sort connections back to front
      const sortedConns = [...CONNECTIONS].sort((a, b) => {
        const da = (proj[a[0]].depth + proj[a[1]].depth) / 2;
        const db = (proj[b[0]].depth + proj[b[1]].depth) / 2;
        return da - db;
      });

      // Draw connections
      sortedConns.forEach(([i, j, dist]) => {
        const pi = proj[i], pj = proj[j];
        const avgDepth = (pi.depth + pj.depth) / 2;
        const depthFade = Math.max(0, (200 - Math.abs(avgDepth)) / 200);
        const alpha = depthFade * 0.45 * ((pi.pulse + pj.pulse) / 2) * Math.min(pi.s, pj.s);

        ctx.beginPath();
        ctx.moveTo(pi.px, pi.py);
        ctx.lineTo(pj.px, pj.py);
        const grad = ctx.createLinearGradient(pi.px, pi.py, pj.px, pj.py);
        grad.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.7, alpha * 1.2)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${Math.min(0.7, alpha * 0.8)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5 + depthFade * 0.4;
        ctx.stroke();
      });

      // Draw nodes — sorted back to front
      [...proj].sort((a, b) => a.depth - b.depth).forEach(p => {
        const depthFade = Math.max(0.1, (200 - Math.abs(p.depth)) / 200);
        const alpha = depthFade * p.pulse * Math.min(1, p.s * 1.3);
        const sz = p.n.size * p.s * 1.8 * (0.8 + p.pulse * 0.2);

        // Outer glow
        const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, sz * 4);
        grd.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.8, alpha * 0.7)})`);
        grd.addColorStop(0.35, `rgba(${r},${g},${b},${Math.min(0.4, alpha * 0.25)})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(p.px, p.py, sz * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // Core node
        ctx.beginPath(); ctx.arc(p.px, p.py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha)})`;
        ctx.fill();

        // Specular highlight
        ctx.beginPath(); ctx.arc(p.px - sz * 0.3, p.py - sz * 0.3, sz * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, alpha * 0.6)})`;
        ctx.fill();
      });

      // Overall ambient glow
      const atmo = ctx.createRadialGradient(cx, cy, 60, cx, cy, 230);
      atmo.addColorStop(0, `rgba(${r},${g},${b},0.06)`);
      atmo.addColorStop(0.5, `rgba(${r},${g},${b},0.02)`);
      atmo.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(cx, cy, 230, 0, Math.PI * 2);
      ctx.fillStyle = atmo; ctx.fill();

      // Cursor proximity glow
      if (mouseRef.current.over) {
        const mx = mouseRef.current.x, my = mouseRef.current.y;
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
        glow.addColorStop(0, `rgba(${r},${g},${b},0.12)`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
      }
    };

    const loop = (ts) => { draw(ts / 1000); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
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
          <canvas ref={canvasRef} className="brain-canvas" />
          <p className="brain-hint">move cursor over brain to interact</p>
        </div>
      </div>
    </section>
  );
}
