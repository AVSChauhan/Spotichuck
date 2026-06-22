import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Tv,
  Music,
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2,
  Globe,
  Users,
} from "lucide-react";
import { Track } from "../types";

interface PlayBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNext: () => void;
  onPrevious: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: boolean;
  onToggleRepeat: () => void;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  showQueue: boolean;
  onToggleQueue: () => void;
  showSocialFeed?: boolean;
  onToggleSocialFeed?: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  playMode: "preview" | "youtube";
  onChangePlayMode: (mode: "preview" | "youtube") => void;
  loadingFullSong: boolean;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  musicSources?: any[];
  activeSourceIndex?: number;
  sourcesListExpanded?: boolean;
  onToggleSourcesExpanded?: () => void;
}

export default function PlayBar({
  currentTrack,
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  onNext,
  onPrevious,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
  showLyrics,
  onToggleLyrics,
  showQueue,
  onToggleQueue,
  showSocialFeed = false,
  onToggleSocialFeed = () => {},
  isLiked,
  onToggleLike,
  playMode,
  onChangePlayMode,
  loadingFullSong,
  playbackRate,
  onChangePlaybackRate,
  musicSources = [],
  activeSourceIndex = 0,
  sourcesListExpanded = false,
  onToggleSourcesExpanded = () => {},
}: PlayBarProps) {
  
  // Format seconds to MM:SS format
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const elapsedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = Math.min(Math.max(clickX / width, 0), 1);
    onSeek(clickPercent * duration);
  };

  return (
    <footer className="h-24 bg-[#181818] border-t border-[#282828] px-6 flex items-center justify-between text-white font-sans select-none relative z-50">
      {/* LEFT: Current Song Card */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-800 flex-shrink-0 group relative shadow-md">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Music className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="truncate flex-1">
              <span className="block text-sm font-semibold text-white hover:underline cursor-pointer truncate">
                {currentTrack.title}
              </span>
              <span className="block text-xs text-neutral-400 hover:underline cursor-pointer truncate">
                {currentTrack.artist}
              </span>
            </div>
            <button
              onClick={onToggleLike}
              className={`p-2 rounded-full cursor-pointer transition-transform active:scale-90 ${
                isLiked ? "text-rose-500 hover:text-rose-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
              <Music className="w-6 h-6 border-transparent" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-neutral-500">No Song Selected</span>
              <span className="block text-xs text-neutral-600">Select a song to start jamming</span>
            </div>
          </div>
        )}
      </div>

      {/* MID: Player Controls */}
      <div className="flex flex-col items-center flex-1 max-w-xl">
        {/* Toggle between Preview and Full Song */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <button
            onClick={() => onChangePlayMode("preview")}
            disabled={!currentTrack}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase border transition-all cursor-pointer ${
              !currentTrack
                ? "opacity-40 cursor-not-allowed border-neutral-800 text-neutral-600"
                : playMode === "preview"
                ? "bg-[#1DB954] text-black border-[#1DB954] hover:bg-[#1ed760]"
                : "bg-neutral-900 text-neutral-300 border-[#282828] hover:text-white"
            }`}
            title="Listen to premium high-fidelity 30-second music sample"
          >
            <Music className="w-3 h-3" />
            <span>30s High-Fidelity Audio</span>
          </button>

          <button
            onClick={() => onChangePlayMode("youtube")}
            disabled={!currentTrack}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase border transition-all cursor-pointer relative ${
              !currentTrack
                ? "opacity-40 cursor-not-allowed border-neutral-800 text-neutral-600"
                : playMode === "youtube"
                ? "bg-red-600 text-white border-red-600 hover:bg-red-500 animate-pulse"
                : "bg-neutral-900 text-rose-500 border-rose-950 hover:text-rose-400 hover:border-rose-900"
            }`}
            title="Unlock continuous play of full-track video and media files"
          >
            {loadingFullSong ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Tv className="w-3 h-3" />
            )}
            <span>Full Song</span>
            {currentTrack && !loadingFullSong && playMode !== "youtube" && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[7px] px-1 rounded-full animate-bounce">
                Full
              </span>
            )}
          </button>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleShuffle}
            disabled={!currentTrack}
            className={`cursor-pointer transition-colors ${
              !currentTrack ? "opacity-30 cursor-not-allowed" : shuffle ? "text-[#1DB954] hover:text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevious}
            disabled={!currentTrack}
            className={`cursor-pointer transition-all active:scale-90 ${
              !currentTrack ? "opacity-30 cursor-not-allowed" : "text-neutral-300 hover:text-white"
            }`}
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={!currentTrack || loadingFullSong}
            className={`w-9 h-9 rounded-full bg-white text-black flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md ${
              (!currentTrack || loadingFullSong) ? "opacity-40 cursor-not-allowed bg-neutral-750 text-neutral-500" : "hover:bg-[#1ed760] text-black border-transparent"
            }`}
          >
            {loadingFullSong ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-currentColor" />
            ) : (
              <Play className="w-4 h-4 fill-currentColor translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!currentTrack}
            className={`cursor-pointer transition-all active:scale-90 ${
              !currentTrack ? "opacity-30 cursor-not-allowed" : "text-neutral-300 hover:text-white"
            }`}
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleRepeat}
            disabled={!currentTrack}
            className={`cursor-pointer transition-colors ${
              !currentTrack ? "opacity-30 cursor-not-allowed" : repeat ? "text-[#1DB954] hover:text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
            }`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Progress Slider */}
        <div className="flex items-center gap-3 w-full mt-2 text-xs text-[#b3b3b3] font-medium">
          <span>{formatTime(currentTime)}</span>
          <div
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer relative group transition-all hover:h-1.5"
          >
            <div
              className={`h-full rounded-full transition-colors ${
                playMode === "youtube" ? "bg-red-500" : "bg-[#1DB954] group-hover:bg-[#1ed760]"
              }`}
              style={{ width: `${elapsedPercent}%` }}
            />
            <div
              className="absolute w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-md cursor-pointer"
              style={{ left: `${elapsedPercent}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Utility Controls */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px] justify-end">
        {/* Speed button */}
        {currentTrack && (
          <button
            onClick={() => {
              const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 0.75 : 1.0;
              onChangePlaybackRate(nextRate);
            }}
            className="text-[10px] bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors duration-200 text-neutral-400 font-extrabold tracking-wider px-2 py-1 rounded cursor-pointer uppercase"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        )}

        <button
          onClick={onToggleLyrics}
          disabled={!currentTrack}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            !currentTrack
              ? "opacity-30 cursor-not-allowed text-neutral-600"
              : showLyrics
              ? "text-[#1DB954] bg-[#282828] border border-[#1DB954]/20"
              : "text-neutral-400 hover:text-white"
          }`}
          title="Lyrics"
        >
          <Sparkles className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onToggleQueue}
          disabled={!currentTrack}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            !currentTrack
              ? "opacity-30 cursor-not-allowed text-neutral-600"
              : showQueue
              ? "text-[#1DB954] bg-[#282828] border border-[#1DB954]/20"
              : "text-neutral-400 hover:text-white"
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-4.5 h-4.5" />
        </button>

         <button
          onClick={onToggleSocialFeed}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            showSocialFeed
              ? "text-[#1DB954] bg-[#282828] border border-[#1DB954]/20"
              : "text-neutral-400 hover:text-white"
          }`}
          title="Friend Activity (Spotify Social Feed)"
        >
          <Users className="w-4.5 h-4.5" />
        </button>

        {musicSources && musicSources.length > 0 && (
          <button
            onClick={onToggleSourcesExpanded}
            className={`p-2 rounded-full cursor-pointer transition-colors relative flex items-center justify-center ${
              sourcesListExpanded
                ? "text-emerald-400 bg-neutral-800 border border-emerald-500/20 animate-pulse"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Music Sourcing & Stream Selector"
          >
            <Globe className="w-4.5 h-4.5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 bg-[#1DB954] text-black text-[7px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {musicSources.length}
            </span>
          </button>
        )}

        {/* Volume section */}
        <div className="flex items-center gap-2 group max-w-[120px]">
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full hover:bg-neutral-900 hover:text-white text-neutral-400 transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer accent-[#1DB954] hover:accent-[#1ed760] transition-all"
            title="Volume"
          />
        </div>
      </div>
    </footer>
  );
}
