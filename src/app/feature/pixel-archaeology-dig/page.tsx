"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;
}

interface Cell {
  dirtLevel: number;
  maxDirt: number;
  artifact: Artifact | null;
  revealed: boolean;
}

const ARTIFACTS: Artifact[] = [
  { id: "usb", name: "Ancient USB Drive", emoji: "💾", rarity: "common", description: "Contains 256KB of forgotten memes" },
  { id: "floppy", name: "Fossilized Floppy Disk", emoji: "📀", rarity: "common", description: "AOL Free Trial #47382" },
  { id: "mouse", name: "Ball Mouse", emoji: "🖱️", rarity: "common", description: "The ball is still inside!" },
  { id: "cable", name: "Mystery Cable", emoji: "🔌", rarity: "common", description: "Nobody knows what it connects" },
  { id: "cd", name: "Scratched CD-ROM", emoji: "💿", rarity: "uncommon", description: "Encarta Encyclopedia '98" },
  { id: "pda", name: "Palm Pilot", emoji: "📱", rarity: "uncommon", description: "Still has 2 appointments from 2003" },
  { id: "ipod", name: "1st Gen iPod", emoji: "🎵", rarity: "uncommon", description: "1000 songs in your pocket!" },
  { id: "gameboy", name: "Game Boy Color", emoji: "🎮", rarity: "rare", description: "Batteries included (corroded)" },
  { id: "orb", name: "Glowing Data Orb", emoji: "🔮", rarity: "rare", description: "Hums with ancient WiFi signals" },
  { id: "nokia", name: "Nokia 3310", emoji: "📞", rarity: "rare", description: "Still has 50% battery" },
  { id: "server", name: "Miniature Server Rack", emoji: "🖥️", rarity: "legendary", description: "Runs Windows ME eternally" },
  { id: "crystal", name: "Silicon Crystal Core", emoji: "💎", rarity: "legendary", description: "The first processor's ancestor" },
];

const RARITY_COLORS = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  legendary: "text-yellow-400",
};

const RARITY_BG = {
  common: "bg-gray-800",
  uncommon: "bg-green-900",
  rare: "bg-blue-900",
  legendary: "bg-yellow-900",
};

