import React from "react";
import { Home, Search, Library, Plus, Heart, Sparkles, Music } from "lucide-react";
import { Playlist } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  playlists,
  onCreatePlaylist,
  selectedPlaylistId,
  onSelectPlaylist,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-black flex flex-col h-full select-none text-[#b3b3b3] font-sans border-r border-[#282828]">
      {/* Brand Logo & Title */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-[#1DB954]/20">
          <Music className="w-5 h-5" fill="currentColor" />
        </div>
        <div>
          <span className="text-white font-extrabold text-lg tracking-tight">SoundStream</span>
          <span className="text-[#1DB954] text-xs block font-bold tracking-widest -mt-1 uppercase">Symphony</span>
        </div>
      </div>

      {/* Primary Navigation Options */}
      <div className="px-3 py-2 flex flex-col gap-0.5">
        <button
          onClick={() => {
            setActiveTab("home");
            onSelectPlaylist(null);
          }}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "home" && !selectedPlaylistId
              ? "bg-neutral-900 text-white"
              : "hover:bg-neutral-900/50 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("search");
            onSelectPlaylist(null);
          }}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "search" && !selectedPlaylistId
              ? "bg-neutral-900 text-white"
              : "hover:bg-neutral-900/50 hover:text-white"
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("library");
            onSelectPlaylist(null);
          }}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "library" && !selectedPlaylistId
              ? "bg-neutral-900 text-white"
              : "hover:bg-neutral-900/50 hover:text-white"
          }`}
        >
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("geminidj");
            onSelectPlaylist(null);
          }}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 relative overflow-hidden cursor-pointer group ${
            activeTab === "geminidj" && !selectedPlaylistId
              ? "bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20"
              : "hover:bg-neutral-900/50 text-[#1DB954] hover:text-[#1ed760]"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="w-5 h-5 animate-pulse text-[#1DB954]" fill="currentColor" />
          <span className="tracking-wide">AI DJ Assistant</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1DB954]/20 text-[#1DB954] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#1DB954]/30 tracking-wider uppercase">
            Beta
          </span>
        </button>
      </div>

      <div className="h-[1px] bg-neutral-900 mx-5 my-4" />

      {/* Playlist Custom Section */}
      <div className="flex-1 flex flex-col min-h-0 px-3">
        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
          <span>Playlists</span>
          <button
            onClick={onCreatePlaylist}
            title="Create Playlist"
            className="p-1 rounded-full hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Liked Songs Special playlist item */}
        <div className="mb-2">
          <button
            onClick={() => {
              setActiveTab("library");
              onSelectPlaylist("liked-songs");
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
              selectedPlaylistId === "liked-songs"
                ? "bg-neutral-900 text-white"
                : "hover:bg-neutral-900/40 text-rose-400 hover:text-rose-300"
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-700 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-950/20">
              <Heart className="w-4 h-4" fill="currentColor" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Liked Songs</span>
              <span className="text-[10px] text-neutral-500">Auto-saved tracks</span>
            </div>
          </button>
        </div>

        {/* Dynamic User Created Playlists */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0 pb-4 pr-1">
          {playlists
            .filter((p) => p.id !== "liked-songs")
            .map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-all cursor-pointer group ${
                  selectedPlaylistId === playlist.id
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-900/40 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-neutral-800 overflow-hidden relative flex items-center justify-center flex-shrink-0 border border-neutral-800">
                  {playlist.coverUrl ? (
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Music className="w-4 h-4 text-neutral-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="truncate flex-1">
                  <span className="block font-medium truncate">{playlist.name}</span>
                  <span className="text-[10px] text-neutral-500 truncate block">
                    {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
                  </span>
                </div>
              </button>
            ))}
          {playlists.filter((p) => p.id !== "liked-songs").length === 0 && (
            <div className="text-center py-8 text-neutral-600 text-xs">
              <p>No custom lists yet.</p>
              <button
                onClick={onCreatePlaylist}
                className="mt-3 text-[#1DB954] hover:text-[#1ed760] text-xs font-semibold cursor-pointer"
              >
                Create one now
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
