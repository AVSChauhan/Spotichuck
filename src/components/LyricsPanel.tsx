import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Music, X, AlertTriangle } from "lucide-react";
import { Track } from "../types";

interface LyricLine {
  text: string;
  time: number;
}

interface LyricsPanelProps {
  currentTrack: Track | null;
  currentTime: number;
  onClose: () => void;
  playMode: "preview" | "youtube";
}

export default function LyricsPanel({ currentTrack, currentTime, onClose, playMode }: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics dynamically when song changes
  useEffect(() => {
    if (!currentTrack) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          title: currentTrack.title,
          artist: currentTrack.artist,
          durationSeconds: playMode === "preview" ? "30" : "180", // 3 mins limit for full song lyrics estimate
        }).toString();

        const response = await fetch(`/api/lyrics?${query}`);
        if (!response.ok) {
          throw new Error("Unable to fetch synchronized lyrics");
        }
        const data = await response.json();
        setLyrics(data.lyrics || []);
      } catch (err: any) {
        console.error("Error loading lyrics:", err);
        setError("Synchronized lyrics are busy cueing up. Try again in a brief second!");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentTrack, playMode]);

  // Find currently active lyric line index
  const activeIndex = lyrics.reduce((acc, line, idx) => {
    if (currentTime >= line.time) {
      return idx;
    }
    return acc;
  }, -1);

  // Auto-scroll lyrics to keep the active line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212] flex items-center justify-center p-8 text-neutral-400 font-sans">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto text-neutral-600 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-1">No Song Jamming</h3>
          <p className="text-sm">Select a song to scroll dynamic scrolling lyrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1e1e1e] to-[#121212] text-white font-sans overflow-hidden border-l border-[#282828] relative animate-fade-in">
      {/* Header Panel */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#282828] flex-shrink-0 z-10 backdrop-blur-md bg-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#1DB954]/20 text-[#1ed760] text-[10px] font-extrabold tracking-widest uppercase rounded-full border border-[#1DB954]/10 flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" fill="currentColor" />
            <span>AI Live Karaoke</span>
          </div>
          <span className="text-sm font-semibold truncate text-white ml-2">
            Lyrics: {currentTrack.title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Close lyrics"
        >
          <X className="w-5 h-5 animate-none" />
        </button>
      </div>

      {/* Main Lyrics Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-8 py-24 flex flex-col gap-10 scrollbar-none"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#1DB954]">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-bold tracking-wider uppercase text-neutral-400 animate-pulse">
              Gemini is syncing lyrics...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400 animate-none">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h4 className="text-base font-bold text-white mb-2">Syncing Handoff</h4>
            <p className="text-sm max-w-sm leading-relaxed mb-6">
              Gemini is creating synchronization data for this song.
            </p>
            <button
              onClick={() => {
                // Retry loading
                setLyrics([]);
                setLoading(true);
                const query = new URLSearchParams({
                  title: currentTrack.title,
                  artist: currentTrack.artist,
                  durationSeconds: playMode === "preview" ? "30" : "180",
                }).toString();
                fetch(`/api/lyrics?${query}`)
                  .then((r) => r.json())
                  .then((d) => setLyrics(d.lyrics || []))
                  .catch(() => setError("Try again!"))
                  .finally(() => setLoading(false));
              }}
              className="px-6 py-2 bg-[#1DB954] text-black font-extrabold text-xs tracking-widest uppercase rounded-full hover:bg-[#1ed760] transition-all cursor-pointer shadow-lg shadow-[#1DB954]/20 active:scale-95"
            >
              Re-Sync Now
            </button>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <p>Instruments playing. No vocal lyric parts found.</p>
          </div>
        ) : (
          lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPassed = index < activeIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`transition-all duration-300 text-left origin-left leading-relaxed py-1 select-text ${
                  isActive
                    ? "text-3xl sm:text-4xl font-extrabold text-[#1ed760] scale-100 filter drop-shadow-[0_4px_12px_rgba(29,185,84,0.3)]"
                    : isPassed
                    ? "text-xl sm:text-2xl font-bold text-neutral-400/90 scale-95"
                    : "text-xl sm:text-2xl font-bold text-neutral-600 scale-95 hover:text-neutral-500 cursor-pointer"
                }`}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Banner */}
      <div className="p-4 bg-black/60 border-t border-neutral-900/60 text-center text-[10px] text-neutral-500 font-medium scale-100 flex-shrink-0">
        AI-enabled scrolling logs synchronized to your active playback stream.
      </div>
    </div>
  );
}
