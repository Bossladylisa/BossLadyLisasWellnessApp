import { useState, useEffect, useRef } from "react";

const PAGES={HOME:'home',LOUNGE:'lounge',REFLECTIONS:'reflections',PHOENIX:'phoenix',GARDEN:'garden',LILYPAD:'lilypad',NOTES:'notes',PLANNER:'planner',COMMUNITY:'community',PREMIUM:'premium'};

const C={bg:'linear-gradient(145deg,#0f0820 0%,#1a0f35 30%,#0d1f2d 65%,#081a1f 100%)',glass:'rgba(255,255,255,0.045)',glassBorder:'rgba(255,255,255,0.10)',gold:'#c9a84c',goldLight:'#e8cc7a',teal:'#4ecdc4',plum:'#a06edc',rose:'#d4838f',peach:'#f7c59f',text:'#f0eaf8',textMuted:'rgba(240,234,248,0.45)',textFaint:'rgba(240,234,248,0.25)'};

// ═══════════════════════════════════════════════════════════════════════════
// BY&B INCLUSIVE CONTENT PATCH — INTEGRATED
// BossLadyLisa's Beautify Yourself & Beyond App℠
//
// All mood data and affirmations rewritten for universal inclusivity.
// No affirmation assumes gender, orientation, relationship structure,
// body type, or life path. Identity-affirming language woven throughout.
// ═══════════════════════════════════════════════════════════════════════════

// ── MOOD CARDS ──────────────────────────────────────────────────────────────
// 11 moods including 2 new: Unseen (radical self-witnessing) & Proud (joy as resistance)
// Each card carries: quote (affirmation), body (somatic guidance), tag (clinical framework)
const MOODS = [
  {
    key: "calm",
    mood: "Calm",
    emoji: "🌊",
    quote: "I can be the peace the world needs to feel.",
    body: "Take a moment to fully inhabit this feeling. Calm is not empty — it is full of possibility. Notice where in your body this peace lives right now.",
    tag: "Gratitude Focus",
    color: "#6ee7b7",
  },
  {
    key: "chaotic",
    mood: "Chaotic",
    emoji: "🌀",
    quote: "I breathe in peace. I breathe out chaos.",
    body: "You do not have to solve everything right now. Focus on one small, manageable task and give it your full attention. Order follows intention.",
    tag: "Prioritization Practice",
    color: "#c084fc",
  },
  {
    key: "balanced",
    mood: "Balanced",
    emoji: "⚖️",
    quote: "My progress shines even in silence.",
    body: "Acknowledge what you have moved through to arrive here. Equilibrium is not given — it is earned. Continue with mindful intention. You are doing the work.",
    tag: "Self-Compassion",
    color: "#6ee7b7",
  },
  {
    key: "overwhelmed",
    mood: "Overwhelmed",
    emoji: "🌊",
    quote: "I set boundaries with love and strength.",
    body: "Sending love to everyone who wants to do better but can't find the energy to make the necessary changes — that includes you, right now. Break what feels impossible into one next step — just one. It is okay to ask for help. It is okay to put something down. You are allowed to protect your energy.",
    tag: "Boundary Setting",
    color: "#e8527a",
  },
  {
    key: "joyful",
    mood: "Joyful",
    emoji: "☀️",
    quote: "I am worthy of all the good things coming my way.",
    body: "Receive this fully — without shrinking, without guilt. Joy is not selfish. Let it radiate. Share it with someone who will genuinely celebrate with you.",
    tag: "Spreading Positivity",
    color: "#fbbf24",
  },
  {
    key: "anxious",
    mood: "Anxious",
    emoji: "🌬️",
    quote: "This feeling is temporary, and I am safe.",
    body: "Just breathe. 1... 2... 3. Your body needs that before any words can land. Try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. Your body is here. You are here. And if the uncertainty feels too large — you don't have to know where this is taking you. You just have to take the next breath.",
    tag: "Somatic Grounding",
    color: "#c084fc",
  },
  {
    key: "stressed",
    mood: "Stressed",
    emoji: "🔥",
    quote: "I choose calm over chaos.",
    body: "Step away from the source for 5 minutes if you can — a walk, a stretch, a breath of air. Your best thinking does not happen under pressure. Give your nervous system a moment.",
    tag: "Stress Regulation",
    color: "#e8527a",
  },
  {
    key: "sad",
    mood: "Sad",
    emoji: "🌧️",
    quote: "My grief is valid. My healing is happening even now.",
    body: "You do not have to rush through this. Sadness is not weakness — it is proof that something mattered to you. It's hard to forget someone who gave you so much to remember. Let yourself feel it without judgment. It moves when it is ready. And somewhere, there are people who would climb down into this darkness with you — not to pull you out, but just to remind you that you are not alone in it.",
    tag: "Emotional Processing",
    color: "#93c5fd",
  },
  {
    key: "motivated",
    mood: "Motivated",
    emoji: "⚡",
    quote: "I move with purpose and I trust my direction.",
    body: "Channel this energy intentionally. Write down the one most important thing you want to accomplish while this momentum is alive. Then begin — even imperfectly.",
    tag: "Momentum Building",
    color: "#fbbf24",
  },
  {
    key: "unseen",
    mood: "Unseen",
    emoji: "🌑",
    quote: "Being unseen by the wrong people makes space for the right ones to find me.",
    body: "Your worth is not determined by who chooses to witness it. Right now, be your own witness. Write down three things that are true about you — not what others see, but what you know. Start there.",
    tag: "Radical Self-Witnessing",
    color: "#a78bfa",
  },
  {
    key: "proud",
    mood: "Proud",
    emoji: "🌈",
    quote: "This joy — this pride — belongs to me. I earned it.",
    body: "Do not minimize this. Pride is not arrogance — it is the rightful celebration of authenticity, survival, and growth. Soak in it fully. Then share it with someone who will truly rejoice with you.",
    tag: "Joy as Resistance",
    color: "#f9a8c9",
  },
];

// Helper: map patch colors to app palette for visual consistency
const moodColorMap = {
  "#6ee7b7": C.teal,
  "#c084fc": C.plum,
  "#e8527a": C.rose,
  "#fbbf24": C.gold,
  "#93c5fd": '#93c5fd',
  "#a78bfa": C.plum,
  "#f9a8c9": '#f9a8c9',
};

const getMoodDisplayColor = (hex) => moodColorMap[hex] || hex;

// Legacy MOOD_DATA adapter for backward compatibility with existing components
const MOOD_DATA = {};
MOODS.forEach(m => {
  MOOD_DATA[m.emoji + " " + m.mood] = {
    quote: m.quote,
    tip: m.body,
    color: getMoodDisplayColor(m.color),
    tag: m.tag,
    body: m.body,
    key: m.key,
  };
});

const PRIORITIES=["High 🔥","Medium ⚡","Low 🌱"];
const PRI_COLOR={"High 🔥":C.rose,"Medium ⚡":C.gold,"Low 🌱":C.teal};

const RISE_MSGS=["See, you got this. ✦","Look at you — doing 2% better than yesterday.","You conquered today instead of letting it conquer your day. ✦","See, you are amazing. Don't you ever forget it.","Five rituals. All done. That's not nothing — that's everything.","You showed up for yourself today. That's the whole job.","Two percent better. Every single day. Look at you go. ✦","You didn't just survive today. You rose through it.","This is what healing looks like. You. Right here. Doing the work.","See that? That's what a Phoenix looks like in real life. ✦"];

const CRISIS_WORDS=['suicide','kill myself','end my life','self harm','self-harm','cutting','worthless','want to die','hurt myself','not worth living','overdose','no reason to live'];
const PROFANITY=['fuck','shit','bitch','asshole','bastard','cunt'];
const moderateText=text=>{
  const lower=(text||'').toLowerCase();
  if(CRISIS_WORDS.some(w=>lower.includes(w)))return{blocked:true,reason:'crisis',msg:'This message suggests you may be struggling deeply. Please know you are not alone — call or text 988 (Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line). You matter here.'};
  if(PROFANITY.some(w=>lower.includes(w)))return{blocked:true,reason:'profanity',msg:'This space is kept gentle for everyone. Please adjust your wording before sharing.'};
  return{blocked:false};
};

