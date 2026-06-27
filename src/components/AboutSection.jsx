import { useEffect, useRef } from "react";
import "./AboutSection.css";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// Generate brain shape nodes on surface of brain-like form
function generateBrain() {
  const rng = (() => {
    let s = 12345;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  })();

  const nodes = [];

  // MAIN CEREBRUM — large egg-shape, wider at back, narrower at front
  for (let i = 0; i < 600; i++) {
    let x, y, z;
    // Sample on surface of scaled ellipsoid
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const st = Math.sin(phi), cp = Math.cos(phi), sp = Math.sin(phi);
    x = Math.sin(phi) * Math.cos(theta);
    y = Math.sin(phi) * Math.sin(theta);
    z = Math.cos(phi);

    // Brain shape: wider sides, flatter top/bottom, front narrower
    const frontTaper = 1 - Math.max(0, z) * 0.25; // narrow toward front (z+)
    const sx = x * 200 * frontTaper + (rng()-0.5)*20;
    const sy = y * 130 + (rng()-0.5)*20;
    const sz = z * 170 + (rng()-0.5)*20;

    // Add wrinkle noise
    const w = Math.sin(sx*0.08)*12 + Math.cos(sy*0.1)*10 + Math.sin(sz*0.07)*8;
    nodes.push({
      x: sx + w * (rng()-0.5),
      y: sy + w * (rng()-0.5) * 0.6,
      z: sz + w * (rng()-0.5) * 0.4,
      type: 0,
      size: 1.5 + rng() * 2.5,
      pulse: rng() * Math.PI * 2,
    });
  }

  // CEREBELLUM — bottom back, cauliflower bumps
  for (let i = 0; i < 120; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const sx = Math.sin(phi) * Math.cos(theta) * 100 + (rng()-0.5)*15;
    const sy = Math.sin(phi) * Math.sin(theta) * 65 + 110;
    const sz = Math.cos(phi) * 80 - 80 + (rng()-0.5)*15;
    nodes.push({ x: sx, y: sy, z: sz, type: 1, size: 1.2 + rng()*2, pulse: rng()*Math.PI*2 });
  }

  // BRAIN STEM — cylindrical, hanging below
  for (let i = 0; i < 40; i++) {
    const t = rng();
    const angle = rng() * Math.PI * 2;
    nodes.push({
      x: Math.cos(angle) * (18 - t*8) + (rng()-0.5)*8,
      y: 100 + t * 140,
      z: -30 + (rng()-0.5)*20,
      type: 2, size: 1.0 + rng()*1.5, pulse: rng()*Math.PI*2,
    });
  }

  // Build connections — mesh between nearby surface nodes
  const connections = [];
  const limits = [70, 58, 45];
  for (let i = 0; i < nodes.length; i++) {
    let c = 0;
    for (let j = i+1; j < nodes.length && c < 6; j++) {
      if (nodes[i].type !== nodes[j].type && nodes[j].type !== 2) continue;
      const dx = nodes[i].x-nodes[j].x, dy = nodes[i].y-nodes[j].y, dz = nodes[i].z-nodes[j].z;
      const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
      if (d < limits[nodes[i].type]) { connections.push([i,j,d]); c++; }
    }
  }
  // Also connect cerebellum to main
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type !== 1) continue;
    for (let j = 0; j < nodes.length; j++) {
      if (nodes[j].type !== 0) continue;
      const dx = nodes[i].x-nodes[j].x, dy = nodes[i].y-nodes[j].y, dz = nodes[i].z-nodes[j].z;
      const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
      if (d < 55) { connections.push([i,j,d]); break; }
    }
  }

  return { nodes, connections };
}

const { nodes: NODES, connections: CONNECTIONS } = generateBrain();

