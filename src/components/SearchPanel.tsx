import React, { useState, useEffect } from "react";
import { Search, Play, Plus, Clock, Disc, Sparkles, Loader2, Heart } from "lucide-react";
import { Track, Playlist } from "../types";

interface SearchPanelProps {
  onPlayTrack: (track: Track) => void;
  onAddTrackToPlaylist: (track: Track, playlistId: string) => void;
  playlists: Playlist[];
  onToggleLike: (track: Track) => void;
  likedSongIds: Set<string>;
  currentPlayingTrackId: string | null;
  isPlaying: boolean;
}

export default function SearchPanel({
  onPlayTrack,
  onAddTrackToPlaylist,
  playlists,
  onToggleLike,
  likedSongIds,
  currentPlayingTrackId,
  isPlaying,
}: SearchPanelProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // Hardcoded colorful browse categories (just like Spotify's Search grid)
  const genres = [
    { name: "Pop hits", color: "from-pink-500 to-rose-600", query: "pop hits" },
    { name: "Rock anthems", color: "from-amber-600 to-red-700", query: "rock classic" },
    { name: "Hip-Hop / Rap", color: "from-purple-600 to-indigo-700", query: "hiphop rap" },
    { name: "Electronic & EDM", color: "from-sky-500 to-blue-700", query: "edm electropop" },
    { name: "Lofi Beats", color: "from-teal-600 to-emerald-700", query: "lofi chill study" },
    { name: "Bollywood", color: "from-orange-500 to-rose-500", query: "bollywood hindi hits" },
    { name: "Jazz & Blues", color: "from-yellow-600 to-amber-700", query: "classic jazz" },
    { name: "Acoustic & Indie", color: "from-emerald-600 to-cyan-700", query: "indie acousticfolk" },
  ];

  // Debounce search fetching
  useEffect(() => {
    if (query.trim().length === 0) {
      if (!activeGenre) {
        setResults([]);
      }
      return;
    }

    setSearching(true);
    setActiveGenre(null);

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform actual API search on iTunes API
  const performSearch = async (searchTerm: string) => {
    setSearching(true);
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        searchTerm
      )}&media=music&limit=30`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();

      const mappedResults: Track[] = (data.results || [])
        .filter((item: any) => item.trackId && item.previewUrl)
        .map((item: any) => ({
          id: String(item.trackId),
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName || "Single",
          coverUrl: item.artworkUrl100
            ? item.artworkUrl100.replace("100x100bb", "500x500bb")
            : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
          previewUrl: item.previewUrl,
          durationSeconds: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
        }));

      setResults(mappedResults);
    } catch (err) {
      console.error("iTunes search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleGenreClick = async (genre: any) => {
    setQuery("");
    setActiveGenre(genre.name);
    await performSearch(genre.query);
  };

  // Helper to format track length from seconds to mm:ss
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e1e1e] to-[#121212] p-8 font-sans text-white h-full relative">
      {/* Search Bar header */}
      <div className="max-w-2xl relative mb-10 group">
        <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#1DB954] transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to play?"
          className="w-full bg-neutral-800 hover:bg-neutral-800/80 focus:bg-neutral-800 text-white pl-12 pr-10 py-3.5 rounded-full text-sm font-semibold outline-none border border-transparent focus:border-neutral-700 transition-all shadow-md placeholder-neutral-400"
        />
        {searching && (
          <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {activeGenre && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Searching Genre: <span className="text-[#1DB954]">{activeGenre}</span></h2>
          <button
            onClick={() => {
              setActiveGenre(null);
              setResults([]);
            }}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Clear Genre filter
          </button>
        </div>
      )}

      {/* Grid of default browse genres if search field is empty */}
      {query.trim().length === 0 && !activeGenre ? (
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-6">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 select-none">
            {genres.map((g, idx) => (
              <button
                key={idx}
                onClick={() => handleGenreClick(g)}
                className={`h-40 rounded-xl bg-gradient-to-br ${g.color} p-5 relative overflow-hidden group shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left border border-white/5`}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <span className="text-xl font-bold tracking-tight leading-tight block truncate pr-8">
                  {g.name}
                </span>
                
                {/* Visual cassette/disc emblem absolute rotated in bottom-right */}
                <span className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10 group-hover:text-white/15 transition-transform duration-500 transform group-hover:rotate-45 group-hover:scale-110">
                  <Disc className="w-full h-full border-transparent" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results Table and top result */
        <div>
          {results.length > 0 ? (
            <div className="flex flex-col gap-8">
              {/* Split layout: Top Result & Songs Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Top Match result */}
                <div className="lg:col-span-1 bg-neutral-800/40 hover:bg-neutral-800/60 transition-colors p-6 rounded-xl border border-[#282828]/40 flex flex-col group relative">
                  <span className="text-xs tracking-widest text-neutral-400 uppercase font-extrabold mb-4 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#1DB954]" />
                    Top MATCH
                  </span>
                  <div className="w-28 h-28 rounded-lg overflow-hidden relative shadow-lg shadow-black/40 mb-6 flex-shrink-0">
                    <img
                      src={results[0].coverUrl}
                      alt={results[0].title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight truncate leading-tight mb-1 text-white">
                    {results[0].title}
                  </h3>
                  <p className="text-neutral-400 text-sm font-semibold truncate hover:underline cursor-pointer mb-8">
                    {results[0].artist}
                  </p>
                  
                  {/* Floating badge for song */}
                  <span className="self-start text-[10px] font-extrabold text-[#1DB954] bg-[#1DB954]/10 px-3 py-1 rounded-full border border-[#1DB954]/20 uppercase tracking-widest leading-none">
                    Song
                  </span>

                  {/* Play circle button on hover */}
                  <button
                    onClick={() => onPlayTrack(results[0])}
                    className="w-12 h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center font-bold shadow-lg shadow-[#1DB954]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer absolute right-6 bottom-6 lg:opacity-0 group-hover:opacity-100 duration-300"
                  >
                    <Play className="w-5 h-5 fill-currentColor translate-x-0.5" />
                  </button>
                </div>

                {/* RIGHT: Songs list column */}
                <div className="lg:col-span-2 flex flex-col">
                  <h3 className="text-lg font-extrabold tracking-tight mb-4 text-white">Popular Tracks</h3>
                  <div className="flex flex-col">
                    {results.slice(0, 5).map((track) => {
                      const isCurrent = currentPlayingTrackId === track.id;
                      return (
                        <div
                          key={track.id}
                          className={`flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/40 transition-colors group border-b border-neutral-900/45 ${
                            isCurrent ? "bg-neutral-800/20" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-4">
                            <div className="relative w-11 h-11 bg-neutral-800 rounded-md overflow-hidden flex-shrink-0 shadow-sm border border-neutral-800">
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                onClick={() => onPlayTrack(track)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              >
                                <Play className="w-4 h-4 fill-currentColor" />
                              </button>
                            </div>
                            <div className="truncate min-w-0">
                              <p
                                onClick={() => onPlayTrack(track)}
                                className={`text-sm font-bold truncate hover:underline cursor-pointer ${
                                  isCurrent ? "text-[#1DB954]" : "text-white"
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-xs text-neutral-400 truncate mt-0.5 hover:underline cursor-pointer">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          {/* Controls row */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onToggleLike(track)}
                              className={`p-1.5 rounded-full hover:bg-[#282828] cursor-pointer transition-colors ${
                                likedSongIds.has(track.id) ? "text-rose-500 hover:text-rose-400" : "text-neutral-500 hover:text-neutral-300"
                              }`}
                            >
                              <Heart className="w-4 h-4" fill={likedSongIds.has(track.id) ? "currentColor" : "none"} />
                            </button>

                            {/* Add to Playlist Popup Menu option */}
                            {playlists.length > 0 && (
                              <div className="relative group/menu">
                                <button className="p-1.5 rounded-full hover:bg-[#282828] text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-bold font-mono">
                                  <Plus className="w-4 h-4 inline-block" />
                                </button>
                                <div className="absolute right-0 bottom-full mb-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl py-1.5 w-48 hidden group-hover/menu:block hover:block z-40">
                                  <span className="block px-3 py-1 text-[10px] font-extrabold tracking-wider text-neutral-500 uppercase leading-relaxed border-b border-neutral-900/60">
                                    Add to playlist
                                  </span>
                                  {playlists
                                    .filter((p) => p.id !== "liked-songs")
                                    .map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => onAddTrackToPlaylist(track, p.id)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[#1DB954] hover:text-black transition-colors truncate block font-semibold cursor-pointer"
                                      >
                                        {p.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            <span className="text-xs text-neutral-500 font-medium font-mono min-w-[36px] text-right">
                              {formatDuration(track.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Massive All results grid list */}
              <div>
                <h3 className="text-lg font-extrabold tracking-tight mb-4 text-white">All Search Matches</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {results.slice(5).map((track) => {
                    const isPlayingCurrent = currentPlayingTrackId === track.id && isPlaying;
                    return (
                      <div
                        key={track.id}
                        className="bg-neutral-800/20 hover:bg-neutral-800/50 transition-all p-4 rounded-lg flex flex-col group border border-[#282828]/40 relative shadow-md"
                      >
                        <div className="w-full aspect-square rounded-md overflow-hidden relative shadow-md shadow-black/20 mb-4 bg-neutral-800">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => onPlayTrack(track)}
                            className="w-10 h-10 bg-[#1DB954] hover:bg-[#1ed760] rounded-full flex items-center justify-center text-black font-bold shadow-lg shadow-[#1DB954]/20 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer absolute right-3 bottom-0 group-hover:bottom-3 z-10 duration-200"
                          >
                            <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
                          </button>
                        </div>
                        <p
                          onClick={() => onPlayTrack(track)}
                          className="text-sm font-bold text-white truncate hover:underline cursor-pointer mb-0.5"
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate hover:underline cursor-pointer mb-2">
                          {track.artist}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-medium tracking-tight mt-auto">
                          <span className="font-mono">{formatDuration(track.durationSeconds)}</span>
                          <button
                            onClick={() => onToggleLike(track)}
                            className={`p-0.5 rounded cursor-pointer ${
                              likedSongIds.has(track.id) ? "text-rose-500" : "text-neutral-500 hover:text-white"
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" fill={likedSongIds.has(track.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <Clock className="w-10 h-10 text-neutral-700 mb-3" />
              <p className="text-sm">No track titles match your query. Try something else!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