/* ── Global CSS ── */
const GlobalStyles=()=>{useEffect(()=>{const l=document.createElement('link');l.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Nunito:wght@300;400;500;600&display=swap';l.rel='stylesheet';document.head.appendChild(l);const s=document.createElement('style');s.textContent=`
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes pulse-glow{0%,100%{box-shadow:0 0 18px 2px rgba(160,110,220,0.18)}50%{box-shadow:0 0 40px 8px rgba(160,110,220,0.38)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes fade-slide{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes drift-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes twinkle{0%,100%{opacity:0.12}50%{opacity:0.55}}
  @keyframes pad-bob{0%,100%{transform:translate(-50%,-50%) rotate(-2deg) scale(1)}50%{transform:translate(-50%,-50%) rotate(1.5deg) scale(1.04)}}
  @keyframes pad-sway{0%,100%{transform:translate(-50%,-50%) rotate(-1deg)}50%{transform:translate(-50%,-50%) rotate(1deg)}}
  @keyframes petal-slight{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(-7deg) scale(1.08)}}
  @keyframes petal-wild{0%,100%{transform:rotate(0) scale(1)}20%{transform:rotate(-24deg) scale(1.18)}55%{transform:rotate(20deg) scale(0.86)}}
  @keyframes bfly-hover{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-8px)}}
  @keyframes water-line{0%,100%{opacity:0.04}50%{opacity:0.10}}
  @keyframes ripple-ring{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.3}50%{transform:translate(-50%,-50%) scale(1.18);opacity:0.5}}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:rgba(15,8,30,0.6)}
  ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#c9a84c,#e8cc7a);border-radius:6px}
  *{scrollbar-color:#c9a84c rgba(15,8,30,0.6);scrollbar-width:thin}
`;document.head.appendChild(s);},[]);return null;};

/* ── Style helpers ── */
const shimTx={background:`linear-gradient(90deg,${C.gold} 0%,${C.goldLight} 30%,#fff8e7 50%,${C.goldLight} 70%,${C.gold} 100%)`,backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'shimmer 3.5s linear infinite',display:'inline-block'};
const gc=(a=C.plum,ex={})=>({background:C.glass,backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',border:`1px solid ${C.glassBorder}`,borderRadius:'18px',padding:'24px',position:'relative',overflow:'hidden',transition:'all 0.3s ease',...ex});
const btnS=(c=C.gold)=>({padding:'10px 26px',background:`linear-gradient(135deg,${c}22,${c}10)`,border:`1px solid ${c}55`,borderRadius:'28px',color:c,cursor:'pointer',fontFamily:"'Nunito',sans-serif",fontSize:'13px',fontWeight:'500',letterSpacing:'0.4px',transition:'all 0.25s',backdropFilter:'blur(8px)'});
const inpS={width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${C.glassBorder}`,borderRadius:'12px',padding:'12px 16px',color:C.text,fontFamily:"'Nunito',sans-serif",fontSize:'13px',outline:'none',boxSizing:'border-box',resize:'vertical',backdropFilter:'blur(8px)'};
const lblS=(c=C.gold)=>({fontSize:'9.5px',color:c,letterSpacing:'2.8px',textTransform:'uppercase',display:'block',marginBottom:'12px',fontFamily:"'Nunito',sans-serif",fontWeight:'600'});
const pillS=(a,c)=>({padding:'6px 15px',borderRadius:'20px',border:`1px solid ${a?c:C.glassBorder}`,background:a?`${c}18`:'rgba(255,255,255,0.03)',color:a?c:C.textMuted,cursor:'pointer',fontSize:'12px',fontFamily:"'Nunito',sans-serif",transition:'all 0.2s',display:'inline-block',margin:'4px',backdropFilter:'blur(6px)'});
const radioSt=(a,c)=>({width:'15px',height:'15px',borderRadius:'50%',border:`2px solid ${a?c:C.glassBorder}`,background:a?c:'transparent',flexShrink:0,transition:'all 0.2s'});
const checkSt=(a,c)=>({width:'18px',height:'18px',borderRadius:'5px',border:`2px solid ${a?c:C.glassBorder}`,background:a?`${c}22`:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:c,flexShrink:0,transition:'all 0.2s',cursor:'pointer'});

const STitle=({children})=><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,5vw,38px)',fontWeight:'400',marginBottom:'4px',...shimTx}}>{children}</h2>;
const SSub=({children})=><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textFaint,fontStyle:'italic',marginBottom:'32px'}}>{children}</p>;
const Page=({children})=><div style={{maxWidth:'820px',margin:'0 auto',padding:'36px 20px 100px',animation:'fade-slide 0.45s ease both'}}>{children}</div>;

const Dragonfly=({size=28,color=C.teal,opacity=0.6})=>(<svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{opacity}} aria-hidden="true"><ellipse cx="16" cy="16" rx="2.2" ry="8" fill={color}/><ellipse cx="9" cy="11" rx="7" ry="3" fill={color} opacity="0.65" transform="rotate(-18 9 11)"/><ellipse cx="23" cy="11" rx="7" ry="3" fill={color} opacity="0.65" transform="rotate(18 23 11)"/><ellipse cx="8.5" cy="19" rx="6" ry="2.5" fill={color} opacity="0.45" transform="rotate(12 8.5 19)"/><ellipse cx="23.5" cy="19" rx="6" ry="2.5" fill={color} opacity="0.45" transform="rotate(-12 23.5 19)"/><circle cx="16" cy="9" r="2" fill={color}/><circle cx="14.8" cy="8.2" r="0.7" fill="rgba(255,255,255,0.6)"/></svg>);

const AddItemRow=({placeholder,onAdd,accent=C.gold})=>{const [val,setVal]=useState('');const [open,setOpen]=useState(false);if(!open)return <span style={{...pillS(false,accent),borderStyle:'dashed',marginTop:'6px'}} onClick={()=>setOpen(true)}>+ Add yours</span>;return(<div style={{display:'flex',gap:'8px',marginTop:'10px',alignItems:'center',flexWrap:'wrap'}}><input autoFocus style={{...inpS,flex:'1',minWidth:'160px',padding:'8px 14px',borderRadius:'20px',border:`1px solid ${accent}55`,fontSize:'12px'}} placeholder={placeholder} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onAdd(val);setVal('');setOpen(false);}if(e.key==='Escape'){setVal('');setOpen(false);}}}/><span style={{...pillS(true,accent),margin:0,padding:'7px 14px'}} onClick={()=>{onAdd(val);setVal('');setOpen(false);}}>Save</span><span style={{...pillS(false,C.rose),margin:0,padding:'7px 10px',borderColor:`${C.rose}44`}} onClick={()=>{setVal('');setOpen(false);}}>✕</span></div>);};

const SharePrompt=({text,type,userName})=>{
  const [open,setOpen]=useState(false);const [signing,setSigning]=useState(false);const [name,setName]=useState(userName||'');const [done,setDone]=useState(false);const [saving,setSaving]=useState(false);const [modMsg,setModMsg]=useState('');
  const share=async()=>{if(!text?.trim())return;const mod=moderateText(text);if(mod.blocked){setModMsg(mod.msg);return;}setSaving(true);const e={id:`share_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,text:text.trim(),type,signature:signing&&name.trim()?name.trim():'Anonymous',ts:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};try{await window.storage.set(`byb:community:${e.id}`,JSON.stringify(e),true);}catch{}setSaving(false);setDone(true);setOpen(false);};
  if(done)return <span style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.teal,fontStyle:'italic'}}>✦ Offered to the Community Garden</span>;
  if(!open)return <span style={{...pillS(false,C.teal),borderStyle:'dashed',fontSize:'11px'}} onClick={()=>setOpen(true)}>🌿 Share with Community</span>;
  return(<div style={{marginTop:'14px',padding:'18px 20px',background:`${C.teal}08`,border:`1px solid ${C.teal}28`,borderRadius:'14px',animation:'drift-in 0.3s ease both'}}><div style={lblS(C.teal)}>Offer this to the Community Garden?</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'14px',fontStyle:'italic',color:C.textMuted,lineHeight:'1.6',marginBottom:'14px'}}>"{text}"</p>{modMsg&&<div style={{padding:'12px 16px',background:'rgba(212,131,143,0.1)',border:'1px solid rgba(212,131,143,0.3)',borderRadius:'12px',marginBottom:'14px',fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.rose,lineHeight:'1.7'}}>{modMsg}</div>}<div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',cursor:'pointer'}} onClick={()=>setSigning(!signing)}><div style={checkSt(signing,C.teal)}>{signing?'✓':''}</div><span style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:signing?C.teal:C.textMuted}}>Sign with my name</span></div>{signing&&<input style={{...inpS,marginBottom:'14px',borderRadius:'20px',padding:'8px 14px',fontSize:'12px'}} placeholder="Your name or a word that represents you..." value={name} onChange={e=>setName(e.target.value)}/>}<div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}><button style={btnS(C.teal)} onClick={share} disabled={saving||!!modMsg}>{saving?'Sharing...':'Share ✦'}</button><button style={{...btnS(C.textFaint),padding:'10px 16px'}} onClick={()=>{setOpen(false);setModMsg('');}}>Keep Private</button></div></div>);
};

/* ══ COMMUNITY GARDEN ══ */
const ZONES=[{id:'affirmation',name:'The Rose Garden',subtitle:'Affirmations of worth & power',icon:'🌹',color:'#e8829a',bg:'linear-gradient(145deg,#3d0a1a,#1a0615)',decos:['🌹','🌸','🌺','🏵️','🌷','🌸']},{id:'mantra',name:'The Sacred Grove',subtitle:'Soul mantras & sacred words',icon:'🌲',color:C.plum,bg:'linear-gradient(145deg,#1a0a35,#0a1020)',decos:['🌲','🍃','🌿','🌑','🪴','🍂']},{id:'grounding',name:'The Reflection Pool',subtitle:'Grounding check-ins & honest moments',icon:'💧',color:C.teal,bg:'linear-gradient(145deg,#041a22,#061520)',decos:['🪷','💧','🌊','🫧','🪸','💧'],pool:true},{id:'journal',name:'The Sunflower Field',subtitle:'Intentions, gratitude & daily light',icon:'🌻',color:C.gold,bg:'linear-gradient(145deg,#251500,#120900)',decos:['🌻','🌾','🌼','🌻','🍯','🌾']},{id:'all',name:'The Open Meadow',subtitle:'All offerings from the community',icon:'🕊️',color:'#90d48a',bg:'linear-gradient(145deg,#082010,#041008)',decos:['🦋','🌿','🍀','🌱','🐝','🦋']}];
const scatterD=(d,n)=>Array.from({length:n},(_,i)=>({emoji:d[i%d.length],top:`${(i*47+13)%85+5}%`,left:`${(i*61+7)%85+5}%`,size:`${12+(i%4)*5}px`,opacity:0.12+(i%6)*0.06,rotate:`${(i*83)%360}deg`}));

const ZoneCard=({zone,selected,onClick,wide=false})=>{const [hov,setHov]=useState(false);const decos=scatterD(zone.decos,wide?18:12);return(<div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{gridColumn:wide?'1 / -1':undefined,background:zone.bg,border:`1px solid ${selected?zone.color+'70':hov?zone.color+'35':zone.color+'15'}`,borderRadius:'18px',padding:wide?'20px 24px':'22px 18px',cursor:'pointer',position:'relative',overflow:'hidden',transition:'all 0.35s ease',boxShadow:selected?`0 0 40px ${zone.color}22,inset 0 0 40px ${zone.color}08`:hov?`0 8px 32px ${zone.color}14`:'none',minHeight:wide?'100px':'140px',transform:hov&&!selected?'translateY(-3px)':'translateY(0)'}}>{decos.map((d,i)=><span key={i} style={{position:'absolute',top:d.top,left:d.left,fontSize:d.size,opacity:selected?d.opacity*1.8:hov?d.opacity*1.4:d.opacity,transform:`rotate(${d.rotate})`,pointerEvents:'none',userSelect:'none',transition:'opacity 0.4s'}}>{d.emoji}</span>)}{zone.pool&&<div style={{position:'absolute',bottom:'-10px',left:'10%',right:'10%',height:'40px',background:`radial-gradient(ellipse,${C.teal}18,transparent 70%)`,borderRadius:'50%',animation:'ripple-ring 4s ease-in-out infinite',pointerEvents:'none'}}/>}{selected&&<div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 30% 70%,${zone.color}10,transparent 65%)`,pointerEvents:'none'}}/>}<div style={{position:'relative',zIndex:1,display:wide?'flex':'block',alignItems:wide?'center':'flex-start',gap:wide?'16px':'0'}}><div style={{fontSize:wide?'32px':'26px',marginBottom:wide?0:'10px'}}>{zone.icon}</div><div><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:wide?'20px':'17px',fontWeight:'400',color:zone.color,marginBottom:'4px'}}>{zone.name}</h3><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:'rgba(240,234,248,0.32)',lineHeight:'1.4',margin:0}}>{zone.subtitle}</p>{selected&&<div style={{marginTop:'8px',fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:zone.color,letterSpacing:'1.5px',animation:'fade-slide 0.3s ease both'}}>✦ You are here — enter below</div>}</div></div></div>);};

const CommunityGardenPage=()=>{
  const [selZ,setSelZ]=useState(null);const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(false);const [bloomed,setBloomed]=useState({});
  const loadZone=async z=>{if(selZ?.id===z.id){setSelZ(null);setPosts([]);return;}setSelZ(z);setLoading(true);try{const res=await window.storage.list('byb:community:',true);if(res?.keys?.length){const all=[];for(const k of res.keys){try{const r=await window.storage.get(k,true);if(r?.value)all.push(JSON.parse(r.value));}catch{}}const f=z.id==='all'?all:all.filter(p=>p.type===z.id);f.sort((a,b)=>(b.blooms||0)-(a.blooms||0)||(b.id.localeCompare(a.id)));setPosts(f);}else setPosts([]);}catch{setPosts([]);}setLoading(false);};
  const handleBloom=async postId=>{if(bloomed[postId])return;setBloomed(b=>({...b,[postId]:true}));try{const key=`byb:community:${postId}`;const res=await window.storage.get(key,true);if(res?.value){const data=JSON.parse(res.value);data.blooms=(data.blooms||0)+1;await window.storage.set(key,JSON.stringify(data),true);setPosts(prev=>prev.map(p=>p.id===postId?data:p));}}catch(err){console.error("The garden couldn't receive the bloom:",err);}};
  return(<Page><STitle>🕊️ Community Garden</STitle><SSub>A living sanctuary of shared light. Walk into a space and see what others have left behind.</SSub>
    <div style={{position:'relative',borderRadius:'24px',overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)',marginBottom:'30px',background:'linear-gradient(180deg,#04020e,#070d1a 40%,#050f0a)'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>{Array.from({length:38},(_,i)=><div key={i} style={{position:'absolute',width:i%7===0?'3px':'2px',height:i%7===0?'3px':'2px',borderRadius:'50%',background:'white',opacity:0.08+(i%8)*0.06,top:`${(i*37+11)%45}%`,left:`${(i*53+7)%100}%`,animation:`twinkle ${2+(i%4)}s ease-in-out ${i%3}s infinite`}}/>)}<div style={{position:'absolute',top:'12px',right:'24px',width:'28px',height:'28px',borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#fffbe8,#e8d88a)',boxShadow:'0 0 20px rgba(232,216,138,0.3)',opacity:0.7}}/></div>
      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'18px 16px 4px'}}><span style={{fontFamily:"'Nunito',sans-serif",fontSize:'9px',color:C.textFaint,letterSpacing:'3.5px',textTransform:'uppercase'}}>✦ Walk into a garden space ✦</span></div>
      <div style={{position:'absolute',top:'18px',left:'18px',animation:'float 7s ease-in-out infinite',zIndex:1,pointerEvents:'none'}}><Dragonfly size={22} color={C.teal} opacity={0.18}/></div>
      <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',padding:'12px 16px 20px'}}>
        {ZONES.slice(0,2).map(z=><ZoneCard key={z.id} zone={z} selected={selZ?.id===z.id} onClick={()=>loadZone(z)}/>)}
        <ZoneCard zone={ZONES[2]} selected={selZ?.id===ZONES[2].id} onClick={()=>loadZone(ZONES[2])} wide/>
        {ZONES.slice(3).map(z=><ZoneCard key={z.id} zone={z} selected={selZ?.id===z.id} onClick={()=>loadZone(z)}/>)}
      </div>
    </div>
    {selZ&&<div style={{animation:'fade-slide 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'22px',padding:'16px 20px',background:`${selZ.color}08`,border:`1px solid ${selZ.color}22`,borderRadius:'16px'}}>
        <span style={{fontSize:'26px'}}>{selZ.icon}</span>
        <div><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontWeight:'400',color:selZ.color,margin:0}}>{selZ.name}</h3><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,margin:'2px 0 0'}}>{selZ.subtitle}</p></div>
        {!loading&&<div style={{marginLeft:'auto',fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint}}>{posts.length} offering{posts.length!==1?'s':''}</div>}
      </div>
      {loading?<div style={{textAlign:'center',padding:'50px'}}><div style={{width:'24px',height:'24px',border:`2px solid ${selZ.color}33`,borderTop:`2px solid ${selZ.color}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 14px'}}/><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'15px',fontStyle:'italic',color:C.textFaint}}>Gathering offerings...</p></div>
      :posts.length===0?<div style={{...gc(),textAlign:'center',padding:'44px'}}><div style={{fontSize:'40px',marginBottom:'14px',opacity:0.4}}>{selZ.icon}</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'17px',fontStyle:'italic',color:C.textMuted,marginBottom:'8px'}}>This space is waiting for its first offering.</p><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textFaint}}>Share something from the Lounge or Reflections to plant the first seed.</p></div>
      :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'14px'}}>{posts.map((post,i)=>(
        <div key={post.id} style={{background:`linear-gradient(145deg,${selZ.color}0a,rgba(255,255,255,0.02))`,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:`1px solid ${selZ.color}22`,borderRadius:'16px',padding:'22px',position:'relative',overflow:'hidden',animation:`drift-in 0.4s ease ${i*0.07}s both`}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:`linear-gradient(90deg,transparent,${selZ.color}50,transparent)`}}/>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'15px',fontStyle:'italic',lineHeight:'1.75',color:C.text,marginBottom:'16px'}}>"{post.text}"</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:selZ.color,letterSpacing:'1px'}}>— {post.signature}</span>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <button onClick={()=>handleBloom(post.id)} style={{background:bloomed[post.id]?`${selZ.color}20`:'none',border:'none',cursor:bloomed[post.id]?'default':'pointer',fontSize:'14px',transition:'transform 0.2s',transform:'scale(1)',padding:'2px 6px',borderRadius:'20px'}} onMouseEnter={e=>{if(!bloomed[post.id])e.currentTarget.style.transform='scale(1.25)';}} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                🌸 <span style={{fontSize:'10px',color:C.textFaint,fontFamily:"'Nunito',sans-serif"}}>{post.blooms||0}</span>
              </button>
              <span style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:C.textFaint}}>{post.ts}</span>
            </div>
          </div>
        </div>
      ))}</div>}
    </div>}
  </Page>);
};

