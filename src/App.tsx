import { useState, useEffect } from 'react';
import { 
  Network, 
  MessageSquare, 
  Database,
  Workflow, 
  Code2, 
  CheckCircle2, 
  Target,
  MonitorPlay,
  Share2,
  FileJson,
  Blocks,
  Cloud
} from 'lucide-react';
import './index.css';

// --- DATA STRUCTURES ---

// Coordinates are percentages within the canvas container
const MAIN_NODES = [
  { id: 'goal',   label: 'Migration Directive', y: 15, x: 50, icon: <Target size={24} />, color: '#ec4899', isAgent: false },
  { id: 'cyrus',  label: 'Context Gathering',  y: 30, x: 50, icon: <MessageSquare size={24} />, color: '#10b981', isAgent: true, name: 'Cyrus' },
  { id: 'rosie',  label: 'Schema Analysis',    y: 45, x: 50, icon: <Database size={24} />, color: '#10b981', isAgent: true, name: 'Rosie' },
  { id: 'nexus',  label: 'Logic Translation',  y: 60, x: 50, icon: <Workflow size={24} />, color: '#3b82f6', isAgent: true, name: 'Nexus' },
  { id: 'spark',  label: 'ETL Execution',      y: 75, x: 50, icon: <Code2 size={24} />, color: '#f59e0b', isAgent: true, name: 'Spark' },
  { id: 'ada',    label: 'CEO Approval',       y: 90, x: 50, icon: <CheckCircle2 size={24} />, color: '#8b5cf6', isAgent: true, name: 'Ada' }
];

const SIDE_NODES = [
  // Feeding into Cyrus (30)
  { id: 'slack',  label: 'Slack Network',      y: 30, x: 20, icon: <Network size={20} />, color: '#a1a1aa' },
  { id: 'heygen', label: 'HeyGen Avatars',     y: 30, x: 80, icon: <MonitorPlay size={20} />, color: '#a1a1aa' },
  // Feeding into Rosie (45)
  { id: 'legacydb',label:'CPQ Oracle DB',      y: 45, x: 20, icon: <Database size={20} />, color: '#a1a1aa' },
  { id: 'rcadb',  label: 'RCA Vector Store',   y: 45, x: 80, icon: <Share2 size={20} />, color: '#a1a1aa' },
  // Feeding into Nexus (60)
  { id: 'pricerules',label:'Price Rules Array',y: 60, x: 20, icon: <FileJson size={20} />, color: '#a1a1aa' },
  { id: 'productcfg',label:'CPQ Bundles AST',  y: 60, x: 80, icon: <Blocks size={20} />, color: '#a1a1aa' },
  // Feeding out of Spark (75) = using a side node as output
  { id: 'sandbox', label:'Salesforce QA Org',  y: 75, x: 80, icon: <Cloud size={20} />, color: '#a1a1aa' }
];

const CONNECTIONS = [
  // Central Spine
  { from: 'goal', to: 'cyrus' },
  { from: 'cyrus', to: 'rosie' },
  { from: 'rosie', to: 'nexus' },
  { from: 'nexus', to: 'spark' },
  { from: 'spark', to: 'ada' },
  // Side branches entering
  { from: 'slack', to: 'cyrus' },
  { from: 'heygen', to: 'cyrus' },
  { from: 'legacydb', to: 'rosie' },
  { from: 'rcadb', to: 'rosie' },
  { from: 'pricerules', to: 'nexus' },
  { from: 'productcfg', to: 'nexus' },
  // Side branches exiting
  { from: 'spark', to: 'sandbox' }
];

// Deep scripts for agents (Will rotate every 5 seconds)
const AGENT_TASKS: Record<string, string[]> = {
  cyrus: [
    "Querying Billing Slack channel for unwritten rules...",
    "Scanning Sales Ops recent emails for discount thresholds.",
    "Sending HeyGen automated video prompt to VP Sales.",
    "Updating knowledge graph with new context variables."
  ],
  rosie: [
    "Mapping CPQ SBQQ__Quote__c to RCA Cart__c structure.",
    "Analyzing 320 custom fields on OpportunityLineItem.",
    "Validating lookup relationship parity across orgs.",
    "Dumping schema differences into vector store."
  ],
  nexus: [
    "Parsing Price Rule #402 AST...",
    "Converting CPQ Block Pricing into RCA Attribute Pricing.",
    "Rewriting formula syntax to target RCA scripting logic.",
    "Executing Sandbox dry-run evaluation on generated script."
  ],
  spark: [
    "Initiating ETL batch 1/50 (10,000 legacy records).",
    "Writing Python transformation adapter.",
    "Pushing structured payload to Sandbox Org REST API.",
    "Validating record insertion rate limits in target org."
  ],
  ada: [
    "Validating milestone progression.",
    "Reviewing Data Quality mapping report from Rosie.",
    "Checking execution log warnings from Spark.",
    "Approving next cluster for Logic Translation."
  ]
};

