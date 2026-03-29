import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Settings, 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Send,
  MessageSquare,
  Activity,
  Globe,
  Database,
  Code2,
  FileText,
  Workflow,
  Sparkles
} from 'lucide-react';
import './index.css';

// --- MOCK DATA FOR THE DEMO ---

const PROJECT = {
  name: "Salesforce CPQ -> Salesforce RCA",
  client: "Acme Corp Enterprise",
  progress: 68,
  status: "In Progress (Logic Translation)"
};

const ROOMS = [
  { id: 'boardroom', title: 'The War Room (Strategy & PM)', icon: <Briefcase size={16} /> },
  { id: 'research', title: 'Research & Discovery', icon: <Globe size={16} /> },
  { id: 'logic', title: 'Data Translation & Logic Lab', icon: <Workflow size={16} /> },
  { id: 'engineering', title: 'Integration Engineering Floor', icon: <Code2 size={16} /> },
];

const AGENTS = [
  {
    id: 'a1',
    name: 'Ada',
    role: 'Migration Architect (CEO)',
    room: 'boardroom',
    status: 'active',
    task: 'Reviewing mapping architecture',
    icon: <Sparkles size={20} style={{ color: '#c084fc' }} />
  },
  {
    id: 'a2',
    name: 'Atlas',
    role: 'Project Manager',
    room: 'boardroom',
    status: 'idle',
    task: 'Waiting for milestone completion',
    icon: <LayoutDashboard size={20} style={{ color: '#9ca3af' }} />
  },
  {
    id: 'a3',
    name: 'Rosie',
    role: 'Research Agent',
    room: 'research',
    status: 'active',
    task: 'Scraping target RCA docs',
    icon: <FileText size={20} style={{ color: '#60a5fa' }} />
  },
  {
    id: 'a4',
    name: 'Cyrus',
    role: 'Context Gatherer',
    room: 'research',
    status: 'active',
    task: 'Interviewing Billing Team (Slack)',
    icon: <MessageSquare size={20} style={{ color: '#f472b6' }} />
  },
  {
    id: 'a5',
    name: 'Nexus',
    role: 'Logic Agent',
    room: 'logic',
    status: 'very-active',
    task: 'Translating Quote-to-Cash rule #402',
    icon: <Database size={20} style={{ color: '#34d399' }} />
  },
  {
    id: 'a6',
    name: 'Spark',
    role: 'Integration Engineer',
    room: 'engineering',
    status: 'active',
    task: 'Writing Python ETL script',
    icon: <Code2 size={20} style={{ color: '#fb923c' }} />
  },
  {
    id: 'a7',
    name: 'Quinn',
    role: 'QA & Playbooks',
    room: 'engineering',
    status: 'idle',
    task: 'Awaiting build sync',
    icon: <CheckCircle2 size={20} style={{ color: '#9ca3af' }} />
  }
];

const FEED = [
  {
    id: 1,
    agent: 'Cyrus',
    title: 'Context Gathered',
    desc: 'Extracted manual discount approval workflow from John (VP Sales) on Slack.',
    time: '2 mins ago',
    icon: <MessageSquare size={16} color="#ec4899" />
  },
  {
    id: 2,
    agent: 'Nexus',
    title: 'Logic Mapped',
    desc: 'Successfully translated CPQ Price Rule #992 to new RCA Product Model.',
    time: '14 mins ago',
    icon: <Workflow size={16} color="#10b981" />
  },
  {
    id: 3,
    agent: 'Spark',
    title: 'Code Committed',
    desc: 'Pushed Python transformation layer for Opportunity Line Items.',
    time: '45 mins ago',
    icon: <Code2 size={16} color="#f59e0b" />
  },
  {
    id: 4,
    agent: 'Ada',
    title: 'Milestone Approved',
    desc: 'Approved Database Schema mapping phase. Moving to Logic translation.',
    time: '1 hour ago',
    icon: <CheckCircle2 size={16} color="#8b5cf6" />
  }
];

// --- COMPONENTS ---