/* ══ LILY PAD ══ */
const PADS=[{id:0,cx:'18%',cy:'27%',sz:56},{id:1,cx:'50%',cy:'20%',sz:52},{id:2,cx:'78%',cy:'30%',sz:58},{id:3,cx:'26%',cy:'68%',sz:62},{id:4,cx:'57%',cy:'73%',sz:55},{id:5,cx:'82%',cy:'62%',sz:50}];
const INTENSITY={gentle:{rounds:2,label:'🌿 Gentle',desc:'2 rounds · mild unease'},moderate:{rounds:4,label:'🌊 Moderate',desc:'4 rounds · elevated anxiety'},intense:{rounds:6,label:'🔥 Intense',desc:'6 rounds · full overwhelm'}};

const LilyPadComp=({pad,selected,petalState,onClick,phase})=>(<div onClick={phase==='selecting'?onClick:undefined} style={{position:'absolute',left:pad.cx,top:pad.cy,width:pad.sz+'px',height:(pad.sz*0.82)+'px',background:selected?'radial-gradient(ellipse at 38% 32%,#62c04e,#2a6018)':'radial-gradient(ellipse at 38% 32%,#3a7525,#184010)',borderRadius:'52% 48% 53% 47% / 56% 54% 46% 44%',transform:'translate(-50%,-50%)',cursor:phase==='selecting'?'pointer':'default',border:selected?'2px solid rgba(140,230,100,0.6)':'1px solid rgba(70,130,40,0.22)',boxShadow:selected?'0 0 30px rgba(100,210,70,0.38),0 5px 16px rgba(0,0,0,0.5)':'0 3px 10px rgba(0,0,0,0.4)',animation:selected?'pad-bob 4s ease-in-out infinite':'pad-sway 6s ease-in-out infinite',transition:'border 0.5s,box-shadow 0.5s',display:'flex',alignItems:'center',justifyContent:'center',zIndex:selected?3:1}}>{selected&&<div style={{fontSize:(pad.sz*0.40)+'px',animation:petalState==='wild'?'petal-wild 0.3s ease-in-out infinite':petalState==='slight'?'petal-slight 0.9s ease-in-out infinite':'none',transformOrigin:'bottom center',filter:'drop-shadow(0 0 12px rgba(255,200,220,0.95))',zIndex:4,position:'relative'}}>🌸</div>}<div style={{position:'absolute',bottom:-3,left:'47%',width:'4px',height:'14px',background:'rgba(20,70,10,0.7)',borderRadius:'2px',transform:'translateX(-50%)',zIndex:0}}/></div>);

const ButterflyComp=({bx,by,state})=>{if(state==='hidden')return null;return(<div style={{position:'absolute',left:bx,top:by,transform:'translate(-50%,-50%)',transition:'left 2.2s ease-in-out,top 2.2s ease-in-out,opacity 1.8s',zIndex:5,pointerEvents:'none',opacity:state==='departing'?0:1,animation:state!=='departing'?'bfly-hover 2.8s ease-in-out infinite':'none'}}><svg width="40" height="32" viewBox="0 0 40 32" aria-hidden="true"><ellipse cx="9" cy="13" rx="9.5" ry="6.5" fill="#c9a84c" opacity="0.9" transform="rotate(-28 9 13)"/><ellipse cx="31" cy="13" rx="9.5" ry="6.5" fill="#c9a84c" opacity="0.9" transform="rotate(28 31 13)"/><ellipse cx="8" cy="22" rx="7" ry="5" fill="#e8cc7a" opacity="0.78" transform="rotate(22 8 22)"/><ellipse cx="32" cy="22" rx="7" ry="5" fill="#e8cc7a" opacity="0.78" transform="rotate(-22 32 22)"/><ellipse cx="20" cy="16" rx="2.2" ry="7.5" fill="#2a1808"/><circle cx="20" cy="8.5" r="3" fill="#2a1808"/><line x1="17" y1="6" x2="11" y2="1" stroke="#2a1808" strokeWidth="1.3" strokeLinecap="round"/><line x1="23" y1="6" x2="29" y2="1" stroke="#2a1808" strokeWidth="1.3" strokeLinecap="round"/></svg></div>);};

