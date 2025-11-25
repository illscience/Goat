"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface MemoryItem {
  id: string;
  name: string;
  x: number;
  y: number;
  emoji: string;
}

interface Room {
  id: string;
  name: string;
  theme: string;
  bgColor: string;
  items: MemoryItem[];
}

const ROOM_THEMES = {
  kitchen: {
    name: "Kitchen",
    bgColor: "bg-orange-50",
    suggestions: ["🍎 Apple", "🥖 Bread", "☕ Coffee", "🧈 Butter", "🍳 Pan", "🔪 Knife", "🧊 Ice", "🍋 Lemon"],
  },
  library: {
    name: "Library",
    bgColor: "bg-amber-50",
    suggestions: ["📚 Books", "🪶 Quill", "🕯️ Candle", "📜 Scroll", "🗿 Bust", "🌐 Globe", "⏰ Clock", "🎻 Violin"],
  },
  garden: {
    name: "Garden",
    bgColor: "bg-green-50",
    suggestions: ["🌹 Rose", "🌳 Tree", "🦋 Butterfly", "🌻 Sunflower", "🪴 Plant", "🐝 Bee", "💧 Water", "🍄 Mushroom"],
  },
  bedroom: {
    name: "Bedroom",
    bgColor: "bg-blue-50",
    suggestions: ["🛏️ Bed", "🪞 Mirror", "👔 Closet", "💡 Lamp", "🖼️ Picture", "⏰ Alarm", "📖 Book", "🧸 Teddy"],
  },
};

export default function MemoryPalaceBuilder() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: "kitchen", name: "Kitchen", theme: "kitchen", bgColor: ROOM_THEMES.kitchen.bgColor, items: [] },
    { id: "library", name: "Library", theme: "library", bgColor: ROOM_THEMES.library.bgColor, items: [] },
    { id: "garden", name: "Garden", theme: "garden", bgColor: ROOM_THEMES.garden.bgColor, items: [] },
    { id: "bedroom", name: "Bedroom", theme: "bedroom", bgColor: ROOM_THEMES.bedroom.bgColor, items: [] },
  ]);
  const [currentRoom, setCurrentRoom] = useState<string>("kitchen");
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>("");
  const [isPlacing, setIsPlacing] = useState(false);

  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacing || !selectedSuggestion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const [emoji, name] = selectedSuggestion.split(" ");
    const newItem: MemoryItem = {
      id: Date.now().toString(),
      name,
      emoji,
      x,
      y,
    };

    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === currentRoom
          ? { ...room, items: [...room.items, newItem] }
          : room
      )
    );

    setIsPlacing(false);
    setSelectedSuggestion("");
  };

  const removeItem = (roomId: string, itemId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { ...room, items: room.items.filter(item => item.id !== itemId) }
          : room
      )
    );
  };

  const clearRoom = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { ...room, items: [] }
          : room
      )
    );
  };

  const currentRoomData = rooms.find(r => r.id === currentRoom);
  const currentTheme = ROOM_THEMES[currentRoom as keyof typeof ROOM_THEMES];

  return (
    <FeatureWrapper day={360} title="Memory Palace Builder" emoji="🏛️">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
            Build your digital memory palace! Place objects in rooms to remember anything.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Based on the ancient "Method of Loci" - because even Cicero would've used an app if he could.
          </p>
        </div>

        {/* Room Selector */}
        <div className="flex gap-2 justify-center flex-wrap">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentRoom === room.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {room.name} ({room.items.length})
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Room View */}
          <div className="lg:col-span-2">
            <div
              className={`relative h-[500px] rounded-lg border-2 transition-all ${
                isPlacing ? "cursor-crosshair border-blue-500" : "border-gray-300"
              } ${currentRoomData?.bgColor}`}
              onClick={handleRoomClick}
            >
              {currentRoomData?.items.map(item => (
                <div
                  key={item.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  <div className="relative">
                    <div className="text-4xl animate-bounce-slow">{item.emoji}</div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(currentRoom, item.id);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {isPlacing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg animate-pulse">
                    Click anywhere to place {selectedSuggestion}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
              <h3 className="font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                Quick Add Objects
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {currentTheme.suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSelectedSuggestion(suggestion);
                      setIsPlacing(true);
                    }}
                    className="p-2 text-sm rounded hover:bg-gray-200 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
              <h3 className="font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                Room Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-dim)" }}>Objects placed:</span>
                  <span className="font-medium">{currentRoomData?.items.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-dim)" }}>Total objects:</span>
                  <span className="font-medium">
                    {rooms.reduce((sum, room) => sum + room.items.length, 0)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => clearRoom(currentRoom)}
                className="w-full mt-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear This Room
              </button>
            </div>

            <div className="rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-2">💡 Memory Tip</h4>
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Make your placements memorable! Put items in unusual spots or create funny scenes. 
                The weirder, the better for recall!
              </p>
            </div>
          </div>
        </div>

        {/* Memory List */}
        <div className="rounded-lg p-6" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Your Memory Journey
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="space-y-2">
                <h4 className="font-medium">{room.name}</h4>
                {room.items.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {room.items.map((item, index) => (
                      <span key={item.id} className="text-sm">
                        {index + 1}. {item.emoji} {item.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                    Empty room
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </FeatureWrapper>
  );
}