const AgentBadge = ({ agent }: { agent: any }) => {
  const isVeryActive = agent.status === 'very-active';
  const isActive = agent.status !== 'idle';
  
  return (
    <motion.div 
      className="agent floating"
      whileHover={{ scale: 1.05 }}
      style={{ animationDelay: `${Math.random() * 2}s` }}
    >
      <div className={`avatar-ring ${isActive ? 'active' : ''}`} style={isVeryActive ? { animationDuration: '1s' } : {}}>
        <div className="avatar-inner">
          {agent.icon}
        </div>
        <div className={`status-dot ${isActive ? 'active' : ''}`} />
      </div>
      <div className="agent-info">
        <h4 className="agent-name" style={{ color: isActive ? '#fff' : '#a1a1aa' }}>{agent.name}</h4>
        <p className="agent-role">{agent.role}</p>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="agent-task"
          >
            {agent.task}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};


export default function App() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{sender: string, text: string, time: string, isBot: boolean}[]>([
    { sender: "Ada (CEO)", text: "Hey! We are currently running the Salesforce migration. Nexus is struggling slightly with the Quote Line Logic translation, we might need human input on Rule #402. Want me to pause?", time: "Just now", isBot: true }
  ]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    setMessages(prev => [...prev, { 
      sender: "You", 
      text: chatInput, 
      time: "Just now", 
      isBot: false 
    }]);
    setChatInput("");

    // Simulate agent reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: "Nexus (Logic Agent)", 
        text: "I received your feedback! Adjusting translation rule mechanism immediately. Resuming sprint.", 
        time: "Just now", 
        isBot: true 
      }]);
    }, 2000);
  };

  return (
    <div className="app-container">
      
      {/* LEFT SIDEBAR */}
      <div className="glass-panel sidebar">
        <div className="logo-area">
          <h1>
            <Building2 style={{ color: '#3b82f6' }} />
            The A Company
          </h1>
        </div>
        
        <nav className="nav-menu">
          <div className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Dashboard</div>
          <div className="nav-item active"><LayoutDashboard size={18} /> Mission Control</div>
          <div className="nav-item"><Users size={18} /> Agent Roster</div>
          <div className="nav-item"><Activity size={18} /> Budget & Pulse</div>
          <div className="nav-item"><Settings size={18} /> Settings</div>
        </nav>
      </div>

      {/* MIDDLE: MAIN OFFICE INTERACTIVE CANVAS */}
      <div className="main-office">
        
        {/* Header Ribbon */}
        <div className="glass-panel header-panel">
          <div className="project-info">
            <h2>{PROJECT.name}</h2>
            <p>Active Client: {PROJECT.client} &middot; <span style={{color: 'var(--accent-blue)'}}>{PROJECT.status}</span></p>
          </div>
          <div className="progress-section">
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{PROJECT.progress}%</span>
            <div className="progress-bar-container">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${PROJECT.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Office Rooms Grid */}
        <div className="office-map glass-panel">
          {ROOMS.map(room => {
            const roomAgents = AGENTS.filter(a => a.room === room.id);
            return (
              <div key={room.id} className="room">
                <div className="room-header">
                  <div className="room-title flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {room.icon}
                    {room.title}
                  </div>
                </div>
                <div className="room-content">
                  <AnimatePresence>
                    {roomAgents.map(agent => (
                      <AgentBadge key={agent.id} agent={agent} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: ACTIVITY & CHAT */}
      <div className="side-panel">
        
        {/* Live Feed */}
        <div className="glass-panel feed-section" style={{ height: '40%' }}>
          <h3 className="section-title"><Activity size={18} style={{ color: '#60a5fa' }} /> Agent Feed</h3>
          <div className="feed-list">
            {FEED.map(item => (
              <div key={item.id} className="feed-item">
                <div className="feed-icon">{item.icon}</div>
                <div className="feed-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4>{item.title} <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>by {item.agent}</span></h4>
                  </div>
                  <p>{item.desc}</p>
                  <div className="feed-meta">
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Chat */}
        <div className="glass-panel chat-section" style={{ height: '60%' }}>
          <h3 className="section-title"><MessageSquare size={18} style={{ color: '#c084fc' }} /> Intercom</h3>
          
          <div className="feed-list flex-1">
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.isBot ? 'flex-start' : 'flex-end'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.sender} &middot; {m.time}</div>
                <div style={{
                  background: m.isBot ? 'rgba(255,255,255,0.05)' : 'var(--accent-blue)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopLeftRadius: m.isBot ? '0px' : '12px',
                  borderTopRightRadius: !m.isBot ? '0px' : '12px',
                  fontSize: '13px',
                  maxWidth: '85%',
                  lineHeight: 1.5
                }}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Message the company..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