const ProgRing=({progress,color,size=92})=>{const r=(size-10)/2;const circ=2*Math.PI*r;return(<svg width={size} height={size} style={{position:'absolute',inset:0,transform:'rotate(-90deg)'}} aria-hidden="true"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}22`} strokeWidth="5"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round" style={{transition:'stroke-dashoffset 0.08s'}}/></svg>);};

const LilyPadExperience=({emergency=false,onClose})=>{
  const [phase,setPhase]=useState(emergency?'breathing':'intro');const [selPad,setSelPad]=useState(emergency?PADS[1]:null);const [breathPhase,setBreathPhase]=useState('inhale');const [round,setRound]=useState(1);const [intensity,setIntensity]=useState('moderate');const [petalState,setPetalState]=useState('still');const [bState,setBState]=useState(emergency?'approaching':'hidden');const [isHolding,setIsHolding]=useState(false);const [holdProg,setHoldProg]=useState(0);const [msg,setMsg]=useState(emergency?'Take a slow, deep breath in...':'');const [inhaleAnim,setInhaleAnim]=useState(false);const [audioOn,setAudioOn]=useState(false);
  const holdRef=useRef(null);const startRef=useRef(null);const totalRounds=INTENSITY[intensity].rounds;
  const speak=text=>{if(!audioOn||typeof window.speechSynthesis==='undefined')return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.72;u.pitch=0.88;u.volume=0.9;const voices=window.speechSynthesis.getVoices();const v=voices.find(v=>v.name.includes('Samantha')||v.name.includes('Karen')||(v.lang==='en-US'&&v.default));if(v)u.voice=v;window.speechSynthesis.speak(u);};
  const getBPos=()=>{if(!selPad)return{x:'86%',y:'8%'};const map={hidden:{x:'90%',y:'5%'},far:{x:'84%',y:'8%'},approaching:{x:'64%',y:'22%'},landing:{x:selPad.cx,y:`calc(${selPad.cy} - 38px)`},departing:{x:'92%',y:'3%'},startled:{x:'76%',y:'15%'}};return map[bState]||{x:'84%',y:'8%'};};
  const bp=getBPos();
  useEffect(()=>{if(phase!=='breathing'||breathPhase!=='inhale')return;setInhaleAnim(true);setMsg('Take a slow, deep breath in...');speak('Take a slow, deep breath in...');setBState('approaching');const t=setTimeout(()=>{setBState('landing');setBreathPhase('exhale');setInhaleAnim(false);setMsg('Now... slowly breathe out.\nShoo the butterfly away.\nKeep those petals still.');speak('Now slowly breathe out to shoo the butterfly away. Keep those petals perfectly still.');},4200);return()=>clearTimeout(t);},[phase,breathPhase,round]);
  const selectPad=pad=>{setSelPad(pad);setMsg('Perfect. Your lily pad is ready.');speak('Perfect choice. A butterfly has spotted your flower and is on its way.');setBState('far');setTimeout(()=>{setPhase('breathing');setBreathPhase('inhale');},1800);};
  const startHold=()=>{if(breathPhase!=='exhale'||isHolding)return;startRef.current=Date.now();setIsHolding(true);holdRef.current=setInterval(()=>{const el=(Date.now()-startRef.current)/1000;setHoldProg(Math.min(el/5,1));if(el>=5){clearInterval(holdRef.current);finishEx(el);}},60);};
  const endHold=()=>{if(!isHolding)return;clearInterval(holdRef.current);const d=(Date.now()-startRef.current)/1000;finishEx(d);};
  const finishEx=d=>{setIsHolding(false);setHoldProg(0);if(d>=4){setPetalState('still');setBState('departing');setMsg('✦ The butterfly lifts away...\nYou did it. The pond is still.');speak('Beautiful. The butterfly gently lifted away. The pond is still. You are still.');setTimeout(()=>{if(round>=totalRounds){setPhase('complete');}else{setRound(r=>r+1);setBreathPhase('inhale');setBState('far');setMsg('');}},3000);}else if(d>=2){setPetalState('slight');setMsg('Almost... breathe a little slower.\nThe butterfly is coming back.');speak('Almost there. Try breathing out just a little slower.');setTimeout(()=>{setPetalState('still');setBState('approaching');setMsg('Try again...');},2400);}else{setPetalState('wild');setBState('startled');setMsg("The petals moved. That's okay.\nLet's breathe in again.");speak("The petals moved a little. That is okay. Breathe in again slowly.");setTimeout(()=>{setPetalState('still');setBreathPhase('inhale');setBState('far');},2400);}};
  const reset=()=>{setPhase('intro');setSelPad(null);setBreathPhase('inhale');setRound(1);setPetalState('still');setBState('hidden');setIsHolding(false);setHoldProg(0);setMsg('');setInhaleAnim(false);};
  if(phase==='intro')return(<div style={{maxWidth:'620px',margin:'0 auto',padding:'32px 20px',animation:'fade-slide 0.45s ease both'}}><div style={{textAlign:'center',marginBottom:'28px'}}><div style={{fontSize:'52px',marginBottom:'12px'}}>🪷</div><h2 style={{fontFamily:"'Cormorant Garamond',serif",...shimTx,fontSize:'30px',fontWeight:'300',marginBottom:'8px'}}>Where's Your Lily Pad?</h2><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:C.textMuted,lineHeight:'1.8',maxWidth:'420px',margin:'0 auto'}}>When the world feels like too much, this pond is waiting. Find your lily pad. Find your breath.</p></div><div style={{...gc(C.teal),marginBottom:'18px'}}><div style={lblS(C.teal)}>How intense is the feeling right now?</div><div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>{Object.entries(INTENSITY).map(([k,v])=>(<div key={k} onClick={()=>setIntensity(k)} style={{...pillS(intensity===k,C.teal),margin:0,display:'flex',flexDirection:'column',padding:'10px 16px'}}><span>{v.label}</span><span style={{fontSize:'10px',opacity:0.6,marginTop:'2px'}}>{v.desc}</span></div>))}</div></div><div style={{...gc(),marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}><div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'16px',color:C.text,marginBottom:'3px'}}>Audio Narration</div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint}}>A calm voice guides you through the pond</div></div><div onClick={()=>setAudioOn(!audioOn)} style={{...pillS(audioOn,C.gold),margin:0}}>{audioOn?'🔊 On':'🔇 Off'}</div></div><div style={{textAlign:'center'}}><button style={{...btnS(C.teal),padding:'14px 40px',fontSize:'14px'}} onClick={()=>setPhase('selecting')}>Enter the Pond ✦</button></div></div>);
  if(phase==='complete')return(<div style={{maxWidth:'500px',margin:'0 auto',padding:'60px 20px',textAlign:'center',animation:'fade-slide 0.5s ease both'}}><div style={{fontSize:'56px',marginBottom:'16px'}}>🌸</div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:'300',color:C.gold,marginBottom:'12px'}}>You found your stillness.</h2><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'14px',color:C.textMuted,lineHeight:'1.9',maxWidth:'360px',margin:'0 auto 32px'}}>You completed {totalRounds} rounds. The pond is always here.</p><div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}><button style={btnS(C.teal)} onClick={reset}>Return to Pond ✦</button>{onClose&&<button style={{...btnS(C.textFaint),padding:'10px 20px'}} onClick={onClose}>Close</button>}</div></div>);
  return(<div style={{maxWidth:'720px',margin:'0 auto',padding:emergency?'16px':'24px 16px',animation:'fade-slide 0.45s ease both'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
      <div><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',...shimTx,margin:0}}>{phase==='selecting'?"Find Your Lily Pad":"Where's Your Lily Pad?"}</h3><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,margin:'3px 0 0'}}>{phase==='selecting'?'Not too close. Not too far. Find the one with a beautiful flower.':`Round ${round} of ${totalRounds}`}</p></div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>{phase==='breathing'&&<div style={{display:'flex',gap:'6px'}}>{Array.from({length:totalRounds},(_,i)=><div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:i<round-1?C.teal:i===round-1?`${C.teal}70`:`${C.teal}20`,transition:'background 0.5s'}}/>)}</div>}<div onClick={()=>setAudioOn(!audioOn)} style={{...pillS(audioOn,C.gold),padding:'5px 10px',fontSize:'11px',margin:0}}>{audioOn?'🔊':'🔇'}</div></div>
    </div>
    <div style={{position:'relative',height:'300px',borderRadius:'22px',overflow:'hidden',background:'radial-gradient(ellipse 92% 82% at 50% 58%,#0c2535,#071825 42%,#040e14)',border:'1px solid rgba(78,205,196,0.10)',marginBottom:'22px',boxShadow:'inset 0 0 70px rgba(0,0,0,0.55)'}}>
      {Array.from({length:7},(_,i)=><div key={i} style={{position:'absolute',left:`${6+i*13}%`,top:`${28+i*7}%`,width:`${62-i*6}%`,height:'1px',background:'rgba(255,255,255,0.055)',animation:`water-line ${2+i*0.4}s ease-in-out ${i*0.25}s infinite`}}/>)}
      <div style={{position:'absolute',top:'6%',left:'52%',width:'22px',height:'22px',borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#fffbe8,#e8d88a)',boxShadow:'0 0 18px rgba(232,216,138,0.4)',opacity:0.65}}/>
      {selPad&&<div style={{position:'absolute',left:selPad.cx,top:selPad.cy,width:'130px',height:'90px',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(100,210,70,0.14),transparent)',transform:'translate(-50%,-50%)',filter:'blur(10px)',pointerEvents:'none',transition:'left 0.5s,top 0.5s'}}/>}
      {PADS.map(pad=><LilyPadComp key={pad.id} pad={pad} selected={selPad?.id===pad.id} petalState={petalState} onClick={()=>selectPad(pad)} phase={phase}/>)}
      <ButterflyComp bx={bp.x} by={bp.y} state={bState}/>
      {phase==='selecting'&&<div style={{position:'absolute',bottom:'14px',left:'50%',transform:'translateX(-50%)',fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',whiteSpace:'nowrap',pointerEvents:'none'}}>tap a lily pad to choose yours</div>}
      {msg&&phase==='breathing'&&<div style={{position:'absolute',bottom:'14px',left:'50%',transform:'translateX(-50%)',fontFamily:"'Cormorant Garamond',serif",fontSize:'14px',fontStyle:'italic',color:'rgba(240,234,248,0.72)',textAlign:'center',pointerEvents:'none',maxWidth:'85%',lineHeight:'1.65',animation:'drift-in 0.5s ease both',whiteSpace:'pre-line'}}>{msg}</div>}
    </div>
    {phase==='breathing'&&(<div style={{textAlign:'center'}}>{breathPhase==='inhale'?(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'14px'}}><div style={{position:'relative',width:'90px',height:'90px',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${C.teal}35`,background:`${C.teal}08`,transform:inhaleAnim?'scale(1.55)':'scale(1)',opacity:inhaleAnim?0:0.5,transition:'transform 4.2s ease-in-out,opacity 4.2s ease-in-out'}}/><div style={{width:'64px',height:'64px',borderRadius:'50%',border:`2px solid ${C.teal}50`,background:`${C.teal}10`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',transform:inhaleAnim?'scale(1.28)':'scale(1)',transition:'transform 4.2s ease-in-out'}}>🫁</div></div><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted}}>Breathe in slowly... the butterfly is coming.</p></div>):(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}><div style={{position:'relative',width:'92px',height:'92px',display:'flex',alignItems:'center',justifyContent:'center'}}><ProgRing progress={holdProg} color={isHolding?C.teal:C.rose} size={92}/><button aria-label="Hold to exhale slowly" onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold} onTouchStart={e=>{e.preventDefault();startHold();}} onTouchEnd={e=>{e.preventDefault();endHold();}} style={{width:'72px',height:'72px',borderRadius:'50%',border:`2px solid ${isHolding?C.teal:C.rose}60`,background:isHolding?`${C.teal}20`:`${C.rose}12`,cursor:'pointer',fontSize:'22px',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s',backdropFilter:'blur(8px)',WebkitUserSelect:'none',userSelect:'none'}}>{isHolding?'💨':'🌬️'}</button></div><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,maxWidth:'260px',lineHeight:'1.65'}}>{isHolding?'Hold... keep those petals still...':'Press & hold while you exhale slowly'}</p>{isHolding&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.teal,letterSpacing:'1px'}}>{Math.round(holdProg*5*10)/10}s · keep going...</div>}{!isHolding&&holdProg===0&&<p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'13px',fontStyle:'italic',color:C.textFaint}}>Don't let the petals move.</p>}</div>)}</div>)}
  </div>);
};

/* ══ MAIN APP ══ */
export default function WellnessOasis(){
  const [page,setPage]=useState(PAGES.HOME);
  const [ready,setReady]=useState(false);
  const [emergencyOpen,setEmergencyOpen]=useState(false);
  const [userName,setUserName]=useState('');const [nameInput,setNameInput]=useState('');const [editingName,setEditingName]=useState(false);
  const [customAffirmations,setCustomAffirmations]=useState([]);
  const [customGroundingPrompts,setCustomGroundingPrompts]=useState([]);
  const [customFocuses,setCustomFocuses]=useState([]);
  const [mood,setMood]=useState('');const [aiResponse,setAiResponse]=useState('');const [aiLoading,setAiLoading]=useState(false);
  const [moodSel,setMoodSel]=useState('🌊 Calm');const [moodCard,setMoodCard]=useState(null);const [customMood,setCustomMood]=useState('');const [showCustomMood,setShowCustomMood]=useState(false);
  const [notes,setNotes]=useState([]);const [noteInput,setNoteInput]=useState('');
  const [tasks,setTasks]=useState([]);const [taskInput,setTaskInput]=useState('');const [taskPriority,setTaskPriority]=useState('Medium ⚡');
  const [affirmIdx,setAffirmIdx]=useState(0);
  const [groundingAnswers,setGroundingAnswers]=useState({});
  const [armorChecks,setArmorChecks]=useState({});
  const [savedEntries,setSavedEntries]=useState([]);const [savedMsg,setSavedMsg]=useState('');
  const [journal,setJournal]=useState({date:new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),focuses:[],gratitude:'',customGratitude:'',intention:'',customIntention:'',mantra:'',customMantra:'',tarot:'',customTarot:''});

  const setPageTop=p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'});};

  useEffect(()=>{(async()=>{
    const keys=['byb:userName','byb:customAffirmations','byb:customGroundingPrompts','byb:customFocuses','byb:savedEntries','byb:notes','byb:tasks'];
    const setters=[v=>{setUserName(v);setNameInput(v);},v=>setCustomAffirmations(JSON.parse(v)),v=>setCustomGroundingPrompts(JSON.parse(v)),v=>setCustomFocuses(JSON.parse(v)),v=>setSavedEntries(JSON.parse(v)),v=>setNotes(JSON.parse(v)),v=>setTasks(JSON.parse(v))];
    for(let i=0;i<keys.length;i++){try{const r=await window.storage.get(keys[i]);if(r?.value)setters[i](r.value);}catch{}}
    setReady(true);
  })();},[]);

  const persist=async(k,v)=>{try{await window.storage.set(k,typeof v==='string'?v:JSON.stringify(v));}catch{}};
  const saveName=async()=>{const n=nameInput.trim();setUserName(n);setEditingName(false);await persist('byb:userName',n);};
  const addCA=async v=>{const t=v.trim();if(!t||customAffirmations.includes(t))return;const u=[...customAffirmations,t];setCustomAffirmations(u);setAffirmIdx(DEFAULT_AFFIRMATIONS.length+u.length-1);await persist('byb:customAffirmations',u);};
  const remCA=async a=>{const u=customAffirmations.filter(x=>x!==a);setCustomAffirmations(u);await persist('byb:customAffirmations',u);};
  const addCP=async v=>{const t=v.trim();if(!t||customGroundingPrompts.includes(t))return;const u=[...customGroundingPrompts,t];setCustomGroundingPrompts(u);await persist('byb:customGroundingPrompts',u);};
  const remCP=async p=>{const u=customGroundingPrompts.filter(x=>x!==p);setCustomGroundingPrompts(u);await persist('byb:customGroundingPrompts',u);};
  const addCF=async v=>{const t=v.trim();if(!t||customFocuses.includes(t)||journal.focuses.length>=4)return;const u=[...customFocuses,t];setCustomFocuses(u);setJournal(j=>({...j,focuses:j.focuses.length<4?[...j.focuses,t]:j.focuses}));await persist('byb:customFocuses',u);};
  const remCF=async f=>{const u=customFocuses.filter(x=>x!==f);setCustomFocuses(u);setJournal(j=>({...j,focuses:j.focuses.filter(x=>x!==f)}));await persist('byb:customFocuses',u);};
  const toggleF=f=>{const c=journal.focuses;setJournal({...journal,focuses:c.includes(f)?c.filter(x=>x!==f):c.length<4?[...c,f]:c});};
  const saveEntry=async()=>{const updated=[{...journal,id:Date.now()},...savedEntries];setSavedEntries(updated);await persist('byb:savedEntries',updated);setJournal({date:new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),focuses:[],gratitude:'',customGratitude:'',intention:'',customIntention:'',mantra:'',customMantra:'',tarot:'',customTarot:''});setSavedMsg('Entry saved ✦');setTimeout(()=>setSavedMsg(''),3000);};
  const addNote=async v=>{const t=v.trim();if(!t)return;const num=String(notes.length+1).padStart(3,'0');const u=[{id:Date.now(),num,text:t},...notes];setNotes(u);setNoteInput('');await persist('byb:notes',u);};
  const delNote=async id=>{const u=notes.filter(n=>n.id!==id);setNotes(u);await persist('byb:notes',u);};
  const addTask=async()=>{const t=taskInput.trim();if(!t)return;const u=[{id:Date.now(),task:t,priority:taskPriority,done:false},...tasks];setTasks(u);setTaskInput('');await persist('byb:tasks',u);};
  const toggleTask=async id=>{const u=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);setTasks(u);await persist('byb:tasks',u);};
  const delTask=async id=>{const u=tasks.filter(t=>t.id!==id);setTasks(u);await persist('byb:tasks',u);};

  // ── AFFIRMATIONS LIBRARY ───────────────────────────────────────────────────
