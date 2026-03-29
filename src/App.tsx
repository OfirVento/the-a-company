import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// MOCK DATA FOR THE DEMO
const ROOMS = [
  { id: 'boardroom', name: 'The War Room', goal: 'Strategy & Progress', x: 0, y: 0, w: '50%', h: '50%', color: '#8b5cf6' },
  { id: 'research', name: 'Research Lab', goal: 'Docs & Best Practices', x: '50%', y: 0, w: '50%', h: '50%', color: '#3b82f6' },
  { id: 'discovery', name: 'Discovery Zone', goal: 'Human Context (Slack/Heygen)', x: 0, y: '50%', w: '50%', h: '50%', color: '#ec4899' },
  { id: 'engineering', name: 'Logic & Engineering Floor', goal: 'AST Translation & Code Generaton', x: '50%', y: '50%', w: '50%', h: '50%', color: '#10b981' },
];

const INIT_AGENTS = [
  {
    id: 'ada', name: 'Ada', role: 'Architect (CEO)', room: 'boardroom',
    qx: '25%', qy: '25%', /* position inside the whole floor */
    scripts: [
      "Analyzing Salesforce Architecture...",
      "Mapping CPQ logic to Target RCA schema.",
      "> Waiting for context from Cyrus...",
      "Received workflow delta.",
      "Drafting Sprint 2 Milestone array."
    ],
    scriptIdx: 0,
    charIdx: 0,
  },
  {
    id: 'rosie', name: 'Rosie', role: 'Research Agent', room: 'research',
    qx: '75%', qy: '25%',
    scripts: [
      "Accessing legacy CPQ API references...",
      "Scraping standard RCA Product Models...",
      "Compiling difference matrix.",
      "> Extracted 420 deprecation warnings.",
      "Pushing dossier to Ada."
    ],
    scriptIdx: 0,
    charIdx: 0,
  },
  {
    id: 'cyrus', name: 'Cyrus', role: 'Context Gatherer', room: 'discovery',
    qx: '25%', qy: '75%',
    scripts: [
      "Opening Slack thread with Billing Dept...",
      "Pinging John (VP Sales).",
      "Ask: 'Is manual discount applied pre-tax?'",
      "> Waiting for user response...",
      "Received: YES. Updating knowledge graph."
    ],
    scriptIdx: 0,
    charIdx: 0,
  },
  {
    id: 'nexus', name: 'Nexus', role: 'Logic Agent', room: 'engineering',
    qx: '65%', qy: '65%',
    scripts: [
      "Fetching Price Rule #402...",
      "Generating Abstract Syntax Tree.",
      "Identifying boundary condition for discount.",
      "Translating formula to RCA Engine Script.",
      "Running local validation suite: PASS."
    ],
    scriptIdx: 0,
    charIdx: 0,
  },
  {
    id: 'spark', name: 'Spark', role: 'Integration Engineer', room: 'engineering',
    qx: '85%', qy: '85%',
    scripts: [
      "Consuming Nexus translation logic...",
      "Drafting Python ETL payload...",
      "Opening target RCA API connection.",
      "Injecting modified Quote Line data...",
      "> Commit pushed. Milestone updated."
    ],
    scriptIdx: 0,
    charIdx: 0,
  }
];

