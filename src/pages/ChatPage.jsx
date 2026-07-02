// ChatPage.jsx → src/pages/ChatPage.jsx
// Dependencies: npm install emailjs-com
// Env vars needed:
//   VITE_ANTHROPIC_API_KEY
//   VITE_EMAILJS_SERVICE_ID
//   VITE_EMAILJS_TEMPLATE_ID
//   VITE_EMAILJS_PUBLIC_KEY

import { useState, useRef, useEffect } from "react";
import emailjs from "emailjs-com";

const T = {
  bg:       "#0f0e09",
  surface:  "#1a180f",
  card:     "#201e13",
  cardHov:  "#272418",
  border:   "#2e2b1a",
  gold:     "#c9a84c",
  goldDim:  "#7a6428",
  goldGlow: "rgba(201,168,76,.10)",
  text:     "#f0ead6",
  muted:    "#8a7f5a",
  faint:    "#4a4430",
  coral:    "#c96b4c",
  green:    "#6bbf82",
  red:      "#c94c4c",
};

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function claudeScore(messages) {
  const history = messages.map(m => `${m.from === "user" ? "User" : "AI"}: ${m.text}`).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: `You are a silent crisis detection system. Analyze the conversation and return ONLY valid JSON:
{"crisis_risk": <0-10>, "theme": "<word>", "needs_alert": <true|false>}
crisis_risk 7+ and needs_alert true = explicit hopelessness, self-harm, or suicidal language detected.
Return nothing else. No markdown.`,
      messages: [{ role: "user", content: history }],
    }),
  });
  const data = await res.json();
  try { return JSON.parse(data.content[0].text); }
  catch { return { crisis_risk: 0, theme: "okay", needs_alert: false }; }
}

