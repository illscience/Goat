"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface PixelItem {
  id: number;
  name: string;
  pixels: string[][];
  baseValue: number;
  hiddenProperty: string;
  actualValue: number;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "trash";
}

interface AuctionState {
  currentItem: PixelItem | null;
  currentBid: number;
  highestBidder: string;
  timeLeft: number;
  isActive: boolean;
}

interface OwnedItem extends PixelItem {
  purchasePrice: number;
  revealed: boolean;
}

const PIXEL_ITEMS: Omit<PixelItem, "id">[] = [
  {
    name: "Mystery Sword",
    pixels: [
      ["", "", "#888", "#888", ""],
      ["", "#888", "#aaa", "#888", ""],
      ["#888", "#aaa", "#fff", "#aaa", "#888"],
      ["", "#888", "#aaa", "#888", ""],
      ["", "", "#654", "", ""],
      ["", "", "#654", "", ""],
      ["", "#654", "#654", "#654", ""],
    ],
    baseValue: 50,
    hiddenProperty: "Blessed by a pixel wizard! +500% value",
    actualValue: 300,
    rarity: "legendary",
  },
  {
    name: "Pixel Sandwich",
    pixels: [
      ["#d4a574", "#d4a574", "#d4a574", "#d4a574", "#d4a574"],
      ["#8bc34a", "#8bc34a", "#8bc34a", "#8bc34a", "#8bc34a"],
      ["#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b"],
      ["#ffd93d", "#ffd93d", "#ffd93d", "#ffd93d", "#ffd93d"],
      ["#d4a574", "#d4a574", "#d4a574", "#d4a574", "#d4a574"],
    ],
    baseValue: 20,
    hiddenProperty: "It's just a sandwich. A very pixelated one.",
    actualValue: 5,
    rarity: "trash",
  },
  {
    name: "Golden Chalice",
    pixels: [
      ["", "#ffd700", "#ffd700", "#ffd700", ""],
      ["", "#ffd700", "#fff8dc", "#ffd700", ""],
      ["", "#ffd700", "#ffd700", "#ffd700", ""],
      ["", "", "#daa520", "", ""],
      ["", "#daa520", "#daa520", "#daa520", ""],
    ],
    baseValue: 100,
    hiddenProperty: "Contains ancient pixel wine! Collectors love it!",
    actualValue: 250,
    rarity: "rare",
  },
  {
    name: "Mysterious Rock",
    pixels: [
      ["", "#666", "#666", "#666", ""],
      ["#666", "#888", "#888", "#888", "#666"],
      ["#666", "#888", "#aaa", "#888", "#666"],
      ["#666", "#888", "#888", "#888", "#666"],
      ["", "#666", "#666", "#666", ""],
    ],
    baseValue: 10,
    hiddenProperty: "It's a rock. You paid for a rock. Congratulations.",
    actualValue: 1,
    rarity: "trash",
  },
  {
    name: "Phoenix Feather",
    pixels: [
      ["", "", "#ff4500", "", ""],
      ["", "#ff6347", "#ff4500", "#ff6347", ""],
      ["#ffa500", "#ff6347", "#ff4500", "#ff6347", "#ffa500"],
      ["", "#ffd700", "#ffa500", "#ffd700", ""],
      ["", "", "#ffd700", "", ""],
    ],
    baseValue: 80,
    hiddenProperty: "Still warm! Grants +100 style points!",
    actualValue: 180,
    rarity: "rare",
  },
  {
    name: "Old Boot",
    pixels: [
      ["", "", "#4a3728", "#4a3728", "#4a3728"],
      ["", "#4a3728", "#5c4033", "#5c4033", "#4a3728"],
      ["#4a3728", "#5c4033", "#5c4033", "#5c4033", "#4a3728"],
      ["#4a3728", "#4a3728", "#4a3728", "#4a3728", "#4a3728"],
      ["", "", "", "", ""],
    ],
    baseValue: 5,
    hiddenProperty: "Smells like regret and poor life choices.",
    actualValue: 2,
    rarity: "trash",
  },
  {
    name: "Dragon Scale",
    pixels: [
      ["", "#228b22", "#228b22", "", ""],
      ["#228b22", "#32cd32", "#32cd32", "#228b22", ""],
      ["#228b22", "#32cd32", "#90ee90", "#32cd32", "#228b22"],
      ["", "#228b22", "#32cd32", "#228b22", ""],
      ["", "", "#228b22", "", ""],
    ],
    baseValue: 120,
    hiddenProperty: "From a REAL dragon! (disclaimer: dragon was made of pixels)",
    actualValue: 200,
    rarity: "rare",
  },
  {
    name: "Cursed Coin",
    pixels: [
      ["", "#c0c0c0", "#c0c0c0", "#c0c0c0", ""],
      ["#c0c0c0", "#808080", "#808080", "#808080", "#c0c0c0"],
      ["#c0c0c0", "#808080", "#4a0000", "#808080", "#c0c0c0"],
      ["#c0c0c0", "#808080", "#808080", "#808080", "#c0c0c0"],
      ["", "#c0c0c0", "#c0c0c0", "#c0c0c0", ""],
    ],
    baseValue: 60,
    hiddenProperty: "Cursed! Worth negative value! Ha!",
    actualValue: -20,
    rarity: "common",
  },
  {
    name: "Crown of Pixels",
    pixels: [
      ["#ffd700", "", "#ffd700", "", "#ffd700"],
      ["#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700"],
      ["#daa520", "#daa520", "#daa520", "#daa520", "#daa520"],
      ["#daa520", "#ff0000", "#daa520", "#00ff00", "#daa520"],
      ["", "", "", "", ""],
    ],
    baseValue: 200,
    hiddenProperty: "Fit for a pixel king! Ultimate treasure!",
    actualValue: 500,
    rarity: "legendary",
  },
  {
    name: "Banana",
    pixels: [
      ["", "", "", "#ffd700", ""],
      ["", "", "#ffd700", "#ffff00", ""],
      ["", "#ffd700", "#ffff00", "", ""],
      ["#8b4513", "#ffff00", "", "", ""],
      ["", "", "", "", ""],
    ],
    baseValue: 15,
    hiddenProperty: "Potassium content: high. Value: not so much.",
    actualValue: 8,
    rarity: "common",
  },
];

