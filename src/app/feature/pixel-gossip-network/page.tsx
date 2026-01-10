"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  message: string;
  color: string;
  glow: number;
  age: number;
  connections: string[];
  pulsePhase: number;
}

interface Particle {
  id: string;
  fromNode: string;
  toNode: string;
  progress: number;
  message: string;
  color: string;
}

const COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dfe6e9",
  "#fd79a8",
  "#a29bfe",
  "#00b894",
  "#e17055",
];

const SAMPLE_MESSAGES = [
  "hello world 👋",
  "anyone else awake?",
  "the matrix has you",
  "vibes only ✨",
  "send help lol",
  "we are all connected",
  "data flows like water",
  "bits and dreams",
  "signal in the noise",
  "digital heartbeat 💓",
];

export default function PixelGossipNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [message, setMessage] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const createNode = useCallback(
    (msg: string, x?: number, y?: number): Node => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        id: generateId(),
        x: x ?? Math.random() * canvasSize.width,
        y: y ?? Math.random() * canvasSize.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        message: msg,
        color,
        glow: 1,
        age: 0,
        connections: [],
        pulsePhase: Math.random() * Math.PI * 2,
      };
    },
    [canvasSize]
  );

  const spreadGossip = useCallback((fromNode: Node) => {
    const nodes = nodesRef.current;
    const nearbyNodes = nodes.filter((n) => {
      if (n.id === fromNode.id) return false;
      const dx = n.x - fromNode.x;
      const dy = n.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 200 && !fromNode.connections.includes(n.id);
    });

    if (nearbyNodes.length > 0) {
      const target = nearbyNodes[Math.floor(Math.random() * nearbyNodes.length)];
      fromNode.connections.push(target.id);

      particlesRef.current.push({
        id: generateId(),
        fromNode: fromNode.id,
        toNode: target.id,
        progress: 0,
        message: fromNode.message,
        color: fromNode.color,
      });
    }
  }, []);

  // Initialize with some nodes
  useEffect(() => {
    const initialNodes: Node[] = [];
    for (let i = 0; i < 8; i++) {
      const node = createNode(SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length]);
      initialNodes.push(node);
    }
    nodesRef.current = initialNodes;
    setNodeCount(initialNodes.length);
    setMessageCount(initialNodes.length);
  }, [createNode]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setCanvasSize({
          width: container.clientWidth,
          height: Math.min(container.clientHeight, 600),
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastSpreadTime = 0;

    const animate = (time: number) => {
      const nodes = nodesRef.current;
      const particles = particlesRef.current;

      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw connections
      nodes.forEach((node) => {
        node.connections.forEach((connId) => {
          const connNode = nodes.find((n) => n.id === connId);
          if (connNode) {
            ctx.strokeStyle = `${node.color}33`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connNode.x, connNode.y);
            ctx.stroke();
          }
        });
      });

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += 0.02;

        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        const fromNode = nodes.find((n) => n.id === p.fromNode);
        const toNode = nodes.find((n) => n.id === p.toNode);

        if (fromNode && toNode) {
          const x = fromNode.x + (toNode.x - fromNode.x) * p.progress;
          const y = fromNode.y + (toNode.y - fromNode.y) * p.progress;

          // Draw particle trail
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, "transparent");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, Math.PI * 2);
          ctx.fill();

          // Draw particle core
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update and draw nodes
      nodes.forEach((node) => {
        // Physics
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 30 || node.x > canvas.width - 30) node.vx *= -1;
        if (node.y < 30 || node.y > canvas.height - 30) node.vy *= -1;

        node.x = Math.max(30, Math.min(canvas.width - 30, node.x));
        node.y = Math.max(30, Math.min(canvas.height - 30, node.y));

        // Slight attraction to center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        node.vx += (centerX - node.x) * 0.00005;
        node.vy += (centerY - node.y) * 0.00005;

        // Damping
        node.vx *= 0.999;
        node.vy *= 0.999;

        // Age and decay glow
        node.age += 1;
        node.glow = Math.max(0.3, 1 - node.age / 1000);
        node.pulsePhase += 0.05;

        // Draw glow
        const pulseSize = Math.sin(node.pulsePhase) * 5 + 25;
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          pulseSize
        );
        gradient.addColorStop(0, `${node.color}${Math.floor(node.glow * 255).toString(16).padStart(2, "0")}`);
        gradient.addColorStop(0.5, `${node.color}66`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw node core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Periodically spread gossip
      if (time - lastSpreadTime > 500 && nodes.length > 1) {
        const activeNode = nodes[Math.floor(Math.random() * nodes.length)];
        spreadGossip(activeNode);
        lastSpreadTime = time;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [canvasSize, spreadGossip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const newNode = createNode(
      message.trim(),
      canvas.width / 2 + (Math.random() - 0.5) * 100,
      canvas.height / 2 + (Math.random() - 0.5) * 100
    );
    newNode.glow = 1.5; // Extra bright for new messages

    nodesRef.current.push(newNode);
    setNodeCount(nodesRef.current.length);
    setMessageCount((prev) => prev + 1);
    setMessage("");

    // Immediately spread to nearby nodes
    setTimeout(() => spreadGossip(newNode), 100);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });

    if (clickedNode) {
      setHoveredMessage(clickedNode.message);
      setTimeout(() => setHoveredMessage(null), 3000);
    }
  };

  return (
    <FeatureWrapper day={406} title="Pixel Gossip Network" emoji="🕸️">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
        <div className="text-center space-y-2">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            The Internet&apos;s Nervous System
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Drop a thought into the void. Watch it spread through the network.
            Click nodes to reveal their secrets.
          </p>
        </div>

        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid var(--color-border)",
            height: "500px",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            className="cursor-pointer w-full h-full"
          />

          {hoveredMessage && (
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium animate-pulse"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              &quot;{hoveredMessage}&quot;
            </div>
          )}

          <div
            className="absolute bottom-4 left-4 flex gap-4 text-xs"
            style={{ color: "var(--color-text-dim)" }}
          >
            <span>🔮 {nodeCount} nodes</span>
            <span>💬 {messageCount} messages</span>
            <span>⚡ {particlesRef.current.length} transmitting</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 50))}
            placeholder="whisper into the void..."
            maxLength={50}
            className="flex-1 px-4 py-2 rounded-lg outline-none"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="btn-primary px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transmit ✨
          </button>
        </form>

        <div
          className="text-xs text-center"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>Anonymous • Ephemeral • Connected</p>
          <p className="mt-1 opacity-60">
            Messages flow between nodes, creating organic networks of digital thought
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}