async function claudeRespond(messages) {
  const history = messages.map(m => ({
    role: m.from === "user" ? "user" : "assistant",
    content: m.text,
  }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 350,
      system: `You are MindBridge — a warm, empathetic AI companion for Indian college students who can't always access therapy.
You speak in natural Hinglish (mix of Hindi and English). You are NOT clinical. You are like a caring, emotionally intelligent friend.
Rules:
- Always acknowledge the feeling FIRST before anything else
- Never say "I understand" as your opener — show it instead
- Never suggest "just think positive" or give empty advice
- If the person seems very low, gently remind them they're not alone and people care
- Keep responses concise — 2-4 sentences max
- Do NOT mention you are an AI unless directly asked`,
      messages: history,
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

async function sendEmergencyAlert(contactName, contactEmail, userName, triggerMessage, riskLevel) {
  emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  return emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      to_name:    contactName,
      to_email:   contactEmail,
      user_name:  userName || "Someone you care about",
      message:    triggerMessage,
      risk_level: riskLevel,
      app_name:   "MindBridge",
    }
  );
}

const Spinner = () => (
  <span style={{display:"inline-block",width:13,height:13,border:`2px solid ${T.goldDim}`,
    borderTopColor:T.gold,borderRadius:"50%",animation:"spin .7s linear infinite",
    verticalAlign:"middle",marginRight:6}}/>
);

export default function ChatPage() {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [responding, setResponding]     = useState(false);
  const [needResponse, setNeedResponse] = useState(false);

  const [photos, setPhotos]             = useState([]);
  const [histories]                     = useState([
    "Feeling lost after exams",
    "Talk about family pressure",
    "Just needed to vent",
    "Couldn't sleep last night",
    "Placement anxiety",
    "Missing home badly",
    "Nothing felt right today",
  ]);

  const [profileOpen, setProfileOpen]   = useState(false);
  const [contactName, setContactName]   = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [userName, setUserName]         = useState("");

  const [alertSent, setAlertSent]       = useState(false);
  const [crisisVisible, setCrisisVis]   = useState(false);

  const weekMoods = [
    {day:"Mon",mood:"🌤",score:6},{day:"Tue",mood:"⛅",score:5},
    {day:"Wed",mood:"🌧",score:3},{day:"Thu",mood:"⛈",score:2},
    {day:"Fri",mood:"🌤",score:6},{day:"Sat",mood:"☀️",score:8},{day:"Sun",mood:"🌤",score:7},
  ];

  const chatEndRef = useRef(null);
  const fileRef    = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    const newMsg  = { from:"user", text, id: Date.now() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");

    try {
      const score = await claudeScore(updated);
      if (score.needs_alert && score.crisis_risk >= 7 && !alertSent) {
        setCrisisVis(true);
        if (contactEmail && contactName) {
          await sendEmergencyAlert(contactName, contactEmail, userName, text, score.crisis_risk);
          setAlertSent(true);
        }
      }
    } catch { /* silent fail */ }

    if (needResponse) {
      setResponding(true);
      try {
        const reply = await claudeRespond(updated);
        setMessages(prev => [...prev, { from:"ai", text:reply, id: Date.now() }]);
      } catch {
        setMessages(prev => [...prev, { from:"ai", text:"Ek second... thoda connection issue aaya. Phir try karo — main hoon yahan.", id: Date.now() }]);
      }
      setResponding(false);
    }
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, { from:"user", text:"", image:url, id:Date.now() }]);
    setPhotos(prev => [...prev, url]);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;background:${T.bg};color:${T.text};font-family:'Inter',sans-serif;}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        textarea,input{font-family:'Inter',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes alertPop{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}
      `}</style>

      <div style={{display:"flex",height:"100vh",background:T.bg,position:"relative",overflow:"hidden"}}>

        {/* LEFT SIDEBAR */}
        <div style={{width:200,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"18px 16px 14px",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:T.gold}}>MindBridge+</span>
          </div>

          <div style={{padding:"14px 14px 10px"}}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:10,fontWeight:600}}>More Features</div>
            {["Hope Vault","Campfire Chat"].map(f => (
              <div key={f} style={{padding:"8px 10px",borderRadius:8,fontSize:12,color:T.muted,cursor:"pointer",marginBottom:4,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.text}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted}}>
                {f}
              </div>
            ))}
          </div>

          <div style={{height:1,background:T.border,margin:"0 14px"}}/>

          <div style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:10,fontWeight:600}}>Photos</div>
            {photos.length === 0
              ? <div style={{fontSize:11,color:T.faint,fontStyle:"italic"}}>Photos shared in chat appear here</div>
              : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {photos.map((p,i) => (
                    <img key={i} src={p} alt="" style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/>
                  ))}
                </div>
            }
          </div>

          <div style={{height:1,background:T.border,margin:"0 14px"}}/>

          <div style={{padding:"12px 14px",flex:1,overflowY:"auto"}}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:10,fontWeight:600}}>History</div>
            {histories.map((h,i) => (
              <div key={i} style={{padding:"7px 10px",borderRadius:8,fontSize:11,color:T.muted,cursor:"pointer",marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.text}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted}}>
                💬 {h}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CHAT */}
        <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>

          {/* Topbar */}
          <div style={{height:52,borderBottom:`1px solid ${T.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:500,color:T.text}}>Chat</span>
              <div style={{display:"flex",alignItems:"center",gap:5,background:T.card,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"3px 10px"}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:T.green,display:"inline-block",animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:10,color:T.gold,fontWeight:500,letterSpacing:".3px"}}>AP Modus ON</span>
              </div>
            </div>
            <div onClick={()=>setProfileOpen(p=>!p)} style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15,border:`2px solid ${T.border}`,flexShrink:0}}>
              👤
            </div>
          </div>

          {/* Crisis banner */}
          {crisisVisible && (
            <div style={{background:"rgba(26,20,40,.95)",borderBottom:`1px solid rgba(168,158,201,.25)`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",animation:"alertPop .3s ease"}}>
              <div style={{fontSize:12,color:"#c8b8f0",lineHeight:1.6}}>
                🌙 Yeh pal bohot bhaari lag raha hai — aur ye bilkul valid hai. Tum akele nahi ho is mein.
                {alertSent && contactName && <span style={{color:T.gold,marginLeft:8}}>· {contactName} ko quietly inform kar diya gaya hai.</span>}
              </div>
              <span onClick={()=>setCrisisVis(false)} style={{fontSize:16,color:T.muted,cursor:"pointer",marginLeft:16}}>✕</span>
            </div>
          )}

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
            {messages.length === 0 && (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.faint,textAlign:"center",gap:10,paddingTop:80}}>
                <div style={{fontSize:36}}>💬</div>
                <div style={{fontSize:14,color:T.muted}}>Jo bhi mann mein hai — yahan likh sakte ho.</div>
                <div style={{fontSize:12,maxWidth:300,lineHeight:1.7}}>AP Modus silently monitor kar raha hai. Jab reply chahiye — "Need Response" on karo.</div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",animation:"fadeUp .3s ease"}}>
                {m.from==="ai" && (
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>
                    🧠
                  </div>
                )}
                <div style={{maxWidth:"68%",padding:"11px 15px",borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.from==="user"?T.goldGlow:"rgba(255,255,255,.04)",border:`1px solid ${m.from==="user"?T.goldDim:T.border}`,fontSize:13,lineHeight:1.75,color:T.text}}>
                  {m.image ? <img src={m.image} alt="shared" style={{maxWidth:"100%",borderRadius:8,display:"block"}}/> : m.text}
                </div>
              </div>
            ))}

            {responding && (
              <div style={{display:"flex",alignItems:"center",gap:8,animation:"fadeUp .3s ease"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🧠</div>
                <div style={{padding:"11px 15px",borderRadius:"16px 16px 16px 4px",background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,fontSize:13,color:T.muted}}>
                  <Spinner/>soch raha hoon...
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Input bar */}
          <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            <button onClick={()=>fileRef.current?.click()} style={{width:36,height:36,borderRadius:9,background:T.card,border:`1px solid ${T.border}`,color:T.muted,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              📎
            </button>

            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleSend()}
              placeholder="Start a chat..."
              style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 14px",color:T.text,fontSize:13,outline:"none",transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor=T.gold}
              onBlur={e=>e.target.style.borderColor=T.border}
            />

            <button onClick={()=>setNeedResponse(p=>!p)} style={{padding:"9px 14px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${needResponse?T.gold:T.border}`,background:needResponse?T.goldGlow:"transparent",color:needResponse?T.gold:T.muted,transition:"all .2s",flexShrink:0,whiteSpace:"nowrap"}}>
              {needResponse ? "✦ Responding" : "Need Response"}
            </button>

            <button onClick={handleSend} disabled={!input.trim()} style={{width:36,height:36,borderRadius:9,background:T.gold,border:"none",color:T.bg,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:input.trim()?1:.4,transition:"opacity .2s"}}>→</button>
          </div>
        </div>

        {/* PROFILE PANEL */}
        {profileOpen && (
          <div style={{width:260,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,animation:"fadeUp .25s ease"}}>
            <div style={{padding:"18px 16px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:500}}>Profile</span>
              <span onClick={()=>setProfileOpen(false)} style={{cursor:"pointer",color:T.muted,fontSize:16}}>✕</span>
            </div>

            <div style={{padding:"16px 16px 0"}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:8,fontWeight:600}}>Your name (optional)</div>
              <input value={userName} onChange={e=>setUserName(e.target.value)} placeholder="Anon"
                style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=T.gold}
                onBlur={e=>e.target.style.borderColor=T.border}
              />
            </div>

            <div style={{padding:"18px 16px 0"}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:12,fontWeight:600}}>Weekly Mood</div>
              <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
                {weekMoods.map(d=>(
                  <div key={d.day} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <div style={{fontSize:16}}>{d.mood}</div>
                    <div style={{width:"100%",height:40,background:T.card,borderRadius:4,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                      <div style={{width:"100%",height:`${d.score*10}%`,background:`linear-gradient(180deg,${T.gold},${T.goldDim})`,transition:"height .4s"}}/>
                    </div>
                    <div style={{fontSize:8,color:T.faint}}>{d.day}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:T.muted,lineHeight:1.6}}>
                This week: <span style={{color:T.gold}}>Mixed — mid-week was heavy.</span>
              </div>
            </div>

            <div style={{height:1,background:T.border,margin:"18px 16px"}}/>

            <div style={{padding:"0 16px 20px"}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1px",color:T.faint,marginBottom:12,fontWeight:600}}>Emergency Contact</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.65,marginBottom:12}}>
                Agar AP Modus high-risk detect kare — in logon ko ek gentle email jaayegi. No details shared.
              </div>
              <input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Contact name (e.g. Maa, Rohan)"
                style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",marginBottom:8}}
                onFocus={e=>e.target.style.borderColor=T.gold}
                onBlur={e=>e.target.style.borderColor=T.border}
              />
              <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="their@email.com" type="email"
                style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",marginBottom:12}}
                onFocus={e=>e.target.style.borderColor=T.gold}
                onBlur={e=>e.target.style.borderColor=T.border}
              />
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:contactEmail&&contactName?"rgba(107,191,130,.08)":T.card,border:`1px solid ${contactEmail&&contactName?"rgba(107,191,130,.3)":T.border}`,borderRadius:9,transition:"all .3s"}}>
                <span style={{fontSize:14}}>{contactEmail&&contactName?"✅":"⚠️"}</span>
                <span style={{fontSize:11,color:contactEmail&&contactName?T.green:T.muted}}>
                  {contactEmail&&contactName?"Alert ready — AP Modus active":"Add contact to activate alerts"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