const GRID_SIZE = 12;
const CELL_SIZE = 40;

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [discoveries, setDiscoveries] = useState<Artifact[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"brush" | "shovel" | "dynamite">("brush");
  const [isDigging, setIsDigging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const generateGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const zoneX = Math.floor(x / 4);
        const zoneY = Math.floor(y / 4);
        const baseDirt = 3 + zoneX + zoneY;
        const maxDirt = baseDirt + Math.floor(Math.random() * 3);
        
        let artifact: Artifact | null = null;
        const artifactChance = 0.15 + (zoneX + zoneY) * 0.05;
        
        if (Math.random() < artifactChance) {
          const rarityRoll = Math.random();
          let rarity: Artifact["rarity"];
          if (rarityRoll < 0.5) rarity = "common";
          else if (rarityRoll < 0.8) rarity = "uncommon";
          else if (rarityRoll < 0.95) rarity = "rare";
          else rarity = "legendary";
          
          const rarityArtifacts = ARTIFACTS.filter(a => a.rarity === rarity);
          artifact = rarityArtifacts[Math.floor(Math.random() * rarityArtifacts.length)];
        }
        
        row.push({
          dirtLevel: maxDirt,
          maxDirt,
          artifact,
          revealed: false,
        });
      }
      row.push();
    }
    return newGrid;
  }, []);

  const initializeGame = useCallback(() => {
    setGrid(generateGrid());
    setDiscoveries([]);
    setTotalClicks(0);
  }, [generateGrid]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = grid[y]?.[x];
          if (!cell) continue;
          
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;
          
          if (cell.revealed && cell.artifact) {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            ctx.font = "24px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cell.artifact.emoji, px + CELL_SIZE / 2, py + CELL_SIZE / 2);
          } else if (cell.dirtLevel > 0) {
            const dirtRatio = cell.dirtLevel / cell.maxDirt;
            const brown = Math.floor(60 + dirtRatio * 80);
            const green = Math.floor(30 + dirtRatio * 30);
            ctx.fillStyle = `rgb(${brown}, ${green}, 20)`;
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            
            // Dirt texture
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + dirtRatio * 0.2})`;
            for (let i = 0; i < cell.dirtLevel * 2; i++) {
              const dotX = px + Math.random() * CELL_SIZE;
              const dotY = py + Math.random() * CELL_SIZE;
              ctx.beginPath();
              ctx.arc(dotX, dotY, 1 + Math.random() * 2, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = "#2a2a4e";
            ctx.fillText("·", px + CELL_SIZE / 2, py + CELL_SIZE / 2);
          }
          
          // Grid lines
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
        }
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [grid]);

  const dig = (x: number, y: number) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
      const cell = newGrid[y]?.[x];
      if (!cell || cell.revealed) return prev;
      
      let digPower = 1;
      if (selectedTool === "shovel") digPower = 3;
      if (selectedTool === "dynamite") digPower = 10;
      
      cell.dirtLevel = Math.max(0, cell.dirtLevel - digPower);
      
      if (cell.dirtLevel === 0 && cell.artifact && !cell.revealed) {
        cell.revealed = true;
        setDiscoveries(d => {
          if (!d.find(a => a.id === cell.artifact?.id)) {
            return [...d, cell.artifact!];
          }
          return d;
        });
      }
      
      // Dynamite affects neighbors
      if (selectedTool === "dynamite") {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const neighbor = newGrid[ny]?.[nx];
              if (neighbor && !neighbor.revealed) {
                neighbor.dirtLevel = Math.max(0, neighbor.dirtLevel - 5);
                if (neighbor.dirtLevel === 0 && neighbor.artifact && !neighbor.revealed) {
                  neighbor.revealed = true;
                  setDiscoveries(d => {
                    if (!d.find(a => a.id === neighbor.artifact?.id)) {
                      return [...d, neighbor.artifact!];
                    }
                    return d;
                  });
                }
              }
            }
          }
        }
      }
      
      return newGrid;
    });
    
    setTotalClicks(c => c + 1);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    
    dig(x, y);
    setIsDigging(true);
    setTimeout(() => setIsDigging(false), 100);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    handleCanvasClick(e);
  };

  const totalArtifacts = grid.flat().filter(c => c?.artifact).length;
  const foundArtifacts = grid.flat().filter(c => c?.revealed && c?.artifact).length;

  return (
    <FeatureWrapper day={432} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <p className="text-center max-w-lg" style={{ color: "var(--color-text-dim)" }}>
          Unearth the relics of the Digital Age! Click to dig through layers of ancient server room dust
          and discover treasures from the Before Times. 🏺
        </p>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTool("brush")}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTool === "brush"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              🖌️ Brush
            </button>
            <button
              onClick={() => setSelectedTool("shovel")}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTool === "shovel"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              🔨 Shovel
            </button>
            <button
              onClick={() => setSelectedTool("dynamite")}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTool === "dynamite"
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              🧨 Dynamite
            </button>
          </div>
          <button
            onClick={initializeGame}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            🔄 New Dig Site
          </button>
        </div>

        <div className="flex gap-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
          <span>⛏️ Digs: {totalClicks}</span>
          <span>🏆 Found: {foundArtifacts}/{totalArtifacts}</span>
        </div>

        <div
          className={`relative rounded-lg overflow-hidden border-4 transition-transform ${
            isDigging ? "scale-[0.99]" : ""
          }`}
          style={{ borderColor: "var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            className="cursor-crosshair"
          />
        </div>

        {discoveries.length > 0 && (
          <div
            className="w-full max-w-lg p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📜 Discovery Log
            </h3>
            <div className="grid gap-2">
              {discoveries.map((artifact, i) => (
                <div
                  key={`${artifact.id}-${i}`}
                  className={`p-3 rounded-lg flex items-center gap-3 ${RARITY_BG[artifact.rarity]}`}
                >
                  <span className="text-2xl">{artifact.emoji}</span>
                  <div>
                    <div className={`font-bold ${RARITY_COLORS[artifact.rarity]}`}>
                      {artifact.name}
                    </div>
                    <div className="text-sm text-gray-400">{artifact.description}</div>
                  </div>
                  <span
                    className={`ml-auto text-xs px-2 py-1 rounded uppercase ${RARITY_COLORS[artifact.rarity]}`}
                  >
                    {artifact.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Tip: Darker soil means deeper layers. Check the corners for legendary finds!
          Hold click to dig continuously.
        </div>
      </div>
    </FeatureWrapper>
  );
}