export default function App() {
  const [agents, setAgents] = useState(INIT_AGENTS);
  const [logs, setLogs] = useState<{ id: number, time: string, agent: string, msg: string }[]>([]);
  const [particles, setParticles] = useState<{ id: string, from: string, to: string, progress: number }[]>([]);
  const [command, setCommand] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Typewriter effect simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => {
        const fullStr = a.scripts[a.scriptIdx];
        if (a.charIdx < fullStr.length) {
          return { ...a, charIdx: a.charIdx + 1 };
        } else {
          // Finished line, maybe send a log or a particle randomly
          // Wait a bit, then move to next script
          return { ...a, charIdx: 0, scriptIdx: (a.scriptIdx + 1) % a.scripts.length };
        }
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Emitting global logs & particles when lines finish
  useEffect(() => {
    agents.forEach(a => {
      const fullStr = a.scripts[a.scriptIdx];
      if (a.charIdx === fullStr.length && fullStr.length > 5) {
        // Line finished typing!
        const time = new Date().toLocaleTimeString([], { hour12: false });
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), time, agent: a.name, msg: fullStr }].slice(-50));
        
        // Randomly shoot a particle to someone else if this was a long action
        if (Math.random() > 0.6) {
          const targets = INIT_AGENTS.filter(t => t.id !== a.id);
          const target = targets[Math.floor(Math.random() * targets.length)];
          const newParticle = { id: `p-${Date.now()}`, from: a.id, to: target.id, progress: 0 };
          setParticles(p => [...p, newParticle]);
        }
      }
    });
  }, [agents]);

  // Particle animation loop
  useEffect(() => {
    const pInt = setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, progress: p.progress + 0.05 })).filter(p => p.progress <= 1));
    }, 50);
    return () => clearInterval(pInt);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev, { id: Date.now(), time, agent: 'BOARD (YOU)', msg: command }]);
    setCommand("");
  };



  const calculateParticlePosition = (fromId: string, toId: string, progress: number) => {
    const from = INIT_AGENTS.find(a => a.id === fromId);
    const to = INIT_AGENTS.find(a => a.id === toId);
    if (!from || !to) return { display: 'none' };

    // Hacky parse of percentage strings
    const fx = parseFloat(from.qx); const fy = parseFloat(from.qy);
    const tx = parseFloat(to.qx); const ty = parseFloat(to.qy);
    
    const currX = fx + (tx - fx) * progress;
    const currY = fy + (ty - fy) * progress;
    
    return { left: `${currX}%`, top: `${currY}%` };
  };

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header className="top-bar">
        <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '1px' }}>
          <span style={{ color: '#38bdf8' }}>THE A COMPANY</span> / MIGRATION OS
        </h1>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
          <span>PROJECT: <strong>Salesforce CPQ &rarr; RCA</strong></span>
          <span style={{ color: '#34d399' }}>● 24/7 ACTIVE SIMULATION</span>
        </div>
      </header>

      {/* ISOMETRIC OFFICE SIMULATION */}
      <div className="main-stage">
        <div className="office-floor">
          
          {/* Render Physical Rooms */}
          {ROOMS.map(r => (
            <div key={r.id} className="room" style={{ left: r.x, top: r.y, width: r.w, height: r.h, position: 'absolute' }}>
              <div className="room-details">
                <div className="room-title">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, boxShadow: `0 0 10px ${r.color}` }}></div>
                  {r.name}
                </div>
                <div className="room-goal">{r.goal}</div>
              </div>
              <div className="room-status" style={{ color: r.color, borderColor: r.color }}>LIVE</div>
            </div>
          ))}

          {/* Render Characters inside the coordinate plane */}
          {agents.map(a => {
            const currentText = a.scripts[a.scriptIdx].substring(0, a.charIdx);
            const isTyping = a.charIdx < a.scripts[a.scriptIdx].length;

            return (
              <div key={a.id} className="agent-node" style={{ left: a.qx, top: a.qy }}>
                {/* Deep Script Cloud */}
                <div className="terminal-cloud">
                  <strong style={{ color: '#fff' }}>{'>'} </strong> 
                  {currentText}
                  {isTyping && <span style={{ animation: 'blink 1s infinite' }}>_</span>}
                </div>
                
                {/* Bot Character Model */}
                <div className="bot-body">
                  <div className="bot-eye"></div>
                  {/* Bouncing tiny hands */}
                  <div className={`bot-hand left ${!isTyping ? '' : 'typing'}`} style={{ animationPlayState: isTyping ? 'running' : 'paused' }}></div>
                  <div className={`bot-hand right ${!isTyping ? '' : 'typing'}`} style={{ animationPlayState: isTyping ? 'running' : 'paused' }}></div>
                </div>

                <div className="agent-name-plate">
                  <div className="agent-name">{a.name}</div>
                  <div className="agent-role">{a.role}</div>
                </div>
              </div>
            );
          })}

          {/* Render Communication Particles */}
          <div className="flow-canvas">
             {particles.map(p => (
               <div key={p.id} className="particle" style={calculateParticlePosition(p.from, p.to, p.progress)}></div>
             ))}
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROL PANEL */}
      <div className="bottom-panel">
        
        <div className="log-stream" ref={logRef}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Stream</div>
          {logs.map(l => (
            <div key={l.id} className="log-line">
              <span className="log-time">[{l.time}]</span>
              <span className="log-agent" style={{ color: l.agent === 'BOARD (YOU)' ? '#f59e0b' : '#38bdf8' }}>{l.agent}:</span>
              <span className="log-msg" style={{ color: l.agent === 'BOARD (YOU)' ? '#fff' : '#e2e8f0' }}>{l.msg}</span>
            </div>
          ))}
        </div>

        <div className="command-center">
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Direct Communication (Intercom)</div>
          <form onSubmit={handleCommand} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <textarea 
               value={command} 
               onChange={e => setCommand(e.target.value)}
               placeholder="Issue a command to the company or ask for a status update..."
               className="input-box"
               style={{ flex: 1, resize: 'none', marginBottom: '12px' }}
               onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleCommand(e); } }}
             />
             <button type="submit" style={{ padding: '12px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
               SEND DIRECTIVE
             </button>
          </form>
        </div>

      </div>
    </div>
  );
}
