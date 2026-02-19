"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Symbol {
  name: string;
  color: string;
  value: number;
}

interface Reel {
  position: number;
  velocity: number;
  targetSymbol: number;
  spinning: boolean;
  stopped: boolean;
}

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

const SYMBOLS: Symbol[] = [
  { name: "7", color: "#FF0000", value: 100 },
  { name: "🔔", color: "#FFD700", value: 50 },
  { name: "🍒", color: "#DC143C", value: 25 },
  { name: "🍋", color: "#FFE135", value: 15 },
  { name: "🍊", color: "#FFA500", value: 10 },
  { name: "🍇", color: "#8B008B", value: 5 },
  { name: "⭐", color: "#FFD700", value: 75 },
  { name: "💎", color: "#00BFFF", value: 200 },
];

const REEL_COUNT = 3;
const SYMBOL_HEIGHT = 80;
const VISIBLE_SYMBOLS = 3;

export default function PixelSlotMachineCasino() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reelsRef = useRef<Reel[]>([
    { position: 0, velocity: 0, targetSymbol: 0, spinning: false, stopped: true },
    { position: 0, velocity: 0, targetSymbol: 0, spinning: false, stopped: true },
    { position: 0, velocity: 0, targetSymbol: 0, spinning: false, stopped: true },
  ]);
  const fallingCoinsRef = useRef<Coin[]>([]);
  
  const [coins, setCoins] = useState(100);
  const [bet, setBet] = useState(5);
  const [lastWin, setLastWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [jackpot, setJackpot] = useState(false);
  const [message, setMessage] = useState("🎰 Insert coins & pull the lever!");
  const jackpotRef = useRef(false);

  useEffect(() => {
    jackpotRef.current = jackpot;
  }, [jackpot]);

  const playSound = useCallback((type: "spin" | "stop" | "win" | "jackpot" | "coin") => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch (type) {
      case "spin":
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case "stop":
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
      case "win":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case "jackpot":
        oscillator.type = "sawtooth";
        const notes = [523, 659, 784, 880, 1047];
        notes.forEach((freq, i) => {
          oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        });
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.75);
        break;
      case "coin":
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
    }
  }, []);

  const spawnCoins = useCallback((count: number) => {
    const newCoins: Coin[] = [];
    for (let i = 0; i < count; i++) {
      newCoins.push({
        x: 150 + Math.random() * 100,
        y: -20 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        size: 15 + Math.random() * 10,
      });
    }
    fallingCoinsRef.current = [...fallingCoinsRef.current, ...newCoins];
  }, []);

  const checkWin = useCallback((finalSymbols: number[]) => {
    const symbols = finalSymbols.map(i => SYMBOLS[i % SYMBOLS.length]);
    
    // Check for triple match
    if (symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name) {
      const winAmount = symbols[0].value * bet;
      setCoins(prev => prev + winAmount);
      setLastWin(winAmount);
      
      if (symbols[0].name === "💎" || symbols[0].name === "7") {
        setJackpot(true);
        setMessage(`🎉 JACKPOT!!! +${winAmount} COINS! 🎉`);
        playSound("jackpot");
        spawnCoins(50);
        setTimeout(() => setJackpot(false), 3000);
      } else {
        setMessage(`🎊 WINNER! +${winAmount} coins!`);
        playSound("win");
        spawnCoins(Math.min(winAmount / 5, 30));
      }
      return;
    }
    
    // Check for double match
    if (symbols[0].name === symbols[1].name || symbols[1].name === symbols[2].name) {
      const matchedSymbol = symbols[0].name === symbols[1].name ? symbols[0] : symbols[2];
      const winAmount = Math.floor(matchedSymbol.value * bet * 0.3);
      if (winAmount > 0) {
        setCoins(prev => prev + winAmount);
        setLastWin(winAmount);
        setMessage(`✨ Nice! +${winAmount} coins!`);
        playSound("coin");
        spawnCoins(5);
        return;
      }
    }
    
    setLastWin(0);
    setMessage("😢 No luck this time... Spin again!");
  }, [bet, playSound, spawnCoins]);

  const spin = useCallback(() => {
    if (isSpinning || coins < bet) return;
    
    setCoins(prev => prev - bet);
    setIsSpinning(true);
    setLastWin(0);
    setMessage("🎰 Spinning...");
    playSound("spin");
    
    const targets = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ];
    
    reelsRef.current = [
      { position: 0, velocity: 30, targetSymbol: targets[0], spinning: true, stopped: false },
      { position: 0, velocity: 30, targetSymbol: targets[1], spinning: true, stopped: false },
      { position: 0, velocity: 30, targetSymbol: targets[2], spinning: true, stopped: false },
    ];
    
    // Stop reels sequentially
    setTimeout(() => {
      reelsRef.current[0] = { ...reelsRef.current[0], spinning: false };
      playSound("stop");
    }, 1000);
    
    setTimeout(() => {
      reelsRef.current[1] = { ...reelsRef.current[1], spinning: false };
      playSound("stop");
    }, 1500);
    
    setTimeout(() => {
      reelsRef.current[2] = { ...reelsRef.current[2], spinning: false };
      playSound("stop");
      
      setTimeout(() => {
        setIsSpinning(false);
        checkWin(targets);
      }, 300);
    }, 2000);
  }, [isSpinning, coins, bet, playSound, checkWin]);

  const drawPixelSymbol = useCallback((ctx: CanvasRenderingContext2D, symbol: Symbol, x: number, y: number, size: number) => {
    ctx.save();
    ctx.font = `${size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillText(symbol.name, x + 2, y + 2);
    
    // Draw symbol
    ctx.fillStyle = symbol.color;
    ctx.fillText(symbol.name, x, y);
    
    ctx.restore();
  }, []);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin) => {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate(coin.rotation);
    
    // Coin body
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.size, coin.size * Math.abs(Math.cos(coin.rotation)), 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin shine
    ctx.fillStyle = "#FFF8DC";
    ctx.beginPath();
    ctx.ellipse(-coin.size * 0.3, -coin.size * 0.3, coin.size * 0.3, coin.size * 0.2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin edge
    ctx.strokeStyle = "#DAA520";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.size, coin.size * Math.abs(Math.cos(coin.rotation)), 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const animate = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw machine frame
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#8B0000");
      gradient.addColorStop(0.5, "#DC143C");
      gradient.addColorStop(1, "#8B0000");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Draw reel window
      ctx.fillStyle = "#000";
      ctx.fillRect(30, 50, canvas.width - 60, 200);
      
      // Draw reels
      const reelWidth = (canvas.width - 80) / REEL_COUNT;
      
      reelsRef.current = reelsRef.current.map((reel, i) => {
        const updatedReel = { ...reel };
        
        if (reel.spinning) {
          updatedReel.position += reel.velocity;
          if (updatedReel.position >= SYMBOL_HEIGHT * SYMBOLS.length) {
            updatedReel.position = 0;
          }
        } else if (!reel.stopped) {
          // Slow down and snap to target
          const targetPos = reel.targetSymbol * SYMBOL_HEIGHT + SYMBOL_HEIGHT;
          const diff = targetPos - (updatedReel.position % (SYMBOL_HEIGHT * SYMBOLS.length));
          
          if (Math.abs(diff) < 5) {
            updatedReel.position = targetPos;
            updatedReel.stopped = true;
            updatedReel.velocity = 0;
          } else {
            updatedReel.velocity = Math.max(2, updatedReel.velocity * 0.95);
            updatedReel.position += updatedReel.velocity;
          }
        }
        
        // Draw symbols for this reel
        ctx.save();
        ctx.beginPath();
        ctx.rect(40 + i * reelWidth, 55, reelWidth - 10, 190);
        ctx.clip();
        
        // Draw reel background
        ctx.fillStyle = "#FFF";
        ctx.fillRect(40 + i * reelWidth, 55, reelWidth - 10, 190);
        
        for (let j = -1; j < VISIBLE_SYMBOLS + 1; j++) {
          const symbolIndex = Math.floor((updatedReel.position / SYMBOL_HEIGHT + j) % SYMBOLS.length);
          const symbol = SYMBOLS[(symbolIndex + SYMBOLS.length) % SYMBOLS.length];
          const y = 55 + j * SYMBOL_HEIGHT - (updatedReel.position % SYMBOL_HEIGHT) + SYMBOL_HEIGHT / 2 + 30;
          
          if (y > 30 && y < 270) {
            drawPixelSymbol(
              ctx,
              symbol,
              40 + i * reelWidth + (reelWidth - 10) / 2,
              y,
              50
            );
          }
        }
        
        ctx.restore();
        
        return updatedReel;
      });
      
      // Draw win line
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(30, 150);
      ctx.lineTo(canvas.width - 30, 150);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw decorative lights
      const time = Date.now() / 200;
      const isJackpot = jackpotRef.current;
      for (let i = 0; i < 10; i++) {
        const lightOn = Math.sin(time + i) > 0 || isJackpot;
        ctx.fillStyle = lightOn ? (isJackpot ? `hsl(${(time * 50 + i * 36) % 360}, 100%, 50%)` : "#FFD700") : "#333";
        ctx.beginPath();
        ctx.arc(30 + i * ((canvas.width - 40) / 9), 30, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(30 + i * ((canvas.width - 40) / 9), canvas.height - 30, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Update and draw falling coins
      fallingCoinsRef.current = fallingCoinsRef.current.filter(coin => {
        coin.vy += 0.5; // gravity
        coin.x += coin.vx;
        coin.y += coin.vy;
        coin.rotation += coin.rotationSpeed;
        
        // Bounce off walls
        if (coin.x < coin.size || coin.x > canvas.width - coin.size) {
          coin.vx *= -0.7;
          coin.x = Math.max(coin.size, Math.min(canvas.width - coin.size, coin.x));
        }
        
        // Bounce off bottom
        if (coin.y > canvas.height - coin.size) {
          coin.vy *= -0.6;
          coin.vx *= 0.9;
          coin.y = canvas.height - coin.size;
          
          if (Math.abs(coin.vy) < 1) {
            return false; // Remove coin
          }
        }
        
        drawCoin(ctx, coin);
        return coin.y < canvas.height + 50;
      });
      
      // Jackpot effect
      if (isJackpot) {
        ctx.fillStyle = `hsla(${(Date.now() / 10) % 360}, 100%, 50%, 0.2)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [drawPixelSymbol, drawCoin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 text-white font-serif">
            🎰 Lucky Sevens Casino 🎰
          </h2>
          <p className="text-gray-400">
            Spin to win! Match symbols for prizes!
          </p>
        </div>

        <div 
          className="rounded-xl p-4 shadow-2xl bg-gray-800 border-4 border-gray-700"
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="rounded-lg"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        <div 
          className={`text-center p-3 rounded-lg min-h-12 flex items-center justify-center transition-transform ${
            jackpot ? "bg-yellow-500 scale-105" : "bg-gray-800"
          }`}
        >
          <span className="text-lg font-bold text-white">{message}</span>
        </div>

        <div className="flex gap-8 items-center">
          <div className="text-center p-4 rounded-lg bg-gray-800">
            <div className="text-gray-400 text-sm">COINS</div>
            <div className="text-3xl font-bold text-yellow-400">
              💰 {coins}
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gray-800">
            <div className="text-gray-400 text-sm">LAST WIN</div>
            <div 
              className="text-3xl font-bold"
              style={{ color: lastWin > 0 ? "#00FF00" : "#9CA3AF" }}
            >
              {lastWin > 0 ? `+${lastWin}` : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white">BET:</span>
          <div className="flex gap-2">
            {[1, 5, 10, 25].map(amount => (
              <button
                key={amount}
                onClick={() => setBet(amount)}
                disabled={isSpinning}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  bet === amount 
                    ? "bg-yellow-500 ring-2 ring-yellow-300 ring-offset-2 ring-offset-gray-900" 
                    : "bg-gray-700 opacity-70 hover:opacity-100"
                } text-white`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={spin}
          disabled={isSpinning || coins < bet}
          className="px-12 py-4 text-2xl font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{
            background: isSpinning 
              ? "linear-gradient(135deg, #666, #444)" 
              : "linear-gradient(135deg, #FF6B6B, #FF4757)",
            boxShadow: isSpinning ? "none" : "0 4px 15px rgba(255, 75, 75, 0.4)"
          }}
        >
          {isSpinning ? "🎰 SPINNING..." : coins < bet ? "💸 NO COINS" : "🎲 SPIN!"}
        </button>

        {coins === 0 && !isSpinning && (
          <button
            onClick={() => { setCoins(100); setMessage("🎰 Welcome back! Good luck!"); }}
            className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            🎁 Get 100 Free Coins
          </button>
        )}

        <div className="mt-4 p-4 rounded-lg text-sm bg-gray-800 text-gray-400">
          <div className="font-bold mb-2 text-white">💎 PAYOUTS (×BET):</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {SYMBOLS.map(s => (
              <div key={s.name}>
                <span className="text-xl">{s.name}</span>
                <span className="ml-1">×{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs">
            Triple match = Full payout | Double match = 30% payout
          </div>
        </div>
      </div>
    </div>
  );
}