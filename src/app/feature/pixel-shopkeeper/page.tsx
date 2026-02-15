"use client";

import { useState, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface InventoryItem {
  id: number;
  name: string;
  emoji: string;
  description: string;
}

interface Customer {
  id: number;
  name: string;
  request: string;
  patience: number;
  maxPatience: number;
  sprite: string;
}

interface SaleLog {
  id: number;
  customer: string;
  wanted: string;
  sold: string | null;
  success: boolean;
}

const WEIRD_INVENTORY: Omit<InventoryItem, "id">[] = [
  { name: "Bottled Regret", emoji: "🫙", description: "Vintage 2019, slightly fermented" },
  { name: "Yesterday's Dreams", emoji: "💭", description: "May have expired" },
  { name: "Spare Anxiety", emoji: "😰", description: "Buy one, get three free" },
  { name: "Forgotten Password", emoji: "🔐", description: "Works on everything except what you need" },
  { name: "Monday Morning Energy", emoji: "☕", description: "Warning: mostly disappointment" },
  { name: "Existential Dread", emoji: "🌀", description: "Small, medium, or crushing?" },
  { name: "WiFi Signal (Rural)", emoji: "📶", description: "One bar, take it or leave it" },
  { name: "Awkward Silence", emoji: "🤐", description: "Premium grade, elevator certified" },
  { name: "Lost Socks", emoji: "🧦", description: "Assorted sizes, no pairs" },
  { name: "Microwave Sounds", emoji: "📢", description: "MMMMMMMM... BEEP BEEP BEEP" },
  { name: "Cat Approval", emoji: "🐱", description: "Non-transferable, may be revoked" },
  { name: "Leftover Motivation", emoji: "⚡", description: "Use before January 3rd" },
  { name: "Vague Sense of Purpose", emoji: "🎯", description: "Assembly required" },
  { name: "Browser Tab (47 of 300)", emoji: "📑", description: "You'll read it later" },
  { name: "3 AM Inspiration", emoji: "💡", description: "Terrible in daylight" },
  { name: "Unread Emails", emoji: "📧", description: "Bulk discount available" },
  { name: "Missed Opportunity", emoji: "🚪", description: "Slightly used" },
  { name: "Childhood Wonder", emoji: "✨", description: "Rare find, handle with care" },
  { name: "Comfortable Silence", emoji: "🤫", description: "Best shared with a friend" },
  { name: "That One Song", emoji: "🎵", description: "You can't remember the name" },
];

const CUSTOMER_REQUESTS = [
  "bottled regret",
  "yesterday's dreams",
  "a sense of purpose",
  "the password I forgot",
  "my will to continue",
  "that feeling you get before a sneeze",
  "a jar of déjà vu",
  "the last braincell",
  "my youth back",
  "tomorrow's lottery numbers",
  "a valid excuse",
  "the audacity",
  "some peace and quiet",
  "the thing I came here for",
  "closure",
  "serotonin, any amount",
  "the confidence of a mediocre man",
  "my plants' respect",
];

const CUSTOMER_NAMES = [
  "Mysterious Cloaked Figure",
  "Karen (Level 50)",
  "Guy Who Looks Lost",
  "Your Old High School Friend",
  "Someone's Disappointed Dad",
  "The Algorithm",
  "A Suspiciously Normal Person",
  "That One Neighbor",
  "A Time Traveler (Maybe)",
  "Three Raccoons in a Trenchcoat",
];

const CUSTOMER_SPRITES = ["👤", "🧙", "👻", "🤖", "👽", "🦝", "🧛", "👁️", "🎭", "🌚"];

export default function PixelShopkeeper() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesLog, setSalesLog] = useState<SaleLog[]>([]);
  const [coins, setCoins] = useState(0);
  const [reputation, setReputation] = useState(50);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogue, setDialogue] = useState<string>("Welcome to The Peculiar Emporium! Stock your shelves and serve your... interesting clientele.");
  const [isOpen, setIsOpen] = useState(true);
  const nextItemId = useRef<number>(1);
  const nextCustomerId = useRef<number>(1);
  const nextSaleId = useRef<number>(1);
  const patienceInterval = useRef<NodeJS.Timeout | null>(null);

  const stockShelf = () => {
    if (inventory.length >= 12) {
      setDialogue("Your shelves are full! Sell something first, you hoarder.");
      return;
    }
    const randomItem = WEIRD_INVENTORY[Math.floor(Math.random() * WEIRD_INVENTORY.length)];
    const newItem: InventoryItem = {
      id: nextItemId.current++,
      ...randomItem,
    };
    setInventory((prev) => [...prev, newItem]);
    setDialogue(`You mysteriously acquired: ${newItem.emoji} ${newItem.name}`);
  };

  const summonCustomer = () => {
    if (customer) {
      setDialogue("You already have a customer! Don't be rude.");
      return;
    }
    const request = CUSTOMER_REQUESTS[Math.floor(Math.random() * CUSTOMER_REQUESTS.length)];
    const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    const sprite = CUSTOMER_SPRITES[Math.floor(Math.random() * CUSTOMER_SPRITES.length)];
    const newCustomer: Customer = {
      id: nextCustomerId.current++,
      name,
      request,
      patience: 100,
      maxPatience: 100,
      sprite,
    };
    setCustomer(newCustomer);
    setDialogue(`${sprite} ${name} walks in... "Do you have ${request}?"`);
    setSelectedItem(null);
  };

  useEffect(() => {
    if (customer && isOpen) {
      patienceInterval.current = setInterval(() => {
        setCustomer((prev) => {
          if (!prev) return null;
          const newPatience = prev.patience - 2;
          if (newPatience <= 0) {
            setDialogue(`${prev.sprite} ${prev.name} storms out! "Worst shop ever!"`);
            setReputation((r) => Math.max(0, r - 10));
            setSalesLog((log) => [
              {
                id: nextSaleId.current++,
                customer: prev.name,
                wanted: prev.request,
                sold: null,
                success: false,
              },
              ...log,
            ]);
            return null;
          }
          return { ...prev, patience: newPatience };
        });
      }, 500);
    }
    return () => {
      if (patienceInterval.current) {
        clearInterval(patienceInterval.current);
      }
    };
  }, [customer, isOpen]);

  const sellItem = (item: InventoryItem) => {
    if (!customer) {
      setDialogue("No one to sell to! Are you talking to the shelves again?");
      return;
    }

    const itemLower = item.name.toLowerCase();
    const requestLower = customer.request.toLowerCase();
    
    // Check for match (loose matching for comedy)
    const isMatch = itemLower.includes(requestLower.split(" ")[0]) || 
                    requestLower.includes(itemLower.split(" ")[0]) ||
                    Math.random() < 0.3; // Sometimes they just accept it

    if (isMatch || customer.patience < 30) {
      // Success!
      const coinReward = Math.floor(10 + reputation / 5);
      setCoins((c) => c + coinReward);
      setReputation((r) => Math.min(100, r + 5));
      setDialogue(`${customer.sprite} "${isMatch ? "Perfect!" : "Close enough..."}" (+${coinReward} coins)`);
      setSalesLog((log) => [
        {
          id: nextSaleId.current++,
          customer: customer.name,
          wanted: customer.request,
          sold: item.name,
          success: true,
        },
        ...log,
      ]);
    } else {
      setDialogue(`${customer.sprite} "That's not what I asked for..." *patience decreasing*`);
      setCustomer((prev) => prev ? { ...prev, patience: prev.patience - 20 } : null);
      return; // Don't remove item or customer
    }

    // Remove sold item and clear customer
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setCustomer(null);
    setSelectedItem(null);
  };

  const convinceCustomer = () => {
    if (!customer || !selectedItem) {
      setDialogue("Select an item first, then try to convince them!");
      return;
    }

    const convinceRoll = Math.random() * 100;
    const successChance = 20 + reputation / 2;

    if (convinceRoll < successChance) {
      const coinReward = Math.floor(15 + reputation / 3);
      setCoins((c) => c + coinReward);
      setReputation((r) => Math.min(100, r + 3));
      setDialogue(`${customer.sprite} "You know what? You've convinced me!" (+${coinReward} coins)`);
      setSalesLog((log) => [
        {
          id: nextSaleId.current++,
          customer: customer.name,
          wanted: customer.request,
          sold: selectedItem.name,
          success: true,
        },
        ...log,
      ]);
      setInventory((prev) => prev.filter((i) => i.id !== selectedItem.id));
      setCustomer(null);
      setSelectedItem(null);
    } else {
      setDialogue(`${customer.sprite} "Nice try, but no." *stares judgmentally*`);
      setCustomer((prev) => prev ? { ...prev, patience: prev.patience - 15 } : null);
    }
  };

  return (
    <FeatureWrapper day={442} title="Pixel Shopkeeper" emoji="🏪">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex gap-6">
            <span className="text-lg">💰 {coins} coins</span>
            <span className="text-lg">⭐ {reputation}% reputation</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-lg font-bold ${isOpen ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {isOpen ? "🔓 OPEN" : "🔒 CLOSED"}
          </button>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Shop Counter */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              🛒 The Counter
            </h2>
            
            {/* Dialogue Box */}
            <div className="p-3 rounded-lg mb-3 min-h-16" style={{ backgroundColor: "var(--color-bg)" }}>
              <p style={{ color: "var(--color-text)" }}>{dialogue}</p>
            </div>

            {/* Customer Area */}
            <div className="p-3 rounded-lg mb-3 min-h-24 flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
              {customer ? (
                <div className="text-center">
                  <div className="text-5xl mb-2 animate-bounce">{customer.sprite}</div>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>{customer.name}</p>
                  <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>Wants: {customer.request}</p>
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${customer.patience}%`,
                        backgroundColor: customer.patience > 50 ? "#22c55e" : customer.patience > 25 ? "#eab308" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>Patience: {customer.patience}%</p>
                </div>
              ) : (
                <p style={{ color: "var(--color-text-dim)" }}>No customer yet...</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={summonCustomer} className="btn-primary flex-1" disabled={!isOpen || !!customer}>
                🔔 Next Customer
              </button>
              <button onClick={stockShelf} className="btn-secondary flex-1">
                📦 Stock Shelf
              </button>
            </div>
            {selectedItem && customer && (
              <button onClick={convinceCustomer} className="btn-primary w-full mt-2">
                🗣️ Convince them to buy {selectedItem.emoji} {selectedItem.name}
              </button>
            )}
          </div>

          {/* Inventory Shelves */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              📦 Your Peculiar Inventory
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, index) => {
                const item = inventory[index];
                return (
                  <button
                    key={index}
                    onClick={() => item && (selectedItem?.id === item.id ? setSelectedItem(null) : setSelectedItem(item))}
                    onDoubleClick={() => item && sellItem(item)}
                    className={`p-2 rounded-lg border-2 min-h-20 flex flex-col items-center justify-center transition-all ${
                      selectedItem?.id === item?.id ? "ring-2 ring-yellow-400" : ""
                    }`}
                    style={{
                      borderColor: item ? "var(--color-accent)" : "var(--color-border)",
                      backgroundColor: item ? "var(--color-bg)" : "transparent",
                      opacity: item ? 1 : 0.5,
                    }}
                    disabled={!item}
                  >
                    {item ? (
                      <>
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="text-xs text-center mt-1" style={{ color: "var(--color-text)" }}>
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "var(--color-text-dim)" }}>Empty</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedItem && (
              <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: "var(--color-bg)" }}>
                <p className="font-bold">{selectedItem.emoji} {selectedItem.name}</p>
                <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>{selectedItem.description}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-accent)" }}>
                  Double-click to sell {customer ? "to customer" : "(need a customer first!)"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Log */}
        <div className="p-4 rounded-lg border-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            📜 Today&apos;s Sales Log
          </h2>
          <div className="max-h-32 overflow-y-auto">
            {salesLog.length === 0 ? (
              <p style={{ color: "var(--color-text-dim)" }}>No sales yet. Time to hustle!</p>
            ) : (
              <div className="space-y-1">
                {salesLog.slice(0, 10).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex justify-between text-sm p-1 rounded"
                    style={{ backgroundColor: sale.success ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" }}
                  >
                    <span>
                      {sale.success ? "✅" : "❌"} {sale.customer}
                    </span>
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Wanted: {sale.wanted} → {sale.sold || "Left empty-handed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 rounded-lg text-center text-sm" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}>
          <p>📦 Stock shelves with weird inventory • 🔔 Welcome customers • 🖱️ Click items to select, double-click to sell</p>
          <p>🗣️ Try to convince customers to buy something else • ⭐ Build your reputation!</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}