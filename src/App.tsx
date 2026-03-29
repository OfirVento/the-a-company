import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// MOCK DATA FOR THE DEMO
const ROOMS = [
  { id: 'boardroom', name: 'The War Room', goal: 'Strategy & Progress', x: '5%', y: '5%', w: '43%', h: '43%', color: '#8b5cf6' },
  { id: 'research', name: 'Research Lab', goal: 'Docs & Best Practices', x: '52%', y: '5%', w: '43%', h: '43%', color: '#3b82f6' },
  { id: 'discovery', name: 'Discovery Zone', goal: 'Human Context (Slack/Heygen)', x: '5%', y: '52%', w: '43%', h: '43%', color: '#ec4899' },
  { id: 'engineering', name: 'Logic & Engineering Floor', goal: 'AST Translation & Code Generation', x: '52%', y: '52%', w: '43%', h: '43%', color: '#10b981' },
];

const INIT_AGENTS = [
  { id: 'ada', name: 'Ada', role: 'Architect (CEO)', room: 'boardroom', qx: '25%', qy: '25%', activeTask: "Mapping CPQ logic to Target RCA schema." },
  { id: 'rosie', name: 'Rosie', role: 'Research Agent', room: 'research', qx: '75%', qy: '25%', activeTask: "Scraping standard RCA Product Models." },
  { id: 'cyrus', name: 'Cyrus', role: 'Context Gatherer', room: 'discovery', qx: '25%', qy: '75%', activeTask: "Pinging VP Sales (Slack) for rules..." },
  { id: 'nexus', name: 'Nexus', role: 'Logic Agent', room: 'engineering', qx: '65%', qy: '65%', activeTask: "Fetching CPQ Price Rule #402..." },
  { id: 'spark', name: 'Spark', role: 'Integration Engineer', room: 'engineering', qx: '85%', qy: '85%', activeTask: "Writing Python ETL payload..." }
];

const SHORTER_MESSAGES = [
  "Identified complex nested bundle in CPQ quote Q-00192... decomposing.",
  "Mapping CPQ Product Option to RCA Product Relationship.",
  "Extracting Price Rules attached to the EMEA standard pricebook.",
  "Validating API rate limits on target Salesforce org...",
  "Translating 'Block Pricing' logic into RCA Attribute based pricing.",
  "Analyzing 45 discount schedules.",
  "Running ETL test batch for 500 Legacy Accounts.",
  "Checking dependent picklists on Quote Line object.",
  "Compiling CPQ trigger dependencies for deprecation.",
  "Diffing CPQ QLE and RCA Cart views."
];

const QUESTIONS = [
  { from: 'Ada', q: "Should we selectively migrate historical Quotes (older than 2 years) or only Active contracts to RCA?" },
  { from: 'Cyrus', q: "The Billing team explicitly told me manual discounts are pre-tax, but standard CPQ config says post-tax. Which is the single source of truth here?" },
  { from: 'Nexus', q: "Found a Custom Scripting plugin overriding standard CPQ quote calc. Should I attempt an AST translation to RCA script or flag it for manual rebuild?" },
  { from: 'Spark', q: "We are hitting an API limit on the target sandbox. Can you approve a $15 increase to my API credit budget to resume parallel batching?" },
  { from: 'Rosie', q: "The target RCA documentation mentions two distinct mapping paradigms for bundled products. Do you prefer 'Flat' or 'Hierarchical' representation?" }
];

export default function App() {
  const [agents, setAgents] = useState(INIT_AGENTS);
  const [logs, setLogs] = useState<{ id: number, time: string, agent: string, msg: string, isQuestion: boolean }[]>([]);
  const [particles, setParticles] = useState<{ id: string, from: string, to: string, progress: number }[]>([]);
  const [command, setCommand] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Deep Script simulation loop for Agent Plates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => {
        // Just cycle some task variations for flavor
        const baseTask = a.activeTask.split('...')[0];
        const dots = ['.', '..', '...'][Math.floor(Math.random() * 3)];
        return { ...a, activeTask: `${baseTask}${dots}` };
      }));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // EVERY 2 SECONDS - Share a message
  useEffect(() => {
    const int2s = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      const randomAgent = INIT_AGENTS[Math.floor(Math.random() * INIT_AGENTS.length)];
      const randomMsg = SHORTER_MESSAGES[Math.floor(Math.random() * SHORTER_MESSAGES.length)];
      
      setLogs(prev => [...prev, { id: Date.now(), time, agent: randomAgent.name, msg: randomMsg, isQuestion: false }].slice(-50));
      
      // Fire a particle
      const targets = INIT_AGENTS.filter(t => t.id !== randomAgent.id);
      const target = targets[Math.floor(Math.random() * targets.length)];
      setParticles(p => [...p, { id: `p-${Date.now()}`, from: randomAgent.id, to: target.id, progress: 0 }]);
      
    }, 2000);
    return () => clearInterval(int2s);
  }, []);

  // EVERY 10 SECONDS - Ask a critical Question
  useEffect(() => {
    const int10s = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      const randQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      
      setLogs(prev => [...prev, { 
        id: Date.now(), 
        time, 
        agent: `${randQ.from} (Requires Input)`, 
        msg: randQ.q,
        isQuestion: true 
      }].slice(-50));
      
    }, 10000);
    return () => clearInterval(int10s);
  }, []);

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
    setLogs(prev => [...prev, { id: Date.now(), time, agent: 'BOARD (YOU)', msg: command, isQuestion: false }]);
    setCommand("");
  };

  const calculateParticlePosition = (fromId: string, toId: string, progress: number) => {
    const from = INIT_AGENTS.find(a => a.id === fromId);
    const to = INIT_AGENTS.find(a => a.id === toId);
    if (!from || !to) return { display: 'none' };

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
            <div key={r.id} className="room" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
              <div className="room-details">
                <div className="room-title">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, boxShadow: `0 0 10px ${r.color}` }}></div>
                  {r.name}
                </div>
                <div className="room-goal">{r.goal}</div>
              </div>
            </div>
          ))}

          {/* Render Characters */}
          {agents.map(a => (
            <div key={a.id} className="agent-node" style={{ left: a.qx, top: a.qy }}>
              {/* Bot Character Model */}
              <div className="bot-body">
                <div className="bot-eye"></div>
                {/* Bouncing tiny hands */}
                <div className="bot-hand left typing"></div>
                <div className="bot-hand right typing"></div>
              </div>

              {/* Box explicitly near agent containing Name, Role, and Action text! */}
              <div className="agent-name-plate">
                <div className="agent-name">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                  {a.name}
                </div>
                <div className="agent-role">{a.role}</div>
                <div className="agent-current-task">
                  {'>'} {a.activeTask}
                </div>
              </div>
            </div>
          ))}

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
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Mission Control Feed
          </div>
          {logs.map(l => (
            <div key={l.id} className={`log-line ${l.isQuestion ? 'question' : ''}`}>
              <span className="log-time">[{l.time}]</span>
              <span className="log-agent">{l.agent}:</span>
              <span className="log-msg">{l.msg}</span>
            </div>
          ))}
        </div>

        <div className="command-center">
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Direct Communication (Intercom)
          </div>
          <form onSubmit={handleCommand} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <textarea 
               value={command} 
               onChange={e => setCommand(e.target.value)}
               placeholder="Answer questions or issue commands to the squad..."
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