// 55+ entries across 9 thematic categories. Inclusive baseline — not a feature.
const DEFAULT_AFFIRMATIONS = [
  // ── ORIGINAL THREE (preserved exactly) ────────────────────────────────────
  "I am the peace the world needs to feel.",
  "My progress shines even in silence.",
  "I set boundaries with love and strength.",

  // ── SELF-WORTH & PRESENCE ─────────────────────────────────────────────────
  "I am worthy of love exactly as I am — no editing required.",
  "I belong here. My presence is not an accident.",
  "I am allowed to take up space — in rooms, in relationships, in my own life.",
  "The version of me that shows up today is enough.",
  "I do not have to earn rest. I do not have to earn care.",
  "I release the need to shrink so others feel comfortable.",

  // ── AUTHENTICITY & IDENTITY ────────────────────────────────────────────────
  "Living as myself is the greatest act of courage I know.",
  "My story is mine to tell — in my own time, on my own terms.",
  "I do not need anyone's permission to be exactly who I am.",
  "My identity is not a phase. It is a truth I get to live and celebrate.",
  "I release the shame that was never mine to carry.",
  "Every step I take toward authenticity makes the world safer for someone else.",
  "I am allowed to change my mind, my look, my life, my heart.",

  // ── CHOSEN FAMILY & COMMUNITY ─────────────────────────────────────────────
  "My chosen family is real, valid, and full of love.",
  "I build community that sees and celebrates all of who I am.",
  "I am loved by people who truly know me.",
  "Connection with those who honor me is my birthright.",
  "I invest my energy in people who do not ask me to be less.",

  // ── BODY & SELF-ACCEPTANCE ────────────────────────────────────────────────
  "My body has carried me through everything. I honor it.",
  "I am learning, gently, to feel at home in my own skin.",
  "I do not have to love every part of myself today — but I choose to respect it.",
  "My body is not a problem to solve. It is a home to tend.",

  // ── RESILIENCE & HEALING ──────────────────────────────────────────────────
  "I have survived every hard day so far. That is not luck — that is strength.",
  "My healing is not linear, and that is completely okay.",
  "Softness is not weakness. It is how I heal and help others heal.",
  "I am not behind. I am on the path that belongs to me.",
  "I give myself permission to outgrow what no longer fits.",
  "Don't carry your mistakes around with you. Place them under your feet and use them as stepping stones to rise above them.",
  "Successful people are not those who do not fail — they are those who fail more than anyone and simply refuse to accept it as the conclusion.",
  "It's only after you've stepped outside your comfort zone that you begin to change, grow, and transform.",
  "Difficult doesn't mean impossible. It only means that you have to work hard.",

  // ── LOVE & RELATIONSHIP (non-prescriptive) ────────────────────────────────
  "Love, in all its forms, is worthy of celebration.",
  "I deserve a love that sees and honors my whole self.",
  "The love I give myself teaches others how to love me.",
  "I attract people who honor exactly who I am — all of who I am.",
  "The people I need in my life are the ones who need me in theirs — even when I have nothing to offer them but myself.",

  // ── GROWTH & COURAGE ──────────────────────────────────────────────────────
  "If you are going to doubt something — doubt your limits.",
  "Every day may not be good, but there is something good in every day.",
  "To find peace, you have to be willing to lose your connection with the people, places, and things that create all the noise in your life.",
  "The art of communication is the language of leadership.",
  "It is those who have done nothing that say nothing can be done.",

  // ── SELF-WORTH: MIND & BRILLIANCE ─────────────────────────────────────────
  "Brilliance is sexy. Intelligence is sexy. Maturity is sexy. A mind that makes you think is the most attractive thing in any room.",

  // ── BOSSLADYLISA ORIGINALS ────────────────────────────────────────────────
  "Nothing great was ever achieved without enthusiasm.",
  "Be a full bloomed sunflower so that even in the darkest days, you are able to stand tall and find the sunlight.",

  // ── BECOMING & TRUST ──────────────────────────────────────────────────────
  "You are becoming exactly who you're meant to be.",

  // ── CLARITY & BOUNDARIES ──────────────────────────────────────────────────
  "I reacted after my boundaries were crossed. That is not the same as overreacting.",
  "You can't make a person love you by loving them harder.",
  "People who talk about you when they can't control you are showing you exactly who they are.",
  "Don't let anybody make you feel crazy because you figured them out.",

  // ── RESILIENCE THROUGH DARKNESS ───────────────────────────────────────────
  "Perhaps the butterfly is proof that you can go through a great deal of darkness and still become something beautiful.",

  // ── RELATIONSHIPS (inclusive, non-prescriptive) ───────────────────────────
  "For a relationship to truly work, you have to understand that you and your partner are two different people with different pasts trying to build one future. Communicate without every conversation becoming an argument. Listen even when you're frustrated. Move forward without keeping score.",

  // ── RESILIENCE (Elizabeth Gilbert — rewritten for full inclusivity) ────────
  "The people I love and admire for their strength and grace did not get that way because things worked out. They got that way because things went wrong, and they handled it — in a thousand different ways on a thousand different days. Those people are my superheroes.",

  // ── SELF-WORTH (long-form — displayed as Visual Quote Card) ─────────
  "Your happiness, success, and growth is an inside job. Don't be affected by what others say. Only you know you and your life. You are magnificent — living life one day at a time, one step at a time.",
];

