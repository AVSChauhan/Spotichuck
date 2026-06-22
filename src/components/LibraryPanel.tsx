import React from "react";
import { Play, Heart, Trash2, Clock, Music, FolderHeart, ShieldAlert, Sparkles } from "lucide-react";
import { Playlist, Track } from "../types";

interface LibraryPanelProps {
  activePlaylist: Playlist | null;
  onPlayTrack: (track: Track) => void;
  onRemoveTrackFromPlaylist?: (trackId: string, playlistId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  likedSongIds: Set<string>;
  onToggleLike: (track: Track) => void;
}

export default function LibraryPanel({
  activePlaylist,
  onPlayTrack,
  onRemoveTrackFromPlaylist,
  onDeletePlaylist,
  likedSongIds,
  onToggleLike,
}: LibraryPanelProps) {

  // Format track seconds to mm:ss
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  if (!activePlaylist) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212] p-8 font-sans text-neutral-400 flex items-center justify-center h-full">
        <div className="text-center select-none animate-fade-in">
          <FolderHeart className="w-16 h-16 mx-auto text-neutral-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-1.5">No Library Shelf Loaded</h3>
          <p className="text-sm">Click any playlist in the left rail to view track entries.</p>
        </div>
      </div>
    );
  }

  const isLikedSongs = activePlaylist.id === "liked-songs";

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e1e1e] to-[#121212] p-8 font-sans text-white h-full relative">
      
      {/* High-Bleed Gradient Header design */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-8 select-none">
        
        {/* Playlist Art Cover */}
        <div className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl relative flex-shrink-0 group/cover border border-white/5 bg-neutral-800">
          {isLikedSongs ? (
            <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-rose-500 to-amber-500 flex items-center justify-center text-white relative">
              <Heart className="w-20 h-20 filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.4)]" fill="currentColor" />
            </div>
          ) : activePlaylist.coverUrl ? (
            <img
              src={activePlaylist.coverUrl}
              alt={activePlaylist.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-[#181818] flex items-center justify-center text-neutral-500 border border-[#282828]">
              <Music className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Playlist titles details info */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-extrabold tracking-widest text-[#1DB954] uppercase bg-[#1DB954]/10 border border-[#1DB954]/20 px-3 py-1 rounded-full inline-block mb-3">
            {isLikedSongs ? "Favorite Collection" : "Dynamic Playlist"}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white truncate leading-none mb-4">
            {activePlaylist.name}
          </h1>
          {activePlaylist.description && (
            <p className="text-neutral-400 text-sm font-medium leading-relaxed mb-4 max-w-2xl">
              {activePlaylist.description}
            </p>
          )}

          {/* Counts metrics */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold select-none">
            <span className="text-white font-bold">SoundStream Symphony</span>
            <span>•</span>
            <span className="text-neutral-200">
              {activePlaylist.tracks.length} {activePlaylist.tracks.length === 1 ? "track" : "tracks"}
            </span>
            <span>•</span>
            <span>
              Total {activePlaylist.tracks.reduce((acc, t) => acc + t.durationSeconds, 0)}s playing length
            </span>
          </div>
        </div>

        {/* Options controls (Delete custom playlist option) */}
        {!isLikedSongs && onDeletePlaylist && (
          <button
            onClick={() => {
              if (confirm(`Do you want to delete "${activePlaylist.name}"?`)) {
                onDeletePlaylist(activePlaylist.id);
              }
            }}
            className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all rounded-xl border border-rose-500/20 font-bold flex items-center gap-1.5 cursor-pointer text-xs"
            title="Delete Playlist"
          >
            <Trash2 className="w-4 h-4 fill-transparent" />
            <span>Delete List</span>
          </button>
        )}
      </div>

      <div className="h-[1px] bg-neutral-850 my-6" />

      {/* Playlist Actions Play Bar */}
      {activePlaylist.tracks.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onPlayTrack(activePlaylist.tracks[0])}
            className="w-12 h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center font-bold shadow-lg shadow-[#1DB954]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Play playlist"
          >
            <Play className="w-5 h-5 fill-currentColor translate-x-0.5" />
          </button>
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-widest font-mono">Dynamic Queue list</span>
        </div>
      )}

      {/* Songs Grid lists panel */}
      {activePlaylist.tracks.length > 0 ? (
        <div className="flex flex-col select-none">
          {/* Table Headers row */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900/60 font-mono mb-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 md:col-span-6">Title</div>
            <div className="col-span-3 hidden md:block">Album</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {/* Track entries loop lists */}
          {activePlaylist.tracks.map((track, idx) => (
            <div
              key={track.id}
              className="grid grid-cols-12 items-center px-4 py-3 rounded-lg hover:bg-neutral-850/50 transition-colors group border-b border-neutral-900/30"
            >
              {/* Index */}
              <div className="col-span-1 text-center text-neutral-500 font-semibold group-hover:text-[#1DB954] transition-colors pointer-cursor text-sm" onClick={() => onPlayTrack(track)}>
                <span className="block group-hover:hidden">{idx + 1}</span>
                <Play className="w-4 h-4 text-[#1DB954] mx-auto hidden group-hover:block fill-currentColor cursor-pointer" />
              </div>

              {/* Title & Artist */}
              <div className="col-span-11 md:col-span-5 flex items-center gap-3.5 min-w-0 pr-4">
                <div className="w-10 h-10 rounded overflow-hidden relative shadow flex-shrink-0 bg-neutral-900 border border-neutral-850">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="truncate min-w-0">
                  <p
                    onClick={() => onPlayTrack(track)}
                    className="text-sm font-bold text-white hover:underline truncate cursor-pointer"
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate hover:underline cursor-pointer mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Album name */}
              <div className="col-span-3 hidden md:block text-neutral-400 text-xs truncate font-medium pr-4">
                {track.album}
              </div>

              {/* Actions columns */}
              <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-4">
                {/* Heart Like toggler */}
                <button
                  onClick={() => onToggleLike(track)}
                  className={`p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer transition-colors ${
                    likedSongIds.has(track.id) ? "text-rose-500" : "text-neutral-500 hover:text-white"
                  }`}
                  title={likedSongIds.has(track.id) ? "Unlike song" : "Like song"}
                >
                  <Heart className="w-4 h-4" fill={likedSongIds.has(track.id) ? "currentColor" : "none"} />
                </button>

                {/* Playlist remove track */}
                {!isLikedSongs && onRemoveTrackFromPlaylist && (
                  <button
                    onClick={() => onRemoveTrackFromPlaylist(track.id, activePlaylist.id)}
                    className="p-1.5 rounded-full hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Elapsed durations */}
                <span className="text-xs text-neutral-500 font-medium font-mono min-w-[36px] text-right">
                  {formatDuration(track.durationSeconds)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty playlists condition display */
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 border border-dashed border-neutral-800 rounded-xl select-none select-all relative animate-fade-in mt-4">
          <ShieldAlert className="w-10 h-10 text-neutral-600 mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Playlist lies empty</h4>
          <p className="text-sm max-w-sm text-center px-4 leading-normal">
            No track files are inside this playlist. Go to the **Search** view to discover tracks and pile them here!
          </p>
        </div>
      )}
    </div>
  );
}