const AI_BIDDERS = [
  { name: "PixelBot3000", aggression: 0.7, maxMultiplier: 2.5 },
  { name: "BargainHunter", aggression: 0.3, maxMultiplier: 1.2 },
  { name: "CrazyCollector", aggression: 0.9, maxMultiplier: 4.0 },
  { name: "ArtAppraiser", aggression: 0.5, maxMultiplier: 1.8 },
  { name: "ImPulseBuyer", aggression: 0.8, maxMultiplier: 3.0 },
];

const RARITY_COLORS = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  legendary: "#f59e0b",
  trash: "#6b7280",
};

export default function PixelAuctionHouse() {
  const [coins, setCoins] = useState(500);
  const [auction, setAuction] = useState<AuctionState>({
    currentItem: null,
    currentBid: 0,
    highestBidder: "",
    timeLeft: 0,
    isActive: false,
  });
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const [message, setMessage] = useState("Welcome to the Pixel Auction House! 🎨");
  const [itemsAuctioned, setItemsAuctioned] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const auctionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiBidTimerRef = useRef<NodeJS.Timeout | null>(null);
  const itemIdRef = useRef<number>(0);

  const startNewAuction = useCallback(() => {
    if (gameOver) return;
    
    const randomItem = PIXEL_ITEMS[Math.floor(Math.random() * PIXEL_ITEMS.length)];
    const newItem: PixelItem = {
      ...randomItem,
      id: itemIdRef.current++,
    };

    setAuction({
      currentItem: newItem,
      currentBid: Math.floor(newItem.baseValue * 0.3),
      highestBidder: "",
      timeLeft: 10,
      isActive: true,
    });
    setMessage(`🔔 NEW ITEM: ${newItem.name}! Starting bid: ${Math.floor(newItem.baseValue * 0.3)} coins!`);
  }, [gameOver]);

  const placeBid = useCallback((amount: number) => {
    if (!auction.isActive || !auction.currentItem) return;
    
    const newBid = auction.currentBid + amount;
    if (newBid > coins) {
      setMessage("💸 You're too broke for that bid!");
      return;
    }

    setAuction(prev => ({
      ...prev,
      currentBid: newBid,
      highestBidder: "You",
      timeLeft: Math.min(prev.timeLeft + 2, 10),
    }));
    setMessage(`🎯 You bid ${newBid} coins! The heat is on!`);
  }, [auction.isActive, auction.currentItem, auction.currentBid, coins]);

  const revealItem = useCallback((itemId: number) => {
    setOwnedItems(prev => prev.map(item => {
      if (item.id === itemId && !item.revealed) {
        const profit = item.actualValue - item.purchasePrice;
        setTotalProfit(p => p + profit);
        setCoins(c => c + item.actualValue);
        return { ...item, revealed: true };
      }
      return item;
    }));
  }, []);

  // Auction timer
  useEffect(() => {
    if (!auction.isActive) return;

    auctionTimerRef.current = setInterval(() => {
      setAuction(prev => {
        if (prev.timeLeft <= 1) {
          // Auction ended
          if (prev.highestBidder === "You" && prev.currentItem) {
            setCoins(c => c - prev.currentBid);
            setOwnedItems(items => [...items, {
              ...prev.currentItem!,
              purchasePrice: prev.currentBid,
              revealed: false,
            }]);
            setMessage(`🏆 SOLD to YOU for ${prev.currentBid} coins! Click to reveal its true value!`);
          } else if (prev.highestBidder) {
            setMessage(`😤 ${prev.highestBidder} snatched it for ${prev.currentBid} coins!`);
          } else {
            setMessage(`😴 No bids? This item goes unsold...`);
          }
          
          setItemsAuctioned(i => {
            const newCount = i + 1;
            if (newCount >= 10) {
              setGameOver(true);
              setMessage("🎉 GAME OVER! The auction house is closing!");
            }
            return newCount;
          });
          
          return { ...prev, timeLeft: 0, isActive: false };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (auctionTimerRef.current) clearInterval(auctionTimerRef.current);
    };
  }, [auction.isActive]);

  // AI bidding
  useEffect(() => {
    if (!auction.isActive || !auction.currentItem) return;

    const scheduleAiBid = () => {
      const delay = 500 + Math.random() * 2000;
      aiBidTimerRef.current = setTimeout(() => {
        if (!auction.isActive) return;
        
        const bidder = AI_BIDDERS[Math.floor(Math.random() * AI_BIDDERS.length)];
        const maxBid = auction.currentItem!.baseValue * bidder.maxMultiplier;
        
        if (Math.random() < bidder.aggression && auction.currentBid < maxBid) {
          const increment = Math.floor(5 + Math.random() * 20);
          setAuction(prev => {
            if (!prev.isActive || prev.highestBidder === bidder.name) return prev;
            const newBid = prev.currentBid + increment;
            if (newBid > maxBid) return prev;
            setMessage(`🤖 ${bidder.name} bids ${newBid} coins!`);
            return {
              ...prev,
              currentBid: newBid,
              highestBidder: bidder.name,
            };
          });
        }
        
        if (auction.isActive) scheduleAiBid();
      }, delay);
    };

    scheduleAiBid();

    return () => {
      if (aiBidTimerRef.current) clearTimeout(aiBidTimerRef.current);
    };
  }, [auction.isActive, auction.currentItem]);

  // Start next auction
  useEffect(() => {
    if (!auction.isActive && !gameOver && itemsAuctioned < 10) {
      const timer = setTimeout(startNewAuction, 3000);
      return () => clearTimeout(timer);
    }
  }, [auction.isActive, gameOver, itemsAuctioned, startNewAuction]);

  // Initial auction
  useEffect(() => {
    const timer = setTimeout(startNewAuction, 1500);
    return () => clearTimeout(timer);
  }, []);

  const renderPixelArt = (pixels: string[][], size: number = 8) => {
    return (
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateRows: `repeat(${pixels.length}, ${size}px)`,
          gap: '1px',
        }}
      >
        {pixels.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '1px' }}>
            {row.map((color, j) => (
              <div
                key={j}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color || 'transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const restartGame = () => {
    setCoins(500);
    setOwnedItems([]);
    setItemsAuctioned(0);
    setTotalProfit(0);
    setGameOver(false);
    setAuction({
      currentItem: null,
      currentBid: 0,
      highestBidder: "",
      timeLeft: 0,
      isActive: false,
    });
    setMessage("Welcome back to the Pixel Auction House! 🎨");
    setTimeout(startNewAuction, 1500);
  };

  return (
    <FeatureWrapper day={437} title="Pixel Auction House" emoji="🏛️">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#ffd700' }}>💰 {coins}</div>
            <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Coins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Total Profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{itemsAuctioned}/10</div>
            <div className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Items</div>
          </div>
        </div>

        {/* Message Banner */}
        <div 
          className="text-center p-3 mb-6 rounded-lg font-medium"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderLeft: '4px solid var(--color-accent)',
            color: 'var(--color-text)',
          }}
        >
          {message}
        </div>

        {/* Auction Block */}
        <div 
          className="p-6 rounded-xl mb-6 relative overflow-hidden"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            border: auction.isActive ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
          }}
        >
          {auction.isActive && auction.currentItem ? (
            <>
              {/* Timer */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-3xl font-bold" style={{ 
                  color: auction.timeLeft <= 3 ? '#ef4444' : 'var(--color-text)',
                  animation: auction.timeLeft <= 3 ? 'pulse 0.5s infinite' : 'none',
                }}>
                  ⏱️ {auction.timeLeft}s
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Pixel Art Display */}
                <div 
                  className="p-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#1a1a2e', minWidth: '150px', minHeight: '150px' }}
                >
                  {renderPixelArt(auction.currentItem.pixels, 16)}
                </div>

                {/* Item Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text)' }}
                  >
                    {auction.currentItem.name}
                  </h2>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
                    Estimated value: ~{auction.currentItem.baseValue} coins (but who knows? 🤷)
                  </p>

                  <div className="text-3xl font-bold mb-2" style={{ color: '#ffd700' }}>
                    Current Bid: {auction.currentBid} coins
                  </div>
                  <div className="mb-4" style={{ 
                    color: auction.highestBidder === 'You' ? '#22c55e' : '#ef4444' 
                  }}>
                    {auction.highestBidder ? 
                      `Leading: ${auction.highestBidder} ${auction.highestBidder === 'You' ? '✨' : '😤'}` : 
                      'No bids yet!'}
                  </div>

                  {/* Bid Buttons */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {[10, 25, 50, 100].map(amount => (
                      <button
                        key={amount}
                        onClick={() => placeBid(amount)}
                        disabled={auction.currentBid + amount > coins}
                        className="px-4 py-2 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'white',
                        }}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : gameOver ? (
            <div className="text-center py-8">
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text)' }}
              >
                🎉 Auction Complete!
              </h2>
              <p className="text-xl mb-2" style={{ color: 'var(--color-text-dim)' }}>
                You collected {ownedItems.length} items
              </p>
              <p className="text-2xl font-bold mb-6" style={{ 
                color: totalProfit >= 0 ? '#22c55e' : '#ef4444' 
              }}>
                Final Profit: {totalProfit >= 0 ? '+' : ''}{totalProfit} coins
              </p>
              <button
                onClick={restartGame}
                className="btn-primary px-8 py-3 text-lg"
              >
                🔄 Play Again
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4 animate-bounce">🔨</div>
              <p style={{ color: 'var(--color-text-dim)' }}>Next item coming up...</p>
            </div>
          )}
        </div>

        {/* Owned Items */}
        {ownedItems.length > 0 && (
          <div>
            <h3 
              className="text-xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text)' }}
            >
              📦 Your Collection ({ownedItems.length} items)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ownedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => !item.revealed && revealItem(item.id)}
                  className={`p-4 rounded-lg text-center transition-all ${!item.revealed ? 'cursor-pointer hover:scale-105' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: item.revealed ? `2px solid ${RARITY_COLORS[item.rarity]}` : '2px solid var(--color-border)',
                  }}
                >
                  <div 
                    className="p-3 rounded mb-2 flex justify-center"
                    style={{ backgroundColor: '#1a1a2e' }}
                  >
                    {renderPixelArt(item.pixels, 8)}
                  </div>
                  <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                    {item.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Paid: {item.purchasePrice} 💰
                  </div>
                  
                  {item.revealed ? (
                    <div className="mt-2">
                      <div 
                        className="text-xs font-bold px-2 py-1 rounded mb-1"
                        style={{ 
                          backgroundColor: RARITY_COLORS[item.rarity],
                          color: 'white',
                        }}
                      >
                        {item.rarity.toUpperCase()}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                        {item.hiddenProperty}
                      </div>
                      <div 
                        className="font-bold mt-1"
                        style={{ 
                          color: item.actualValue >= item.purchasePrice ? '#22c55e' : '#ef4444' 
                        }}
                      >
                        Worth: {item.actualValue} ({item.actualValue >= item.purchasePrice ? '+' : ''}{item.actualValue - item.purchasePrice})
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 text-xs animate-pulse"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      ✨ Click to reveal!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div 
          className="mt-8 p-4 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-dim)' }}
        >
          <strong style={{ color: 'var(--color-text)' }}>How to Play:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Items appear every few seconds - bid fast or lose out!</li>
            <li>AI bidders compete against you with varying aggression</li>
            <li>Won items have hidden properties - click to reveal their TRUE value</li>
            <li>Some items are treasures 💎, others are complete trash 🗑️</li>
            <li>10 items total - maximize your profit!</li>
          </ul>
        </div>
      </div>
    </FeatureWrapper>
  );
}