export default function AboutSection({ theme }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 512, y: 512, over: false });
  const rotRef = useRef({ y: 0.2, x: 0.1 });
  const targetRotRef = useRef({ y: 0.2, x: 0.1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 1024;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    const cx = SIZE/2, cy = SIZE/2 - 20;
    const [r,g,b] = hexToRgb(theme.accent);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (SIZE / rect.width);
      const my = (e.clientY - rect.top) * (SIZE / rect.height);
      mouseRef.current = { x: mx, y: my, over: true };
      targetRotRef.current.y = 0.2 + ((mx - cx) / cx) * 0.9;
      targetRotRef.current.x = 0.1 + ((my - cy) / cy) * 0.4;
    };
    const onLeave = () => {
      mouseRef.current.over = false;
      targetRotRef.current.x = 0.1;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const project = (n, ry, rx) => {
      const cy2 = Math.cos(ry), sy2 = Math.sin(ry);
      const px0 = n.x*cy2 - n.z*sy2;
      const pz0 = n.x*sy2 + n.z*cy2;
      const cx2 = Math.cos(rx), sx2 = Math.sin(rx);
      const py1 = n.y*cx2 - pz0*sx2;
      const pz1 = n.y*sx2 + pz0*cx2;
      const fov = 900;
      const s = fov/(fov+pz1+100);
      return { px: cx+px0*s, py: cy+py1*s, s, depth: pz1 };
    };

    const draw = (t) => {
      ctx.clearRect(0,0,SIZE,SIZE);
      const rot = rotRef.current;
      const tgt = targetRotRef.current;

      if (!mouseRef.current.over) tgt.y += 0.003;
      rot.y += (tgt.y - rot.y) * 0.05;
      rot.x += (tgt.x - rot.x) * 0.05;

      const proj = NODES.map((n,i) => {
        const p = project(n, rot.y, rot.x);
        const pulse = 0.65 + Math.sin(t*1.4 + n.pulse)*0.35;
        return { ...p, n, pulse, i };
      });

      // Connections — sorted back to front
      [...CONNECTIONS]
        .sort((a,b) => ((proj[a[0]].depth+proj[a[1]].depth)/2) - ((proj[b[0]].depth+proj[b[1]].depth)/2))
        .forEach(([i,j]) => {
          const pi = proj[i], pj = proj[j];
          const avgD = (pi.depth+pj.depth)/2;
          const fade = Math.max(0,(300-Math.abs(avgD))/300);
          const alpha = fade * 0.5 * Math.min(pi.s, pj.s) * 1.4;
          const grad = ctx.createLinearGradient(pi.px,pi.py,pj.px,pj.py);
          grad.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.85,alpha*pi.pulse)})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},${Math.min(0.85,alpha*pj.pulse)})`);
          ctx.beginPath(); ctx.moveTo(pi.px,pi.py); ctx.lineTo(pj.px,pj.py);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.6 + fade*0.5;
          ctx.stroke();
        });

      // Nodes — sorted back to front
      [...proj]
        .sort((a,b)=>a.depth-b.depth)
        .forEach(p => {
          const fade = Math.max(0.1,(280-Math.abs(p.depth))/280);
          const alpha = Math.min(1, fade * p.pulse * p.s * 1.5);
          const sz = p.n.size * p.s * 2.2 * (0.8+p.pulse*0.2);

          // Big glow
          const grd = ctx.createRadialGradient(p.px,p.py,0,p.px,p.py,sz*5);
          grd.addColorStop(0,`rgba(${r},${g},${b},${Math.min(0.7,alpha*0.55)})`);
          grd.addColorStop(0.3,`rgba(${r},${g},${b},${Math.min(0.3,alpha*0.15)})`);
          grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(p.px,p.py,sz*5,0,Math.PI*2);
          ctx.fillStyle=grd; ctx.fill();

          // Core
          ctx.beginPath(); ctx.arc(p.px,p.py,sz,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(1,alpha)})`;
          ctx.fill();

          // Specular
          ctx.beginPath(); ctx.arc(p.px-sz*0.35,p.py-sz*0.35,sz*0.38,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,255,255,${Math.min(0.8,alpha*0.55)})`;
          ctx.fill();
        });

      // Big ambient glow in center
      const atmo = ctx.createRadialGradient(cx,cy,80,cx,cy,420);
      atmo.addColorStop(0,`rgba(${r},${g},${b},0.07)`);
      atmo.addColorStop(0.5,`rgba(${r},${g},${b},0.02)`);
      atmo.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(cx,cy,420,0,Math.PI*2);
      ctx.fillStyle=atmo; ctx.fill();

      // Cursor glow
      if (mouseRef.current.over) {
        const {x:mx,y:my} = mouseRef.current;
        const cg = ctx.createRadialGradient(mx,my,0,mx,my,120);
        cg.addColorStop(0,`rgba(${r},${g},${b},0.18)`);
        cg.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(mx,my,120,0,Math.PI*2);
        ctx.fillStyle=cg; ctx.fill();
      }
    };

    const loop = (ts) => { draw(ts/1000); animRef.current = requestAnimationFrame(loop); };
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
          <p className="brain-hint">move cursor to rotate</p>
        </div>
      </div>
    </section>
  );
}
