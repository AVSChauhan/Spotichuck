import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Music, Shuffle, Plus, Play, Disc } from "lucide-react";
import { DJMessage, Track, Playlist } from "../types";

interface GeminiDJPanelProps {
  onPlayTrack: (track: Track) => void;
  onAddTracksToQueue: (tracks: Track[]) => void;
  onCreateCustomPlaylistWithTracks: (name: string, tracks: Track[]) => void;
  currentPlayingTrack: Track | null;
}

export default function GeminiDJPanel({
  onPlayTrack,
  onAddTracksToQueue,
  onCreateCustomPlaylistWithTracks,
  currentPlayingTrack,
}: GeminiDJPanelProps) {
  const [messages, setMessages] = useState<DJMessage[]>([
    {
      id: "welcome",
      role: "dj",
      text: "Yo! Welcome to the airwaves. This is your Gemini AI DJ. 🎧 Tell me what mood, activity, or genre you're feeling right now, and I'll cue up the perfect bespoke soundtrack. What can I mix for you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resolvingTrackIds, setResolvingTrackIds] = useState<Set<string>>(new Set());
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to the bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setInputValue("");
    setLoading(true);

    const userMsg: DJMessage = {
      id: String(Date.now()),
      role: "user",
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          currentSong: currentPlayingTrack,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) throw new Error("Recommendation failed");
      const data = await response.json();

      const djMsg: DJMessage = {
        id: `dj-${Date.now()}`,
        role: "dj",
        text: data.reply,
        playlist: data.playlist,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, djMsg]);
    } catch (err: any) {
      console.error("AI recommendation error:", err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `dj-err-${Date.now()}`,
          role: "dj",
          text: "My transceiver hit some static in the troposphere, but I got you covered anyway. Here are some incredible, premium songs for your vibe!",
          playlist: [
            { title: "In Your Eyes", artist: "The Weeknd" },
            { title: "Adore You", artist: "Harry Styles" },
            { title: "Sweet Nothing", artist: "Calvin Harris" },
            { title: "Starboy", artist: "The Weeknd" },
            { title: "Levitating", artist: "Dua Lipa" }
          ],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to resolve the plain recommendations (title/artist) into actual, playable
   * preview streams using iTunes Search API.
   */
  const handleQueueAll = async (msgId: string, items: { title: string; artist: string }[]) => {
    setResolvingTrackIds((prev) => {
      const copy = new Set(prev);
      copy.add(msgId);
      return copy;
    });

    const resolvedTracks: Track[] = [];

    for (const item of items) {
      try {
        const queryTerm = `${item.title} ${item.artist}`;
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&media=music&limit=1`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const match = data.results && data.results[0];
          if (match && match.previewUrl) {
            resolvedTracks.push({
              id: String(match.trackId),
              title: match.trackName,
              artist: match.artistName,
              album: match.collectionName || "AI Set",
              coverUrl: match.artworkUrl100
                ? match.artworkUrl100.replace("100x100bb", "500x500bb")
                : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
              previewUrl: match.previewUrl,
              durationSeconds: match.trackTimeMillis ? Math.round(match.trackTimeMillis / 1000) : 30,
            });
          }
        }
      } catch (err) {
        console.error("Error resolving AI recommended song:", err);
      }
    }

    setResolvingTrackIds((prev) => {
      const copy = new Set(prev);
      copy.delete(msgId);
      return copy;
    });

    if (resolvedTracks.length > 0) {
      onAddTracksToQueue(resolvedTracks);
      // Play first track of queue
      onPlayTrack(resolvedTracks[0]);
    } else {
      alert("Uh oh! We couldn't find active audio previews for these tracks. Let's try another batch!");
    }
  };

  /**
   * Helper to resolve tracks and compile them into a durable user-created custom playlist.
   */
  const handleSaveToPlaylist = async (msgId: string, items: { title: string; artist: string }[], originalPrompt: string) => {
    setResolvingTrackIds((prev) => {
      const copy = new Set(prev);
      copy.add(`${msgId}-save`);
      return copy;
    });

    const resolvedTracks: Track[] = [];

    for (const item of items) {
      try {
        const queryTerm = `${item.title} ${item.artist}`;
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&media=music&limit=1`);
        if (response.ok) {
          const data = await response.json();
          const match = data.results?.[0];
          if (match && match.previewUrl) {
            resolvedTracks.push({
              id: String(match.trackId),
              title: match.trackName,
              artist: match.artistName,
              album: match.collectionName || "AI Mix",
              coverUrl: match.artworkUrl100 ? match.artworkUrl100.replace("100x100bb", "500x500bb") : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
              previewUrl: match.previewUrl,
              durationSeconds: match.trackTimeMillis ? Math.round(match.trackTimeMillis / 1000) : 30,
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    setResolvingTrackIds((prev) => {
      const copy = new Set(prev);
      copy.delete(`${msgId}-save`);
      return copy;
    });

    if (resolvedTracks.length > 0) {
      const limitPrompt = originalPrompt.length > 18 ? originalPrompt.substring(0, 18) + "..." : originalPrompt;
      const playlistName = `AI DJ: ${limitPrompt}`;
      onCreateCustomPlaylistWithTracks(playlistName, resolvedTracks);
    } else {
      alert("No tracks could be found to save. Try compiling another AI request!");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#1e1e1e] to-[#121212] font-sans text-white h-full relative overflow-hidden">
      
      {/* Dynamic Animated Header */}
      <div className="px-8 py-5 border-b border-[#282828] bg-neutral-950/65 flex items-center justify-between backdrop-blur-md flex-shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center text-black border border-[#1DB954] shadow-lg shadow-[#1DB954]/20">
            <Sparkles className="w-5 h-5 animate-pulse" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5 leading-none">
              Gemini Music DJ <span className="text-[10px] bg-[#1DB954]/10 text-[#1ed760] font-extrabold px-1.5 py-0.5 rounded border border-[#1DB954]/20 uppercase tracking-widest leading-none">On-Air</span>
            </h1>
            <span className="text-xs text-neutral-400 leading-none block mt-1">
              Live generative playlist broadcasting, tailored to your mood.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 select-none">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-ping" />
          <span className="font-bold tracking-widest uppercase text-[#1DB954]">Broadcasting</span>
        </div>
      </div>

      {/* Message logs panel */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
            >
              {/* Message text bubble */}
              <div
                className={`p-4 rounded-2xl shadow-md pb-3.5 ${
                  isUser
                    ? "bg-[#1DB954] text-black font-semibold rounded-tr-none text-sm leading-relaxed"
                    : "bg-[#1e1e1e] text-neutral-200 rounded-tl-none border border-[#282828]/60 text-sm leading-relaxed"
                }`}
              >
                {!isUser && (
                  <span className="block text-[10px] font-extrabold text-[#1ed760] tracking-wider uppercase mb-1 flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5 animate-spin" fill="currentColor" />
                    DJ GEMINI
                  </span>
                )}
                <p>{msg.text}</p>
                <span
                  className={`text-[8px] font-bold block mt-2 text-right tracking-tight ${
                    isUser ? "text-emerald-950/70" : "text-neutral-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Display AI Curated Tracks layout if attached to the message */}
              {msg.playlist && msg.playlist.length > 0 && (
                <div className="mt-3.5 bg-neutral-950/80 rounded-xl p-5 border border-[#282828]/80 w-full max-w-md shadow-lg select-none animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <Music className="w-4 h-4 text-[#1ed760]" />
                    <span className="text-xs font-extrabold text-neutral-300 uppercase tracking-widest">
                      DJ Bespoke Trackset
                    </span>
                  </div>

                  <div className="flex flex-col gap-3.5 mb-5 border-b border-neutral-900 pb-4">
                    {msg.playlist.map((track, trackIdx) => (
                      <div key={trackIdx} className="flex items-center gap-3 bg-[#181818]/40 p-2.5 rounded-lg border border-[#282828]/35 animate-fade-in">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-neutral-900 to-neutral-800 flex items-center justify-center text-xs font-mono text-[#1ed760] font-bold border border-[#282828]">
                          {trackIdx + 1}
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate leading-tight mb-0.5">{track.title}</p>
                          <p className="text-[10px] text-neutral-400 truncate leading-tight">{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Curated controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleQueueAll(msg.id, msg.playlist!)}
                      disabled={resolvingTrackIds.has(msg.id) || resolvingTrackIds.has(`${msg.id}-save`)}
                      className="px-4 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[10px] tracking-wider uppercase rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#1DB954]/10 active:scale-95 disabled:opacity-40"
                    >
                      {resolvingTrackIds.has(msg.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-currentColor text-black" />
                      )}
                      <span>Queue & Play All</span>
                    </button>

                    <button
                      onClick={() => {
                        const originalUserPrompt = messages.filter((m) => m.role === "user").pop()?.text || "Mix";
                        handleSaveToPlaylist(msg.id, msg.playlist!, originalUserPrompt);
                      }}
                      disabled={resolvingTrackIds.has(msg.id) || resolvingTrackIds.has(`${msg.id}-save`)}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-[#1ed760] border border-[#282828] font-bold text-[10px] tracking-wider uppercase rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40"
                    >
                      {resolvingTrackIds.has(`${msg.id}-save`) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1ed760]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Save Playlist</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3.5 text-neutral-500 text-xs py-2 bg-neutral-900/30 self-start p-4 rounded-xl border border-[#282828] max-w-[280px]">
            <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin" />
            <span className="font-bold tracking-wider uppercase animate-pulse">DJ is scratching records...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Prompts Input Section bar */}
      <div className="p-6 bg-neutral-950/70 border-t border-[#282828]/60 backdrop-blur-md flex-shrink-0 z-10">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto relative relative-focus select-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your mood (e.g. 'Chill beats to read books', '80s high octane synth wave')..."
            className="flex-1 bg-neutral-900 border border-[#282828]/80 hover:bg-neutral-850 hover:border-neutral-700/80 focus:border-neutral-600 focus:bg-neutral-900 rounded-full pl-6 pr-14 py-3.5 text-sm font-semibold outline-none transition-all placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-neutral-800 text-black disabled:text-neutral-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md disabled:shadow-none"
            title="Send DJ prompt"
          >
            <Send className="w-4.5 h-4.5 text-current transform translate-x-px" />
          </button>
        </form>
        <div className="text-center mt-3 text-[10px] text-neutral-600 font-medium tracking-tight">
          Broadcasting utilizing Google Gemini AI. Standard model selection optimizes prompt matching latency.
        </div>
      </div>
    </div>
  );
}