// ── VISUAL QUOTE CARD CANDIDATES ───────────────────────────────────────────
// Layered quotes best displayed in full-card format rather than rotating strip
const QUOTE_CARD_CANDIDATES = [
  {
    text: "Your happiness, success, and growth is an inside job. Don't be affected by what others say. Only you know you and your life. You are magnificent — living life one day at a time, one step at a time.",
    source: null,
    color: C.gold,
  },
  {
    text: "For a relationship to truly work, you have to understand that you and your partner are two different people with different pasts trying to build one future. Communicate without every conversation becoming an argument. Listen even when you're frustrated. Move forward without keeping score.",
    source: null,
    color: C.peach,
  },
  {
    text: "The people I love and admire for their strength and grace did not get that way because things worked out. They got that way because things went wrong, and they handled it — in a thousand different ways on a thousand different days. Those people are my superheroes.",
    source: "Adapted from Elizabeth Gilbert",
    color: C.plum,
  },
  {
    text: "I honor those who climbed down into my darkness — not to rescue me, but to remind me I wasn't alone. I carry their light with me, and I offer it forward.",
    source: null,
    color: C.teal,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// END CONTENT PATCH — App logic continues below
// ═══════════════════════════════════════════════════════════════════════════
  const allAff=[...DEFAULT_AFFIRMATIONS,...customAffirmations];
  const baseGP=["Did I give myself permission to pause today?","What part of me felt scattered or overwhelmed?","What one thing did I say no to without guilt?","Where did I feel the most like myself today?","What emotional piece am I ready to reclaim tonight?"];
  const allGP=[...baseGP,...customGroundingPrompts];
  const baseFoc=['School','Business','Gratitude','Self-Care','Parenting','Relationship','Recovery','Emotional Work'];
  const safeIdx=affirmIdx%allAff.length;
  const armorItems=["My boundaries are intact today","I have not shrunk myself for anyone","I am not carrying anyone else's chaos","I honored at least one need of my own","I spoke truth, even when it was uncomfortable"];
  const armorCount=Object.values(armorChecks).filter(Boolean).length;

  const handleAIReset=async()=>{if(!mood.trim())return;setAiLoading(true);setAiResponse('');try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are the living soul of Beautify Yourself & Beyond℠. Speak with warmth and truth to ${userName||'the person using this app'}. Real recognition, no toxic positivity. Respond: 1. A 2-sentence acknowledgment. 2. One reset ritual under 5 minutes. 3. One personalized affirmation. 4. One grounding question. Under 180 words. Flowing prose.`,messages:[{role:"user",content:`Right now I'm feeling: ${mood}`}]})});const d=await r.json();setAiResponse(d.content?.find(b=>b.type==='text')?.text||"Your feelings are valid. Breathe in for 4, hold for 4, release for 6. You are held.");}catch{setAiResponse("Something moved through the wire and got lost. But this is still true: you showed up. Breathe slowly.");}setAiLoading(false);};

  if(!ready)return(<div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}><GlobalStyles/><div style={{width:'28px',height:'28px',border:`2px solid ${C.gold}33`,borderTop:`2px solid ${C.gold}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'16px',color:C.textFaint,fontStyle:'italic'}}>Preparing your sanctuary...</p></div>);

  /* ══ HOME ══ */
  const Home=()=>(<div style={{animation:'fade-slide 0.45s ease both'}}>
    <div style={{textAlign:'center',padding:'64px 24px 52px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'10%',left:'10%',width:'320px',height:'320px',background:'radial-gradient(circle,rgba(160,110,220,0.12),transparent 70%)',borderRadius:'50%',pointerEvents:'none',filter:'blur(20px)'}}/><div style={{position:'absolute',top:'20%',right:'8%',width:'260px',height:'260px',background:'radial-gradient(circle,rgba(78,205,196,0.10),transparent 70%)',borderRadius:'50%',pointerEvents:'none',filter:'blur(20px)'}}/>
      <div style={{position:'absolute',top:28,left:'9%',animation:'float 6s ease-in-out infinite'}}><Dragonfly size={38} color={C.teal} opacity={0.22}/></div>
      <div style={{position:'absolute',top:52,right:'11%',animation:'float 7s ease-in-out infinite 1s'}}><Dragonfly size={28} color={C.plum} opacity={0.18}/></div>
      <div style={{fontSize:'10px',color:C.teal,letterSpacing:'4px',textTransform:'uppercase',marginBottom:'18px',fontFamily:"'Nunito',sans-serif",fontWeight:'500'}}>✦ Welcome to Your Sanctuary ✦</div>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(36px,8vw,68px)',fontWeight:'300',lineHeight:'1.12',marginBottom:'10px',...shimTx}}>Beautify Yourself<br/>&amp; Beyond℠</h1>
      <p style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',letterSpacing:'4px',textTransform:'uppercase',color:C.textFaint,marginBottom:'36px'}}>BossLadyLisa's Wellness Oasis</p>
      <div style={{marginBottom:'28px'}}>{!editingName&&userName?(<div style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'10px 20px',background:`${C.plum}12`,border:`1px solid ${C.plum}28`,borderRadius:'28px'}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'17px',fontStyle:'italic',color:C.text}}>Welcome back, <span style={{color:C.gold}}>{userName}</span> ✦</span><span onClick={()=>setEditingName(true)} style={{fontSize:'11px',color:C.textFaint,cursor:'pointer'}}>edit</span></div>):(<div style={{display:'inline-flex',alignItems:'center',gap:'8px',flexWrap:'wrap',justifyContent:'center'}}><input style={{...inpS,width:'200px',borderRadius:'28px',textAlign:'center',fontSize:'14px',padding:'10px 18px'}} placeholder={userName||"What's your name?"} value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveName();}}/><button style={btnS(C.gold)} onClick={saveName}>Enter ✦</button>{userName&&<button style={{...btnS(C.textFaint),padding:'10px 16px'}} onClick={()=>{setNameInput(userName);setEditingName(false);}}>Cancel</button>}</div>)}</div>
      <div style={{...gc(C.plum),display:'inline-block',maxWidth:'420px',padding:'22px 32px',animation:'pulse-glow 5s ease-in-out infinite'}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'18px',fontStyle:'italic',lineHeight:'1.65',color:C.text,margin:0}}>"I do not have to perform stability<br/>to be worthy of love."</p></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(255px,1fr))',gap:'16px',padding:'0 24px 72px',maxWidth:'1000px',margin:'0 auto'}}>
      {[{key:PAGES.LOUNGE,icon:'🧩',title:'Self-Care Lounge',desc:'Mood reset · Affirmation decks · AI Reset Toolkit · Grounding tracker',accent:C.rose},{key:PAGES.REFLECTIONS,icon:'💬',title:'Reflections Studio',desc:'Sacred daily journal · Gratitude · Tarot · Soul mantra',accent:C.teal},{key:PAGES.PHOENIX,icon:'🔥',title:'Phoenix Room',desc:'Rise rituals · Emotional armor check',accent:'#ff8c69'},{key:PAGES.GARDEN,icon:'🌿',title:'Visual Garden',desc:'Manifestation quotes · Dragonfly wisdom',accent:C.plum},{key:PAGES.LILYPAD,icon:'🪷',title:"Where's Your Lily Pad?",desc:'Visual breathing practice · Guided · Emergency access',accent:C.teal},{key:PAGES.NOTES,icon:'🧠',title:'143 Life Notes',desc:'Personal nuggets of wisdom gathered along your journey',accent:C.gold},{key:PAGES.PLANNER,icon:'📋',title:'Boss Mode Planner',desc:'Organize intentions and conquer goals with grace',accent:C.peach},{key:PAGES.COMMUNITY,icon:'🕊️',title:'Community Garden',desc:'A living garden of shared light — walk in and receive',accent:'#90d48a'},{key:PAGES.PREMIUM,icon:'💎',title:'Premium Portal',desc:'Retreat Reset · Audio guides · Workshops',accent:C.gold}].map(hub=>(<div key={hub.key} style={gc(hub.accent,{cursor:'pointer'})} onClick={()=>setPageTop(hub.key)} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${hub.accent}44`;e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=`0 16px 48px ${hub.accent}18`;}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${C.glassBorder}`;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}><div style={{position:'absolute',top:-10,right:-6,fontSize:'80px',opacity:0.04,pointerEvents:'none'}}>{hub.icon}</div><div style={{fontSize:'28px',marginBottom:'12px'}}>{hub.icon}</div><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',fontWeight:'500',color:hub.accent,marginBottom:'8px'}}>{hub.title}</h3><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,lineHeight:'1.75',margin:0}}>{hub.desc}</p><div style={{position:'absolute',bottom:16,right:18,fontSize:'16px',color:`${hub.accent}30`}}>→</div></div>))}
    </div>
  </div>);

  /* ══ LOUNGE ══ */
  const Lounge=()=>(<Page>
    <STitle>🧩 Self-Care Lounge</STitle><SSub>Your calming digital tea room. Come as you are{userName?`, ${userName}`:''}.  </SSub>
    {/* Mood Reset */}
    <div style={{...gc(C.plum),marginBottom:'22px'}}>
      <div style={lblS(C.plum)}>🌿 Feel It to Release It — Mood Reset Card</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'7px',marginBottom:'14px'}}>
        {MOODS.map(m=>{const label=m.emoji+" "+m.mood;return <button key={m.key} onClick={()=>{setMoodSel(label);setShowCustomMood(false);setCustomMood('');}} style={{padding:'7px 14px',fontSize:'12px',borderRadius:'50px',cursor:'pointer',fontFamily:"'Nunito',sans-serif",background:moodSel===label&&!showCustomMood?`${getMoodDisplayColor(m.color)}28`:'transparent',color:moodSel===label&&!showCustomMood?getMoodDisplayColor(m.color):C.textMuted,border:`1px solid ${moodSel===label&&!showCustomMood?getMoodDisplayColor(m.color):C.glassBorder}`,transition:'all 0.2s'}}>{label}</button>})}
        {/* Custom mood toggle */}
        <button onClick={()=>{setShowCustomMood(!showCustomMood);setMoodSel('');}} style={{padding:'7px 14px',fontSize:'12px',borderRadius:'50px',cursor:'pointer',fontFamily:"'Nunito',sans-serif",background:showCustomMood?`${C.gold}28`:'transparent',color:showCustomMood?C.gold:C.textMuted,border:`1px solid ${showCustomMood?C.gold:C.glassBorder}`,borderStyle:'dashed',transition:'all 0.2s'}}>✏️ My own...</button>
      </div>
      {/* Custom mood input */}
      {showCustomMood&&(
        <div style={{marginBottom:'14px',animation:'fade-slide 0.3s ease both'}}>
          <input
            autoFocus
            style={{...inpS,borderRadius:'20px',padding:'10px 18px',border:`1px solid ${C.gold}55`,fontSize:'13px',marginBottom:'8px'}}
            placeholder="Describe how you're feeling in your own words..."
            value={customMood}
            onChange={e=>setCustomMood(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&customMood.trim())setMoodCard({quote:"Your feelings are valid — every single one of them.",tip:"Whatever you just named? That took courage. Sit with it. You are not broken — you are processing.",color:C.gold,custom:true,label:customMood.trim()});}}
          />
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,fontStyle:'italic'}}>Press Enter or tap Generate to receive your card.</div>
        </div>
      )}
      <button style={btnS(C.plum)} onClick={()=>{
        if(showCustomMood&&customMood.trim()){
          setMoodCard({quote:"Your feelings are valid — every single one of them.",body:"Whatever you just named? That took courage. Sit with it. You are not broken — you are processing.",color:C.gold,custom:true,label:customMood.trim()});
        } else if(moodSel&&MOOD_DATA[moodSel]){
          setMoodCard(MOOD_DATA[moodSel]);
        }
      }}>Generate Reset Card ✦</button>
      {moodCard&&(
        <div style={{marginTop:'20px',padding:'26px 24px',background:`${moodCard.color}0a`,border:`1px solid ${moodCard.color}30`,borderRadius:'16px',textAlign:'center',animation:'fade-slide 0.4s ease both'}}>
          {moodCard.custom&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:C.gold,letterSpacing:'2px',textTransform:'uppercase',marginBottom:'10px'}}>Feeling: {moodCard.label}</div>}
          {moodCard.tag&&!moodCard.custom&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:moodCard.color,letterSpacing:'2px',textTransform:'uppercase',marginBottom:'10px'}}>{moodCard.tag}</div>}
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(16px,3vw,22px)',fontStyle:'italic',color:moodCard.color,lineHeight:'1.6',marginBottom:'12px'}}>"{moodCard.quote}"</p>
          <p style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:C.textMuted,lineHeight:'1.7',marginBottom:'12px'}}>{moodCard.body || moodCard.tip}</p>
          <span style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:moodCard.color,background:`${moodCard.color}15`,border:`1px solid ${moodCard.color}30`,borderRadius:'50px',padding:'3px 12px',letterSpacing:'1px'}}>{moodCard.tag || 'DBT-Inspired Reset'}</span>
        </div>
      )}
    </div>
    {/* Affirmation */}
    <div style={{...gc(C.rose),textAlign:'center',marginBottom:'22px',animation:'pulse-glow 5s ease-in-out infinite'}}>
      <div style={lblS(C.rose)}>✦ Today's Affirmation</div>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(18px,3.5vw,24px)',fontStyle:'italic',lineHeight:'1.6',color:C.text,marginBottom:'22px',minHeight:'58px'}}>"{allAff[safeIdx]}"</p>
      {safeIdx>=DEFAULT_AFFIRMATIONS.length&&<div style={{marginBottom:'14px'}}><span style={{fontSize:'10px',color:C.gold,background:`${C.gold}15`,border:`1px solid ${C.gold}30`,borderRadius:'12px',padding:'3px 10px',fontFamily:"'Nunito',sans-serif"}}>✦ Your affirmation</span></div>}
      <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}><button style={btnS(C.rose)} onClick={()=>setAffirmIdx((safeIdx+allAff.length-1)%allAff.length)}>← Prev</button><button style={btnS(C.teal)} onClick={()=>setAffirmIdx((safeIdx+1)%allAff.length)}>Next Card ✦</button></div>
      <div style={{marginTop:'14px',fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint}}>{safeIdx+1} of {allAff.length}</div>
      <div style={{marginTop:'16px',textAlign:'left'}}><SharePrompt text={allAff[safeIdx]} type="affirmation" userName={userName}/></div>
      {customAffirmations.length>0&&<div style={{marginTop:'20px',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px',textAlign:'left'}}><div style={{...lblS(C.gold),marginBottom:'8px'}}>Your Added Affirmations</div>{customAffirmations.map((a,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><span style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,fontStyle:'italic',flex:1}}>"{a}"</span><span onClick={()=>remCA(a)} style={{fontSize:'11px',color:C.rose,cursor:'pointer',marginLeft:'12px'}}>remove</span></div>))}</div>}
      <div style={{marginTop:'16px',textAlign:'left'}}><AddItemRow placeholder="Write your own affirmation..." onAdd={addCA} accent={C.gold}/></div>
    </div>
    {/* AI Reset */}
    <div style={{...gc(C.rose),marginBottom:'22px'}}>
      <div style={lblS(C.rose)}>✦ AI Reset Toolkit</div>
      <div style={{padding:'10px 14px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.18)',borderRadius:'10px',marginBottom:'16px',display:'flex',gap:'10px',alignItems:'flex-start'}}><span style={{fontSize:'14px',flexShrink:0}}>🌿</span><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:'rgba(201,168,76,0.75)',lineHeight:'1.65',margin:0}}>This tool offers peer-level support, not professional care. If you are in crisis, call or text <strong style={{color:C.gold}}>988</strong> or text <strong style={{color:C.gold}}>HOME to 741741</strong>. You are not alone.</p></div>
      <p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,marginBottom:'16px',fontStyle:'italic'}}>Tell me how you're really feeling. Don't filter it.</p>
      <textarea style={{...inpS,minHeight:'110px',marginBottom:'16px',lineHeight:'1.65'}} placeholder="Type how you're really feeling..." value={mood} onChange={e=>setMood(e.target.value)}/>
      <button style={btnS(C.rose)} onClick={handleAIReset} disabled={aiLoading}>{aiLoading?'✦ Connecting...':'Get My Reset ✦'}</button>
      {aiResponse&&<div style={{marginTop:'22px',padding:'20px 24px',background:'rgba(255,255,255,0.025)',borderRadius:'14px',borderLeft:`3px solid ${C.rose}`}}><div style={lblS(C.rose)}>Your Reset</div><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'14px',lineHeight:'1.9',color:C.text,margin:0}}>{aiResponse}</p></div>}
    </div>
    {/* Grounding */}
    <div style={gc(C.teal)}>
      <div style={lblS(C.teal)}>Grounding Tracker — End of Day</div>
      {allGP.map((prompt,i)=>(<div key={i} style={{marginBottom:'20px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:C.textMuted,marginBottom:'8px',flex:1}}>✍️ {prompt}</p>{i>=baseGP.length&&<span onClick={()=>remCP(prompt)} style={{fontSize:'10px',color:C.rose,cursor:'pointer',flexShrink:0,marginTop:'2px'}}>remove</span>}</div><textarea style={{...inpS,minHeight:'58px'}} placeholder="Sit with this..." value={groundingAnswers[i]||''} onChange={e=>setGroundingAnswers({...groundingAnswers,[i]:e.target.value})}/>{groundingAnswers[i]?.trim()&&<div style={{marginTop:'8px'}}><SharePrompt text={groundingAnswers[i]} type="grounding" userName={userName}/></div>}</div>))}
      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}><AddItemRow placeholder="Add your own check-in question..." onAdd={addCP} accent={C.teal}/></div>
    </div>
  </Page>);

  /* ══ REFLECTIONS ══ */
  const Reflections=()=>(<Page>
    <STitle>💬 Reflections Studio</STitle><SSub>Your sacred writing space. Fill what resonates. Leave what doesn't.</SSub>
    <div style={{...gc(),marginBottom:'20px'}}><div style={lblS(C.peach)}>📅 Date</div><input style={inpS} value={journal.date} onChange={e=>setJournal({...journal,date:e.target.value})}/></div>
    <div style={{...gc(C.teal),marginBottom:'20px'}}>
      <div style={lblS(C.teal)}>🌿 Daily Focus Areas — Select Up to 4</div>
      <div>{baseFoc.map(f=>{const a=journal.focuses.includes(f);return <span key={f} style={pillS(a,C.teal)} onClick={()=>toggleF(f)}>{a?'✓ ':''}{f}</span>;})}
      {customFocuses.map(f=>{const a=journal.focuses.includes(f);return(<span key={f} style={{...pillS(a,C.gold),position:'relative',paddingRight:'28px'}} onClick={()=>toggleF(f)}>{a?'✓ ':''}{f}<span onClick={e=>{e.stopPropagation();remCF(f);}} style={{position:'absolute',right:'9px',top:'50%',transform:'translateY(-50%)',fontSize:'10px',cursor:'pointer'}}>✕</span></span>);})}
      <AddItemRow placeholder="Your focus topic..." onAdd={addCF} accent={C.gold}/></div>
      {journal.focuses.length>=4&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,fontStyle:'italic',marginTop:'10px'}}>Max 4 focuses selected</div>}
    </div>
    {[{field:'gratitude',icon:'🌻',label:'Gratitude Entry',color:C.peach,opts:["I am proud of my progress","I'm grateful for clarity today","My support system is growing"],custom:'customGratitude'},{field:'intention',icon:'🎯',label:"Tomorrow's Intention",color:C.rose,opts:["Show up with grace","Stay grounded and focused","Embrace flow and not force"],custom:'customIntention'},{field:'mantra',icon:'🧘‍♀️',label:'Soul Mantra',color:C.plum,opts:["I am aligned with my highest self","My presence is powerful","I breathe in peace, I exhale fear"],custom:'customMantra'},{field:'tarot',icon:'🔮',label:'Tarot / Daily Pull',color:C.gold,opts:["The Empress – Abundance surrounds me","The Fool – Trust the journey","Strength – I have what it takes"],custom:'customTarot'}].map(({field,icon,label,color,opts,custom})=>(<div key={field} style={{...gc(color),marginBottom:'20px'}}><div style={lblS(color)}>{icon} {label}</div>{opts.map(g=>(<div key={g} onClick={()=>setJournal({...journal,[field]:g,[custom]:''})} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',cursor:'pointer'}}><div style={radioSt(journal[field]===g,color)}/><span style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:journal[field]===g?color:C.textMuted}}>{g}</span></div>))}<input style={{...inpS,marginTop:'8px'}} placeholder="✍️ Write your own..." value={journal[custom]} onChange={e=>setJournal({...journal,[custom]:e.target.value,[field]:e.target.value})}/></div>))}
    <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}><button style={btnS(C.teal)} onClick={saveEntry}>Save Entry ✦</button>{savedMsg&&<span style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.teal,fontStyle:'italic'}}>{savedMsg}</span>}</div>
    {(journal.mantra||journal.intention||journal.gratitude)&&<div style={{marginTop:'20px',padding:'16px 20px',background:`${C.plum}08`,border:`1px solid ${C.plum}18`,borderRadius:'14px'}}><div style={{...lblS(C.plum),marginBottom:'10px'}}>✦ Share something from today</div>{journal.mantra&&<div style={{marginBottom:'10px'}}><SharePrompt text={journal.mantra} type="mantra" userName={userName}/></div>}{journal.intention&&<div style={{marginBottom:'10px'}}><SharePrompt text={journal.intention} type="journal" userName={userName}/></div>}{journal.gratitude&&<div><SharePrompt text={journal.gratitude} type="journal" userName={userName}/></div>}</div>}
    {savedEntries.length>0&&<div style={{marginTop:'44px'}}><div style={lblS(C.textFaint)}>Past Entries — {savedEntries.length} saved</div>{savedEntries.map(e=>(<div key={e.id} style={{...gc(),marginBottom:'14px'}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'14px',color:C.gold,marginBottom:'10px'}}>{e.date}</div>{e.focuses.length>0&&<div style={{marginBottom:'8px'}}>{e.focuses.map(f=><span key={f} style={{...pillS(true,C.teal),fontSize:'10px',padding:'3px 10px',margin:'2px'}}>{f}</span>)}</div>}{e.gratitude&&<p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,margin:'3px 0'}}>🌻 {e.gratitude}</p>}{e.intention&&<p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,margin:'3px 0'}}>🎯 {e.intention}</p>}{e.mantra&&<p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,margin:'3px 0'}}>🧘‍♀️ {e.mantra}</p>}{e.tarot&&<p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,margin:'3px 0'}}>🔮 {e.tarot}</p>}</div>))}</div>}
  </Page>);

  /* ══ PHOENIX ══ */
  const Phoenix=()=>{
    const [ritualDone,setRitualDone]=useState({});const [expanded,setExpanded]=useState(null);
    const rituals=[{icon:'🌅',title:'Morning Anchor',desc:'Before your feet hit the floor, name 3 things already working in your favor. Speak them aloud.'},{icon:'🌬️',title:'Boundary Breath',desc:'Inhale: "I know what I deserve." Hold 4 counts. Exhale: "I release what no longer serves me." Repeat 3x.'},{icon:'🔥',title:'Phoenix Mantra',desc:'Say aloud: "I did not come this far to crumble quietly. I rise because it is my nature."'},{icon:'🧩',title:'Scatter Collect',desc:'Write every scattered thought for 5 minutes. Fold the paper. Set it aside. You have contained it.'},{icon:'💎',title:'Body Check-In',desc:'Where are you holding tension? Place your hand there. Breathe warmth into that exact place for 60 seconds.'}];
    const doneCount=Object.values(ritualDone).filter(Boolean).length;
    const riseMsg=RISE_MSGS[Math.floor(Math.random()*RISE_MSGS.length)];
    return(<Page>
      <STitle>🔥 Phoenix Room</STitle><SSub>For coming back from burnout. You've done it before. You'll do it again.</SSub>
      <div style={{marginBottom:'34px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
          <div style={lblS('#ff8c69')}>Rise Rituals</div>
          {doneCount>0&&<span style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:'#ff8c69',background:'rgba(255,140,105,0.12)',border:'1px solid rgba(255,140,105,0.25)',borderRadius:'50px',padding:'3px 12px'}}>{doneCount} of {rituals.length} complete</span>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {rituals.map((r,i)=>{const done=ritualDone[i];const open=expanded===i;return(
            <div key={i} style={{...gc('#ff8c69'),border:`1px solid ${done?'rgba(255,140,105,0.45)':open?'rgba(255,140,105,0.25)':C.glassBorder}`,background:done?'rgba(255,140,105,0.08)':C.glass,transition:'all 0.3s',cursor:'pointer'}} onClick={()=>setExpanded(open?null:i)}>
              <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
                <div onClick={e=>{e.stopPropagation();setRitualDone(p=>({...p,[i]:!p[i]}));}} style={{width:'28px',height:'28px',borderRadius:'50%',border:`2px solid ${done?'#ff8c69':'rgba(255,140,105,0.3)'}`,background:done?'#ff8c69':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.25s',cursor:'pointer'}}>{done&&<span style={{color:'#0f0820',fontSize:'13px',fontWeight:'900'}}>✓</span>}</div>
                <div style={{fontSize:'22px',flexShrink:0}}>{r.icon}</div>
                <div style={{flex:1}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'17px',color:done?'rgba(255,140,105,0.6)':'#ff8c69',textDecoration:done?'line-through':'none',transition:'all 0.25s'}}>{r.title}</div>{!open&&!done&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,marginTop:'2px'}}>Tap to expand</div>}{done&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:'rgba(255,140,105,0.5)',marginTop:'2px'}}>Complete ✦</div>}</div>
                <div style={{fontSize:'14px',color:'rgba(255,140,105,0.4)',transition:'transform 0.3s',transform:open?'rotate(180deg)':'rotate(0deg)',flexShrink:0}}>▾</div>
              </div>
              {open&&<div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1px solid rgba(255,140,105,0.12)',animation:'fade-slide 0.3s ease both'}}><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:C.textMuted,lineHeight:'1.8',margin:'0 0 14px 42px'}}>{r.desc}</p><div style={{marginLeft:'42px'}}><button onClick={e=>{e.stopPropagation();setRitualDone(p=>({...p,[i]:true}));setExpanded(null);}} style={{...btnS('#ff8c69'),padding:'8px 20px',fontSize:'12px'}}>Mark Complete ✦</button></div></div>}
            </div>
          );})}
        </div>
        {doneCount===rituals.length&&<div style={{marginTop:'18px',padding:'16px 20px',background:'rgba(255,140,105,0.08)',border:'1px solid rgba(255,140,105,0.25)',borderRadius:'14px',textAlign:'center',animation:'fade-slide 0.4s ease both'}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'17px',fontStyle:'italic',color:'#ff8c69',margin:0}}>{riseMsg}</p></div>}
      </div>
      <div style={gc(C.gold)}><div style={lblS(C.gold)}>Emotional Armor Check</div><p style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textFaint,marginBottom:'20px',fontStyle:'italic'}}>Check what's true today. No judgment — just honesty.</p>{armorItems.map((item,i)=>(<div key={i} onClick={()=>setArmorChecks({...armorChecks,[i]:!armorChecks[i]})} style={{display:'flex',alignItems:'center',gap:'13px',marginBottom:'14px',cursor:'pointer'}}><div style={checkSt(armorChecks[i],C.gold)}>{armorChecks[i]?'✓':''}</div><span style={{fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:armorChecks[i]?C.gold:C.textMuted,transition:'color 0.2s'}}>{item}</span></div>))}<div style={{marginTop:'22px',padding:'16px 20px',background:armorCount>=3?`${C.gold}0d`:'rgba(255,255,255,0.018)',border:`1px solid ${armorCount>=3?`${C.gold}28`:'rgba(255,255,255,0.05)'}`,borderRadius:'12px'}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'15px',fontStyle:'italic',color:armorCount>=3?C.gold:C.textFaint,margin:0}}>{["Start checking what you can. You may have more armor than you think.","One piece intact. That's enough to build from.","Two pieces holding. You're doing more than you know.","Three pieces strong. Your foundation is steady.","Four pieces intact. You are showing up.","Full armor today. ✦ You walked through this day fully as yourself."][armorCount]}</p></div></div>
    </Page>);
  };

  /* ══ VISUAL GARDEN ══ */
  const VisualGarden=()=>(<Page>
    <STitle>🌿 Visual Garden</STitle><SSub>Where seeds become visions. Where visions become truth.</SSub>
    {/* Visual Quote Cards — layered quotes from the inclusive library */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'16px',marginBottom:'40px'}}>
      {QUOTE_CARD_CANDIDATES.map((q,i)=>(<div key={i} style={{...gc(q.color),animation:'pulse-glow 5s ease-in-out infinite',animationDelay:`${i*0.8}s`}}><div style={{position:'absolute',top:-8,right:-4,fontSize:'80px',color:`${q.color}08`,lineHeight:1,pointerEvents:'none'}}>✦</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'15px',fontStyle:'italic',lineHeight:'1.8',color:C.text,marginBottom:'16px'}}>"{q.text}"</p><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:q.color,letterSpacing:'1.5px'}}>{q.source ? `— ${q.source}` : '— BY&B℠'}</div></div>))}
    </div>
    {/* Additional curated quotes from the expanded library */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'16px',marginBottom:'40px'}}>
      {[{text:"Even in pieces, I am whole.",src:"BY&B℠",color:C.rose},{text:"I do not have to perform stability to be worthy of love.",src:"Retreat Reset",color:C.teal},{text:"My progress shines even in silence.",src:"BossLadyLisa",color:C.plum},{text:"I reclaim my peace without permission.",src:"BY&B℠",color:C.peach},{text:"Transformation is not a destination. It is a practice.",src:"The Dragonfly Principle",color:C.gold},{text:"What they don't see is the quiet rebuilding that happens in the dark.",src:"What They Don't See",color:C.teal},{text:"I honor those who climbed down into my darkness — not to rescue me, but to remind me I wasn't alone. I carry their light with me, and I offer it forward.",src:"BY&B℠",color:C.plum},{text:"Perhaps the butterfly is proof that you can go through a great deal of darkness and still become something beautiful.",src:"BY&B℠",color:C.gold},{text:"Brilliance is sexy. Intelligence is sexy. Maturity is sexy. A mind that makes you think is the most attractive thing in any room.",src:"BY&B℠",color:C.rose}].map((q,i)=>(<div key={i} style={{...gc(q.color),animation:'pulse-glow 5s ease-in-out infinite',animationDelay:`${i*0.8}s`}}><div style={{position:'absolute',top:-8,right:-4,fontSize:'80px',color:`${q.color}08`,lineHeight:1,pointerEvents:'none'}}>✦</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'16px',fontStyle:'italic',lineHeight:'1.7',color:C.text,marginBottom:'16px'}}>"{q.text}"</p><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'10px',color:q.color,letterSpacing:'1.5px'}}>— {q.src}</div></div>))}
    </div>
    <div style={gc(C.plum)}><div style={lblS(C.plum)}>🪲 Dragonfly Wisdom — The Five Principles</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'14px'}}>{[{label:'Clarity',desc:'Seeing truth through still water'},{label:'Transformation',desc:'The art of becoming'},{label:'Emotional Movement',desc:'Feeling without being swept away'},{label:'Spiritual Rebirth',desc:'Rising as your truest self'},{label:'Freedom',desc:'Release from old wounds'}].map((d,i)=>(<div key={i} style={{textAlign:'center',padding:'20px 12px',background:'rgba(255,255,255,0.025)',borderRadius:'14px',backdropFilter:'blur(8px)'}}><Dragonfly size={30} color={C.plum} opacity={0.80}/><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'15px',color:C.plum,marginTop:'12px',marginBottom:'6px'}}>{d.label}</div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,lineHeight:'1.5'}}>{d.desc}</div></div>))}</div></div>
  </Page>);

  /* ══ 143 NOTES ══ */
  const Notes143=()=>(<Page>
    <STitle>🧠 143 Life Notes</STitle><SSub>Personal nuggets of wisdom gathered along your journey. Quick, true, yours.</SSub>
    <div style={{display:'flex',gap:'10px',marginBottom:'28px',alignItems:'center',flexWrap:'wrap'}}>
      <input style={{...inpS,flex:'1',minWidth:'200px'}} placeholder="e.g., I am enough. Small steps lead to big changes…" value={noteInput} onChange={e=>setNoteInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addNote(noteInput);}}/>
      <button style={btnS(C.gold)} onClick={()=>addNote(noteInput)}>+ Add</button>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      {notes.map(n=>(<div key={n.id} style={{...gc(),padding:'15px 18px',display:'flex',alignItems:'flex-start',gap:'14px'}}><span style={{fontFamily:"'Cormorant Garamond',serif",color:C.gold,fontSize:'12px',fontWeight:'600',whiteSpace:'nowrap',paddingTop:'3px'}}>#{n.num}</span><p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',color:C.text,fontSize:'16px',lineHeight:'1.6',flex:1,margin:0}}>"{n.text}"</p><span onClick={()=>delNote(n.id)} style={{fontSize:'18px',color:C.textFaint,cursor:'pointer',flexShrink:0}}>×</span></div>))}
      {notes.length===0&&<div style={{textAlign:'center',padding:'44px',color:C.textFaint}}><div style={{fontSize:'38px',marginBottom:'12px'}}>🧠</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'16px',fontStyle:'italic'}}>Your life notes are waiting to be written.</p></div>}
    </div>
  </Page>);

  /* ══ BOSS PLANNER ══ */
  const BossPlanner=()=>{
    const incomplete=tasks.filter(t=>!t.done);const complete=tasks.filter(t=>t.done);
    return(<Page>
      <STitle>📋 Boss Mode Planner</STitle><SSub>Organize your intentions and conquer your goals with grace and precision.</SSub>
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'28px'}}>
        <input style={{...inpS,flex:'1 1 200px'}} placeholder="e.g., Set financial boundaries, Meditate 10 min…" value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addTask();}}/>
        <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} style={{...inpS,width:'140px',padding:'12px 14px',borderRadius:'12px',resize:'none'}}>{PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}</select>
        <button style={btnS(C.gold)} onClick={addTask}>+ Add</button>
      </div>
      {incomplete.length>0&&<div style={{marginBottom:'28px'}}><div style={{...lblS(C.textFaint),marginBottom:'10px'}}>Active Tasks</div><div style={{display:'flex',flexDirection:'column',gap:'9px'}}>{[...incomplete].sort((a,b)=>PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority)).map(t=>(<div key={t.id} style={{...gc(),padding:'13px 16px',display:'flex',alignItems:'center',gap:'12px'}}><button onClick={()=>toggleTask(t.id)} style={{width:'22px',height:'22px',borderRadius:'50%',flexShrink:0,cursor:'pointer',border:`2px solid ${PRI_COLOR[t.priority]||C.gold}`,background:'transparent'}}/><span style={{flex:1,fontFamily:"'Nunito',sans-serif",fontSize:'14px',color:C.text}}>{t.task}</span><span style={{fontSize:'11px',color:PRI_COLOR[t.priority],background:`${PRI_COLOR[t.priority]}22`,borderRadius:'50px',padding:'2px 10px',whiteSpace:'nowrap',fontFamily:"'Nunito',sans-serif"}}>{t.priority}</span><span onClick={()=>delTask(t.id)} style={{fontSize:'18px',color:C.textFaint,cursor:'pointer',flexShrink:0}}>×</span></div>))}</div></div>}
      {complete.length>0&&<div><div style={{...lblS(C.textFaint),marginBottom:'10px'}}>Completed ✅ ({complete.length})</div><div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{complete.map(t=>(<div key={t.id} style={{...gc(),padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',opacity:0.5}}><span style={{fontSize:'14px'}}>✅</span><span style={{flex:1,fontFamily:"'Nunito',sans-serif",fontSize:'13px',color:C.textMuted,textDecoration:'line-through'}}>{t.task}</span><span onClick={()=>delTask(t.id)} style={{fontSize:'18px',color:C.textFaint,cursor:'pointer'}}>×</span></div>))}</div></div>}
      {tasks.length===0&&<div style={{textAlign:'center',padding:'44px',color:C.textFaint}}><div style={{fontSize:'38px',marginBottom:'12px'}}>📋</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'16px',fontStyle:'italic'}}>Your planner is clear. Add your first intention.</p></div>}
    </Page>);
  };

  /* ══ PREMIUM ══ */
  const Premium=()=>(<Page>
    <STitle>💎 Premium Portal</STitle><SSub>Invest in your healing. Every piece matters.</SSub>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(228px,1fr))',gap:'16px'}}>
      {[{tier:'🌱 Free',price:'$0',sub:'Always accessible',color:C.teal,features:['Self-Care Lounge','Lily Pad breathing tool','Community Garden','Daily journaling','AI Reset Toolkit','143 Notes & Planner'],cta:'Currently Active',disabled:true},{tier:'🔥 Premium',price:'$9.99',sub:'/month',color:C.rose,featured:true,features:['Full Phoenix Room','Reflections Studio','Retreat Reset series','Premium oracle spreads','Audio narration guides','Save & sync entries'],cta:'Choose Premium'},{tier:'✨ Annual',price:'$99',sub:'/year — save 17%',color:C.gold,features:['Everything in Premium','Bonus ritual pack PDF','Early access','1 live workshop/year','Piece by Piece Puzzle Series'],cta:'Choose Annual'}].map((t,i)=>(<div key={i} style={{...gc(t.color),border:t.featured?`1px solid ${t.color}40`:`1px solid ${C.glassBorder}`,paddingTop:t.featured?'32px':'24px'}}>{t.featured&&<div style={{position:'absolute',top:'-1px',left:'50%',transform:'translateX(-50%)',background:`linear-gradient(90deg,${C.rose},#e8a0aa)`,color:'#0f0820',fontSize:'9px',padding:'4px 14px',borderRadius:'0 0 8px 8px',letterSpacing:'1.5px',fontWeight:'700',fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap'}}>MOST POPULAR</div>}<div style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:t.color,marginBottom:'6px'}}>{t.tier}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:C.text,marginBottom:'2px'}}>{t.price}</div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.textFaint,marginBottom:'22px'}}>{t.sub}</div>{t.features.map((f,j)=>(<div key={j} style={{fontFamily:"'Nunito',sans-serif",fontSize:'12px',color:C.textMuted,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',gap:'8px'}}><span style={{color:t.color,flexShrink:0}}>✦</span>{f}</div>))}<button style={{...btnS(t.color),marginTop:'20px',width:'100%',opacity:t.disabled?0.45:1,cursor:t.disabled?'default':'pointer'}}>{t.cta}</button></div>))}
    </div>
  </Page>);

  const navItems=[{key:PAGES.HOME,label:'✦ Home'},{key:PAGES.LOUNGE,label:'🧩 Lounge'},{key:PAGES.REFLECTIONS,label:'💬 Reflections'},{key:PAGES.PHOENIX,label:'🔥 Phoenix'},{key:PAGES.GARDEN,label:'🌿 Garden'},{key:PAGES.LILYPAD,label:'🪷 Lily Pad'},{key:PAGES.NOTES,label:'🧠 Notes'},{key:PAGES.PLANNER,label:'📋 Planner'},{key:PAGES.COMMUNITY,label:'🕊️ Community'},{key:PAGES.PREMIUM,label:'💎 Premium'}];
  const pageMap={[PAGES.HOME]:<Home/>,[PAGES.LOUNGE]:<Lounge/>,[PAGES.REFLECTIONS]:<Reflections/>,[PAGES.PHOENIX]:<Phoenix/>,[PAGES.GARDEN]:<VisualGarden/>,[PAGES.LILYPAD]:<Page><STitle>🪷 Where's Your Lily Pad?</STitle><SSub>A breathing practice born from love. For the moments when the world feels too loud.</SSub><LilyPadExperience/></Page>,[PAGES.NOTES]:<Notes143/>,[PAGES.PLANNER]:<BossPlanner/>,[PAGES.COMMUNITY]:<CommunityGardenPage/>,[PAGES.PREMIUM]:<Premium/>};

  return(<><GlobalStyles/>
    <div style={{minHeight:'100vh',background:C.bg,color:C.text}}>
      <nav style={{display:'flex',alignItems:'center',gap:'5px',padding:'12px 16px',background:'rgba(10,5,22,0.80)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',flexWrap:'wrap',position:'sticky',top:0,zIndex:100}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'14px',fontStyle:'italic',letterSpacing:'1px',marginRight:'12px',...shimTx}}>BY&B℠</span>
        {navItems.map(n=><button key={n.key} aria-label={n.label} onClick={()=>setPageTop(n.key)} style={{padding:'6px 12px',borderRadius:'20px',border:`1px solid ${page===n.key?C.gold+'55':'rgba(255,255,255,0.07)'}`,background:page===n.key?`${C.gold}12`:'rgba(255,255,255,0.03)',color:page===n.key?C.gold:C.textMuted,cursor:'pointer',fontFamily:"'Nunito',sans-serif",fontSize:'10px',fontWeight:'500',backdropFilter:'blur(8px)',transition:'all 0.2s',whiteSpace:'nowrap'}}>{n.label}</button>)}
        {userName&&<span style={{marginLeft:'auto',fontFamily:"'Cormorant Garamond',serif",fontSize:'12px',fontStyle:'italic',color:C.textFaint}}>✦ {userName}</span>}
      </nav>
      {pageMap[page]}
      {/* Emergency Button */}
      <div onClick={()=>setEmergencyOpen(true)} role="button" aria-label="Open Lily Pad breathing exercise" style={{position:'fixed',bottom:'26px',right:'26px',zIndex:500,background:'rgba(78,205,196,0.12)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',border:'1px solid rgba(78,205,196,0.38)',borderRadius:'50px',padding:'10px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 28px rgba(78,205,196,0.22)',transition:'all 0.3s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(78,205,196,0.22)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(78,205,196,0.12)';}}>
        <span style={{fontSize:'20px'}}>🪷</span>
        <div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'11px',color:C.teal,fontWeight:'600',lineHeight:1.2}}>Lily Pad</div><div style={{fontFamily:"'Nunito',sans-serif",fontSize:'9px',color:'rgba(78,205,196,0.6)',letterSpacing:'0.5px'}}>quick access</div></div>
      </div>
      {/* Emergency Modal */}
      {emergencyOpen&&<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(4,2,12,0.94)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',display:'flex',flexDirection:'column',animation:'fade-slide 0.3s ease both',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,background:'rgba(4,2,12,0.9)',backdropFilter:'blur(12px)',zIndex:2}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'22px'}}>🪷</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'18px',...shimTx}}>Where's Your Lily Pad?</span></div>
          <button style={{...btnS(C.textFaint),padding:'8px 16px',fontSize:'12px'}} onClick={()=>setEmergencyOpen(false)}>✕ Close</button>
        </div>
        <div style={{flex:1}}><LilyPadExperience emergency onClose={()=>setEmergencyOpen(false)}/></div>
      </div>}
    </div>
  </>);
}