// Global simulated event feed
const FEED_MESSAGES = [
  "Cyrus discovered a manual override rule from John (VP Sales).",
  "Target RCA instance verified and connected via JWT.",
  "Rosie detected conflicting picklist values across orgs. Attempting auto-resolution.",
  "Nexus compiled 10 pricing conditions successfully into RCA AST.",
  "Warning: Spark hit concurrency limit on Sandbox DB... rate limiting applied.",
  "Ada approved transition to Milestone 4 (Products Mapping)."
];

export default function App() {
  const [taskIndices, setTaskIndices] = useState<Record<string, number>>({
    cyrus: 0, rosie: 0, nexus: 0, spark: 0, ada: 0
  });
  
  const [feedMessage, setFeedMessage] = useState("System online. Beginning CPQ to RCA transition map.");

  // Rotate agent tasks every 5 seconds ("not too much fast")
  useEffect(() => {
    const taskInterval = setInterval(() => {
      setTaskIndices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          // 30% chance an agent moves to the next task in the cycle on this interval to stagger them
          if (Math.random() > 0.3) {
            next[key] = (next[key] + 1) % AGENT_TASKS[key].length;
          }
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(taskInterval);
  }, []);

  // Produce a new major event / insight every 8 seconds
  useEffect(() => {
    const feedInterval = setInterval(() => {
      const msg = FEED_MESSAGES[Math.floor(Math.random() * FEED_MESSAGES.length)];
      setFeedMessage(msg);
    }, 8000);
    return () => clearInterval(feedInterval);
  }, []);

  // Helper to draw curved SVG lines between nodes
  const createPath = (fromId: string, toId: string) => {
    const allNodes = [...MAIN_NODES, ...SIDE_NODES];
    const source = allNodes.find(n => n.id === fromId);
    const target = allNodes.find(n => n.id === toId);
    
    if (!source || !target) return "";

    const x1 = source.x; const y1 = source.y;
    const x2 = target.x; const y2 = target.y;

    // Cubic bezier curve logic
    // If it's the central spine (same X)
    if (Math.abs(x1 - x2) < 5) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    // If it's a side node connecting to main spine
    const distY = Math.abs(y2 - y1);
    const controlY = distY > 5 ? y1 + (y2-y1)/2 : y1;
    return `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
  };

  return (
    <div className="app-wrapper">
      
      {/* Header */}
      <div className="top-header">
        <div className="header-text">
          <h1>Context Flow &amp; Migration Architecture</h1>
          <p>Salesforce CPQ &rarr; Salesforce RCA Transition Topology</p>
        </div>
        <div className="timer">00:00:00</div>
      </div>

      {/* Main Node Graph Area */}
      <div className="canvas-container">
        
        {/* SVG connection lines overlay */}
        <svg className="connection-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Define the gradient or glow filters if we wanted to get extremely fancy */}
          </defs>
          
          {CONNECTIONS.map((conn, idx) => {
            const dStr = createPath(conn.from, conn.to);
            const isMainSpine = MAIN_NODES.find(n => n.id === conn.from) && MAIN_NODES.find(n => n.id === conn.to);
            return (
              <g key={idx}>
                <path d={dStr} className="path-bg" vectorEffect="non-scaling-stroke" />
                <path d={dStr} className={`path-animated ${isMainSpine ? 'active-flow' : ''}`} stroke={isMainSpine ? '#10b981' : '#3b82f6'} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>

        {/* SIDE CONTEXT NODES */}
        {SIDE_NODES.map(node => (
          <div key={node.id} className="node" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            {/* The small sidebox to match the reference look */}
            <div className="side-box">
              <div className="side-box-title" style={{ color: node.color }}>{node.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                {node.icon}
                <span style={{ fontSize: '11px' }}>Context Source</span>
              </div>
            </div>
          </div>
        ))}

        {/* MAIN SPINE AGENT NODES */}
        {MAIN_NODES.map(node => {
          const isAgent = node.isAgent;
          const currentTask = isAgent ? AGENT_TASKS[node.id][taskIndices[node.id]] : "Project Root Sequence";

          return (
            <div key={node.id} className="node glow" style={{ left: `${node.x}%`, top: `${node.y}%`, color: node.color }}>
              
              <div className="node-icon-wrapper" style={{ borderColor: node.color }}>
                <div className="node-icon-inner">{node.icon}</div>
              </div>

              <div className="node-text">
                <div className="node-title">{node.label}</div>
                
                {isAgent && (
                  <div className="node-task" key={currentTask /* to trigger react re-render animation */}>
                    {/* Display what they are explicitly doing */}
                    {currentTask}
                  </div>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* Bottom Global Status Update pulse */}
      <div className="mini-feed">
        <div className="feed-pulse" />
        <div className="feed-text">{feedMessage}</div>
      </div>

    </div>
  );
}
