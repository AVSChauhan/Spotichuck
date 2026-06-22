import React, { useEffect, useState } from "react";
import { Users, X, Disc, Music, Circle } from "lucide-react";
import { Track } from "../types";

interface FriendActivityPanelProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onPlayTrack?: (track: Track) => void;
}

interface Friend {
  name: string;
  avatar: string;
  color: string;
  status: "online" | "idle" | "offline";
  trackTitle: string;
  artist: string;
  album: string;
  timeAgo?: string;
  isSynced: boolean;
  rawTrack?: any;
}

export default function FriendActivityPanel({
  currentTrack,
  isPlaying,
  onClose,
  onPlayTrack,
}: FriendActivityPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([]);

  // Periodically change what friends are listening to for a dynamic Spotify vibe
  useEffect(() => {
    const defaultFriends: Friend[] = [
      {
        name: "Sarah Jenkins",
        avatar: "S",
        color: "bg-blue-600",
        status: "online",
        trackTitle: "Cruel Summer",
        artist: "Taylor Swift",
        album: "Lover",
        isSynced: false,
      },
      {
        name: "Alex Rivera",
        avatar: "A",
        color: "bg-emerald-600",
        status: "online",
        trackTitle: currentTrack ? currentTrack.title : "Blinding Lights",
        artist: currentTrack ? currentTrack.artist : "The Weeknd",
        album: currentTrack ? currentTrack.album || "" : "After Hours",
        isSynced: !!currentTrack,
      },
      {
        name: "Diego Alvarez",
        avatar: "D",
        color: "bg-purple-600",
        status: "idle",
        trackTitle: "Lo-Fi Beats to Relax/Study to",
        artist: "Lofi Girl",
        album: "Chillhop Essentials",
        timeAgo: "4m",
        isSynced: false,
      },
      {
        name: "Jessica Chen",
        avatar: "J",
        color: "bg-pink-600",
        status: "offline",
        trackTitle: "Bad Habits",
        artist: "Ed Sheeran",
        album: "=",
        timeAgo: "2h",
        isSynced: false,
      },
    ];

    setFriends(defaultFriends);
  }, [currentTrack]);

  // Simulate progress updating dynamically
  const [syncedProgress, setSyncedProgress] = useState<number>(15);
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => {
      setSyncedProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  return (
    <div className="w-full h-full bg-[#121212] border-l border-[#282828] flex flex-col font-sans select-none text-white relative z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#282828]">
        <h3 className="text-sm font-extrabold flex items-center gap-2 tracking-wide uppercase text-neutral-300">
          <Users className="w-4 h-4 text-[#1DB954]" />
          <span>Friend Activity</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          title="Close Social Feed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info Notice card */}
      <div className="p-3 bg-neutral-900/50 m-3 rounded-lg border border-neutral-800/60">
        <p className="text-[10px] text-neutral-400 leading-normal font-semibold">
          Your listening activity is shared with friends. Double-click a friend's active card to join their jam session!
        </p>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        {friends.map((friend, idx) => {
          // If synced, update with your actual song details
          const title = friend.isSynced && currentTrack ? currentTrack.title : friend.trackTitle;
          const artist = friend.isSynced && currentTrack ? currentTrack.artist : friend.artist;
          const album = friend.isSynced && currentTrack ? currentTrack.album : friend.album;
          const isActuallyOnline = friend.isSynced ? isPlaying : friend.status === "online";

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-2 rounded-lg transition-all hover:bg-neutral-800/45 border border-transparent ${
                friend.isSynced ? "bg-emerald-950/5 border-emerald-900/10" : ""
              }`}
            >
              {/* Avatar block */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full ${friend.color} flex items-center justify-center font-bold text-sm text-white shadow-md`}
                >
                  {friend.avatar}
                </div>
                {/* Status indicator badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#121212] flex items-center justify-center">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActuallyOnline
                        ? "bg-[#1DB954] animate-pulse"
                        : friend.status === "idle"
                        ? "bg-amber-500"
                        : "bg-neutral-600"
                    }`}
                  />
                </span>
              </div>

              {/* Text content details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 hover:text-[#1DB954] cursor-pointer truncate">
                    {friend.name}
                  </span>
                  {friend.timeAgo && !isActuallyOnline && (
                    <span className="text-[9px] text-neutral-500 font-medium">{friend.timeAgo}</span>
                  )}
                  {isActuallyOnline && (
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1 rounded uppercase tracking-widest font-extrabold animate-pulse">
                      Live
                    </span>
                  )}
                </div>

                {/* Sub row track details */}
                <div className="mt-1">
                  <span className="block text-[10px] text-neutral-300 font-semibold truncate hover:underline cursor-pointer">
                    {title}
                  </span>
                  <span className="block text-[9px] text-neutral-400 truncate">
                    • {artist}
                  </span>
                  {album && (
                    <span className="block text-[9px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                      <Disc className="w-2.5 h-2.5 text-neutral-600 animate-spin-slow" />
                      {album}
                    </span>
                  )}
                </div>

                {/* Synced banner indicator */}
                {friend.isSynced && isPlaying && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Music className="w-2.5 h-2.5 text-[#1DB954]" />
                    <span className="text-[8px] text-[#1DB954] font-extrabold uppercase tracking-wide">
                      Synced with your player
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
