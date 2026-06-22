import React, { useState, useEffect } from "react";
import { Play, Sparkles, Heart, Disc, Music, Smile, Loader2, ArrowRight } from "lucide-react";
import { Track, Playlist } from "../types";

interface HomePanelProps {
  onPlayTrack: (track: Track) => void;
  onSelectPlaylist: (id: string | null) => void;
  playlists: Playlist[];
  likedTracksCount: number;
}

export default function HomePanel({
  onPlayTrack,
  onSelectPlaylist,
  playlists,
  likedTracksCount,
}: HomePanelProps) {
  const [greeting, setGreeting] = useState<string>("Welcome");
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic Spotify Greeting depending on local hour
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Fetch some beautiful default top tracks on mount to populate the Home dashboard instantly!
  useEffect(() => {
    const fetchHomeHits = async () => {
      try {
        setLoading(true);
        // Search Apple iTunes for pop hits
        const res = await fetch("https://itunes.apple.com/search?term=pop+hits&media=music&limit=12");
        if (!res.ok) throw new Error("Hits failed");
        const data = await res.json();
        
        const hits: Track[] = (data.results || [])
          .filter((item: any) => item.trackId && item.previewUrl)
          .map((item: any) => ({
            id: String(item.trackId),
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName || "Popular Hits",
            coverUrl: item.artworkUrl100
              ? item.artworkUrl100.replace("100x100bb", "500x500bb")
              : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            previewUrl: item.previewUrl,
            durationSeconds: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
          }));
        
        setFeaturedTracks(hits);
      } catch (err) {
        console.error("Home hits search error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeHits();
  }, []);

  // Spotify iconic top grid pre-defined playlists
  const quickGrids = [
    { name: "Pop Hits 2026", term: "pop hits", color: "bg-blue-600/20 hover:bg-blue-600/30", iconColor: "text-blue-400" },
    { name: "Rock Legends", term: "rock classic", color: "bg-red-600/20 hover:bg-red-600/30", iconColor: "text-red-400" },
    { name: "Lofi Study Beats", term: "lofi hiphop chill", color: "bg-teal-600/20 hover:bg-teal-600/30", iconColor: "text-teal-400" },
    { name: "EDM Hype", term: "edm dance bass", color: "bg-purple-600/20 hover:bg-purple-600/30", iconColor: "text-purple-400" },
    { name: "Bollywood Grooves", term: "bollywood hindi dance", color: "bg-orange-600/20 hover:bg-orange-600/30", iconColor: "text-orange-400" },
    { name: "Aesthetic Indie", term: "indie folk alternative", color: "bg-emerald-600/20 hover:bg-emerald-600/30", iconColor: "text-emerald-400" },
  ];

  const handleQuickGridClick = async (grid: any) => {
    try {
      setLoading(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(grid.term)}&media=music&limit=15`);
      if (res.ok) {
        const data = await res.json();
        const tracks: Track[] = (data.results || [])
          .filter((item: any) => item.trackId && item.previewUrl)
          .map((item: any) => ({
            id: String(item.trackId),
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName || "Billboard Collection",
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "500x500bb") : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            previewUrl: item.previewUrl,
            durationSeconds: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
          }));
        setFeaturedTracks(tracks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e1e1e] to-[#121212] p-8 font-sans text-white h-full relative">
      {/* Dynamic Header Greeting */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>{greeting}</span>
          <Smile className="w-8 h-8 text-[#1DB954]" />
        </h1>
        <div className="flex items-center gap-3">
          <div className="p-1 px-3 bg-[#242424] rounded-full border border-neutral-700/80 text-neutral-400 text-xs font-bold font-mono">
            On-Line Streamer
          </div>
        </div>
      </div>

      {/* Dynamic Quick 2x3 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 select-none">
        {/* Liked Songs Card */}
        <div
          onClick={() => onSelectPlaylist("liked-songs")}
          className="bg-[#181818]/60 hover:bg-[#282828]/60 transition-all p-3 rounded-lg flex items-center gap-4 cursor-pointer relative group border border-[#282828]/35 overflow-hidden shadow-md"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-500 to-rose-400 rounded-md flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Heart className="w-7 h-7" fill="currentColor" />
          </div>
          <div className="flex-1 truncate">
            <span className="block font-extrabold text-sm text-white">Liked Songs</span>
            <span className="text-[10px] text-neutral-400 tracking-wide font-semibold block">{likedTracksCount} absolute favorites</span>
          </div>
          <button className="w-10 h-10 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 active:scale-95 shadow-md mr-3 cursor-pointer">
            <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
          </button>
        </div>

        {quickGrids.map((grid, idx) => (
          <div
            key={idx}
            onClick={() => handleQuickGridClick(grid)}
            className={`bg-neutral-800/40 hover:bg-neutral-800/80 transition-all p-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer relative group border border-neutral-900 overflow-hidden shadow-md`}
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 bg-neutral-950/80 rounded-md flex items-center justify-center flex-shrink-0 border border-neutral-800 shadow">
                <Disc className={`w-7 h-7 ${grid.iconColor} animate-spin-slow`} />
              </div>
              <span className="font-extrabold text-sm text-neutral-200 group-hover:text-white truncate block">
                {grid.name}
              </span>
            </div>
            <button className="w-10 h-10 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 active:scale-95 shadow-md mr-3 cursor-pointer flex-shrink-0">
              <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Featured Playlist section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Dynamic Radio Rotation</span>
          </h2>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Tap standard items to load customized tracks, or browse trending lists below.
          </p>
        </div>
      </div>

      {/* List content / Carousel */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#1DB954]">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="font-extrabold text-xs tracking-wider uppercase text-neutral-400 animate-pulse">Syncing hits...</span>
        </div>
      ) : featuredTracks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {featuredTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="bg-neutral-800/15 hover:bg-neutral-800/40 border border-[#282828]/40 transition-all p-4 rounded-xl flex flex-col group relative overflow-hidden shadow-lg select-none cursor-pointer"
            >
              {/* Cover block */}
              <div className="w-full aspect-square rounded-lg overflow-hidden relative shadow-lg shadow-black/30 mb-4 bg-neutral-800">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual hover cover backdrop */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-0" />
                
                {/* Circular hover play trigger button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(track);
                  }}
                  className="w-12 h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center font-bold shadow-xl shadow-[#1DB954]/25 opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 absolute right-4 bottom-4 z-10 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-currentColor translate-x-0.5" />
                </button>
              </div>

              {/* Descriptions */}
              <p className="text-sm font-extrabold text-white truncate leading-tight mb-1 group-hover:text-[#1DB954] transition-colors">
                {track.title}
              </p>
              <p className="text-xs text-neutral-400 truncate leading-tight font-semibold hover:underline">
                {track.artist}
              </p>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mt-3 font-mono">
                {track.album.length > 20 ? track.album.substring(0, 20) + "..." : track.album}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500">
          <p>Static on the waves. Search to feed songs into the player!</p>
        </div>
      )}

      {/* Spotify Signature Browse All Genres & Moods Grid */}
      <div className="mt-12 mb-8 select-none">
        <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Browse All Genres & Moods
        </h2>
        <p className="text-xs text-neutral-400 font-semibold mb-6">
          Explore curated playlists for different moods and contexts. Click to instantly queue relevant tunes!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            {
              name: "Chill & Lofi",
              term: "lofi lounge chillout quiet",
              bg: "from-[#2b5c8f] to-[#4c8fd4]",
              emoji: "☕"
            },
            {
              name: "Gym Boost",
              term: "workout power fitness motivation",
              bg: "from-[#b02222] to-[#f45c43]",
              emoji: "⚡"
            },
            {
              name: "Happy Beats",
              term: "happy summer pool dynamic pop",
              bg: "from-[#e65c00] to-[#f9d423]",
              emoji: "☀️"
            },
            {
              name: "Deep Focus",
              term: "focus classical instrumental brain coding",
              bg: "from-[#0575e6] to-[#00f260]",
              emoji: "💻"
            },
            {
              name: "Cosmic Trip",
              term: "indie ambient cinematic slow space sad",
              bg: "from-[#8a2387] to-[#e94057]",
              emoji: "🌌"
            }
          ].map((cat, i) => (
            <div
              key={i}
              onClick={() => handleQuickGridClick({ term: cat.term })}
              className={`h-32 bg-gradient-to-br ${cat.bg} hover:scale-[1.03] active:scale-95 transition-all p-4 rounded-xl cursor-pointer relative overflow-hidden group border border-white/5 shadow-md`}
            >
              <span className="font-extrabold text-base text-white tracking-tight break-words pr-4 block">
                {cat.name}
              </span>
              <div className="absolute -bottom-2 -right-4 text-6xl opacity-45 transform rotate-12 group-hover:-translate-x-2 group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none">
                {cat.emoji}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sparkles advertising sidebar features */}
      <div className="mt-14 bg-gradient-to-r from-[#181818] via-[#242424] to-[#121212] border border-[#282828]/40 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden select-none">
        {/* Cassette vector design backdrop */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 text-emerald-300 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black flex-shrink-0 shadow-lg shadow-[#1DB954]/20 font-extrabold">
            <Sparkles className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Experience AI-Coded DJ Sessions!</h3>
            <p className="text-xs text-neutral-300 max-w-lg mt-1.5 leading-relaxed">
              Launch our bespoke **AI DJ Assistant** in the sidebar. Describe any genre, style, or feeling, and feel the DJ stream the tracks straight into your personal player queue!
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectPlaylist(null)}
          className="px-6 py-3 bg-[#1DB954] text-black font-extrabold text-xs tracking-wider uppercase rounded-full hover:bg-[#1ed760] transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#1DB954]/20 active:scale-95 text-center flex-shrink-0 relative z-10"
        >
          <span>Chat with DJ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
