/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import PlayBar from "./components/PlayBar";
import HomePanel from "./components/HomePanel";
import SearchPanel from "./components/SearchPanel";
import LibraryPanel from "./components/LibraryPanel";
import GeminiDJPanel from "./components/GeminiDJPanel";
import LyricsPanel from "./components/LyricsPanel";
import { Track, Playlist } from "./types";
import { Music, LayoutList, Volume2, Info, Disc, Globe, Tv, Shield, Sparkles, Loader2, ChevronUp, ChevronDown, ListMusic } from "lucide-react";

export default function App() {
  // Navigation tabs states: "home" | "search" | "library" | "geminidj"
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Playback States
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30); // iTunes standard is 30s
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("symphony-volume");
    return saved ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Panel overlays toggles
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);

  // Playback Mode: "preview" (native 30s premium) or "youtube" (full track video stream)
  const [playMode, setPlayMode] = useState<"preview" | "youtube">("preview");
  const [loadingFullSong, setLoadingFullSong] = useState<boolean>(false);
  const [resolvedYoutubeId, setResolvedYoutubeId] = useState<string | null>(null);
  const [musicSources, setMusicSources] = useState<any[]>([]);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [sourcesListExpanded, setSourcesListExpanded] = useState<boolean>(false);

  // Player queue log
  const [playbackQueue, setPlaybackQueue] = useState<Track[]>([]);
  const [currentQueueIdx, setCurrentQueueIdx] = useState<number>(-1);

  // Custom User Saved Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("symphony-playlists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    // Default playlists
    return [
      {
        id: "liked-songs",
        name: "Liked Songs",
        description: "Your absolute favorite music pieces",
        coverUrl: "",
        tracks: [],
      }
    ];
  });

  // Track Liked Songs index set for instant O(1) checks
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => {
    const likedList = playlists.find((p) => p.id === "liked-songs");
    return new Set(likedList ? likedList.tracks.map((t) => t.id) : []);
  });

  // Native HTMLAudioElement reference for background player
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Track state handles
    const handleTimeUpdate = () => {
      // If preview mode, or full song mode with direct audio file stream, update current time
      const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
      if (playMode === "preview" || isDirect) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
      if (playMode === "preview") {
        setDuration(audio.duration || 30);
      } else if (isDirect) {
        setDuration(audio.duration || currentTrack?.durationSeconds || 180);
      }
    };

    const handleCanPlay = () => {
      const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
      if (isPlaying && (playMode === "preview" || isDirect)) {
        audio.play().catch((err) => console.log("Play failed dynamically:", err));
      }
    };

    const handleEnded = () => {
      const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
      if (playMode === "preview" || isDirect) {
        handleTrackFinished();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);

    // Initial config
    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isPlaying, playMode, isMuted, volume, musicSources, activeSourceIndex, currentTrack]);

  // Sync volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem("symphony-volume", String(volume));
  }, [volume, isMuted]);

  // Sync playback speed rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentTrack]);

  // Sync playlists changes to client storage
  useEffect(() => {
    localStorage.setItem("symphony-playlists", JSON.stringify(playlists));
    const likedList = playlists.find((p) => p.id === "liked-songs");
    setLikedSongIds(new Set(likedList ? likedList.tracks.map((t) => t.id) : []));
  }, [playlists]);

  // Handle automatic song ticking if playing iframe-based YouTube or widget players
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
    if (isPlaying && playMode === "youtube" && !isDirect) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handleTrackFinished();
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playMode, duration, musicSources, activeSourceIndex]);

  // Synchronize state with YouTube IFrame Player (play/pause/volume/mute)
  useEffect(() => {
    if (playMode === "youtube" && resolvedYoutubeId && resolvedYoutubeId !== "direct_embed") {
      const timeoutId = setTimeout(() => {
        const iframe = document.getElementById("youtube-player-iframe") as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow) {
          const command = isPlaying ? "playVideo" : "pauseVideo";
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: command, args: "" }),
            "*"
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "setVolume", args: [Math.round(volume * 100)] }),
            "*"
          );
          const muteCommand = isMuted ? "mute" : "unmute";
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: muteCommand, args: "" }),
            "*"
          );
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlaying, playMode, resolvedYoutubeId, volume, isMuted]);

  // Trigger song change action
  const handlePlayTrack = async (track: Track) => {
    // 1. Pause existing preview
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);

    // Feed song into the queue if it behaves as a single track outside active playlist
    const inQueueIdx = playbackQueue.findIndex((t) => t.id === track.id);
    if (inQueueIdx >= 0) {
      setCurrentQueueIdx(inQueueIdx);
    } else {
      // Create single-item queue or append
      const newQueue = [...playbackQueue];
      newQueue.push(track);
      setPlaybackQueue(newQueue);
      setCurrentQueueIdx(newQueue.length - 1);
    }

    // Handle initial preview setup
    if (playMode === "preview") {
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.load();
        audioRef.current.play().catch((err) => console.log("Can-play start failed:", err));
      }
      setDuration(30); // Previews are 30 seconds
    } else {
      // Resolve YouTube Video Id if selected YouTube mode
      await resolveAndPlayYoutubeStream(track);
    }
  };

  // Scrape multi-source platforms (YouTube, YouTube Music, SoundCloud, Direct Web Audios)
  const resolveAndPlayYoutubeStream = async (track: Track) => {
    setLoadingFullSong(true);
    setResolvedYoutubeId(null);
    setMusicSources([]);
    setActiveSourceIndex(0);

    try {
      const response = await fetch(`/api/music-sources?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      if (!response.ok) throw new Error("Multi-source fetch failed");
      const data = await response.json();
      
      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        setMusicSources(data.sources);
        const firstSource = data.sources[0];
        setActiveSourceIndex(0);
        setDuration(track.durationSeconds || 180);

        if (firstSource.type === "direct") {
          if (audioRef.current) {
            audioRef.current.src = firstSource.url;
            audioRef.current.load();
            if (isPlaying) {
              audioRef.current.play().catch((e) => console.log("Direct play autoplay failed:", e));
            }
          }
        } else {
          const match = firstSource.url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
          if (match && match[1]) {
            setResolvedYoutubeId(match[1]);
          } else {
            setResolvedYoutubeId("direct_embed");
          }
        }
      } else {
        throw new Error("No available sources returned");
      }
      setLoadingFullSong(false);
      return; // Handled within new flow!
    } catch (newFlowErr) {
      console.warn("New multi-source lookup failed, trying traditional fallback path:", newFlowErr);
    }

    // traditional fallback path
    try {
      const searchTerms = `${track.title} ${track.artist}`;
      const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchTerms)}`);
      if (!response.ok) throw new Error("Scrape failed");
      const data = await response.json();
      
      setResolvedYoutubeId(data.videoId);
      setDuration(track.durationSeconds || 180); // Fallback estimate
    } catch (err) {
      console.error("YouTube stream resolve failed:", err);
      // Fallback: stay in preview mode
      setPlayMode("preview");
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.load();
        audioRef.current.play().catch((e) => console.log(e));
      }
      setDuration(30);
      alert("Uh oh! Standard full-track video scrape is currently busy. Reverting back to lightning fast preview stream!");
    } finally {
      setLoadingFullSong(false);
    }
  };

  const handleSelectSource = (index: number) => {
    if (!musicSources || !musicSources[index]) return;
    setActiveSourceIndex(index);
    const source = musicSources[index];

    setCurrentTime(0);

    if (source.type === "direct") {
      setResolvedYoutubeId(null);
      if (audioRef.current) {
        audioRef.current.src = source.url;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch((err) => console.log("Direct source stream play error:", err));
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const match = source.url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (match && match[1]) {
        setResolvedYoutubeId(match[1]);
      } else {
        setResolvedYoutubeId("direct_embed");
      }
    }
  };

  // Play Pause Core Toggler
  const handlePlayPause = () => {
    if (!currentTrack) return;
    
    const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";

    if (isPlaying) {
      setIsPlaying(false);
      if ((playMode === "preview" || isDirect) && audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      if ((playMode === "preview" || isDirect) && audioRef.current) {
        audioRef.current.play().catch((err) => console.log(err));
      }
    }
  };

  // Custom seeking handle
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    const isDirect = playMode === "youtube" && musicSources[activeSourceIndex]?.type === "direct";
    if ((playMode === "preview" || isDirect) && audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  // Toggle modes: Preview vs YouTube
  const handleTogglePlayMode = async () => {
    if (!currentTrack) return;
    
    const nextMode = playMode === "preview" ? "youtube" : "preview";
    setPlayMode(nextMode);
    setCurrentTime(0);

    // Pause standard audio if switching to youtube
    if (nextMode === "youtube") {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      await resolveAndPlayYoutubeStream(currentTrack);
    } else {
      // Switching to preview
      setResolvedYoutubeId(null);
      setMusicSources([]);
      setActiveSourceIndex(0);
      if (audioRef.current) {
        audioRef.current.src = currentTrack.previewUrl;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch((e) => console.log(e));
        }
      }
      setDuration(30);
    }
  };

  // Next song handler
  const handleNextTrack = () => {
    if (playbackQueue.length === 0) return;

    let nextIdx = currentQueueIdx;

    if (repeat) {
      // Loop same song
      handleSeek(0);
      if (playMode === "preview" && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((e) => console.log(e));
      }
      return;
    } else if (shuffle) {
      nextIdx = Math.floor(Math.random() * playbackQueue.length);
    } else {
      nextIdx = (currentQueueIdx + 1) % playbackQueue.length;
    }

    const nextTrack = playbackQueue[nextIdx];
    setCurrentQueueIdx(nextIdx);
    handlePlayTrack(nextTrack);
  };

  // Previous song handler
  const handlePreviousTrack = () => {
    if (playbackQueue.length === 0) return;

    if (currentTime > 3) {
      // Restart current song
      handleSeek(0);
      return;
    }

    let prevIdx = currentQueueIdx;
    if (shuffle) {
      prevIdx = Math.floor(Math.random() * playbackQueue.length);
    } else {
      prevIdx = (currentQueueIdx - 1 + playbackQueue.length) % playbackQueue.length;
    }

    const prevTrack = playbackQueue[prevIdx];
    setCurrentQueueIdx(prevIdx);
    handlePlayTrack(prevTrack);
  };

  // Action callback when track reaches end
  const handleTrackFinished = () => {
    handleNextTrack();
  };

  // Toggle song like (add / remove from Liked Songs)
  const handleToggleLike = (track: Track) => {
    setPlaylists((prev) => {
      return prev.map((playlist) => {
        if (playlist.id === "liked-songs") {
          const isExist = playlist.tracks.some((t) => t.id === track.id);
          const updatedTracks = isExist
            ? playlist.tracks.filter((t) => t.id !== track.id)
            : [...playlist.tracks, track];
          return {
            ...playlist,
            tracks: updatedTracks,
          };
        }
        return playlist;
      });
    });
  };

  // Create a brand new empty custom playlist
  const handleCreatePlaylist = () => {
    const name = prompt("Name your playlist:", `New Playlist #${playlists.length}`);
    if (!name || !name.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      description: "Custom curated set crafted with Symphony Player.",
      coverUrl: "",
      tracks: [],
    };

    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
  };

  // Add individual track to dedicated custom playlist
  const handleAddTrackToPlaylist = (track: Track, playlistId: string) => {
    setPlaylists((prev) => {
      return prev.map((playlist) => {
        if (playlist.id === playlistId) {
          const isExist = playlist.tracks.some((t) => t.id === track.id);
          if (isExist) {
            alert(`"${track.title}" is already inside "${playlist.name}"!`);
            return playlist;
          }
          return {
            ...playlist,
            tracks: [...playlist.tracks, track],
          };
        }
        return playlist;
      });
    });
  };

  // Remove individual track from custom playlist
  const handleRemoveTrackFromPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists((prev) => {
      return prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: p.tracks.filter((t) => t.id !== trackId),
          };
        }
        return p;
      });
    });
  };

  // Delete brand new custom playlist
  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    setSelectedPlaylistId(null);
    setActiveTab("home");
  };

  // Appends tracks and loads queue
  const handleAddTracksToQueue = (newTracks: Track[]) => {
    setPlaybackQueue(newTracks);
    setCurrentQueueIdx(0);
  };

  // Creates custom playlist from recommended set
  const handleCreateCustomPlaylistWithTracks = (name: string, tracks: Track[]) => {
    const newPlaylist: Playlist = {
      id: `playlist-ai-${Date.now()}`,
      name,
      description: `Bespeak playlist generated on-air by Gemini Music DJ. Prompt: "${name}"`,
      coverUrl: tracks[0]?.coverUrl || "",
      tracks,
    };

    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
    setActiveTab("library");
  };

  // Handler to select and view playlist library details
  const handleSelectPlaylist = (id: string | null) => {
    setSelectedPlaylistId(id);
    if (id) {
      setActiveTab("library");
    }
  };

  // Fetch the active selected playlist details
  const activePlaylistData = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId) || null
    : null;

  return (
    <div id="root-symphony" className="h-screen w-screen flex flex-col bg-neutral-950 font-sans text-white overflow-hidden select-none">
      
      {/* High-level Content Workspace Frame */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left Side Navigation Panel */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
        />

        {/* Mid View Content Panels Routing */}
        <main className="flex-1 flex flex-col min-h-0 bg-neutral-900/60 overflow-hidden relative">
          
          {selectedPlaylistId ? (
            <LibraryPanel
              activePlaylist={activePlaylistData}
              onPlayTrack={(t) => {
                // Pre-queue total tracks from the playlist for continuous playback!
                if (activePlaylistData) {
                  setPlaybackQueue(activePlaylistData.tracks);
                  const trackIdx = activePlaylistData.tracks.findIndex((i) => i.id === t.id);
                  setCurrentQueueIdx(trackIdx >= 0 ? trackIdx : 0);
                }
                handlePlayTrack(t);
              }}
              onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              likedSongIds={likedSongIds}
              onToggleLike={handleToggleLike}
            />
          ) : activeTab === "home" ? (
            <HomePanel
              onPlayTrack={(t) => {
                // When selecting home track, populate a simple 1-track queue or browse hits
                const homeTracks = [t];
                setPlaybackQueue(homeTracks);
                setCurrentQueueIdx(0);
                handlePlayTrack(t);
              }}
              onSelectPlaylist={handleSelectPlaylist}
              playlists={playlists}
              likedTracksCount={likedSongIds.size}
            />
          ) : activeTab === "search" ? (
            <SearchPanel
              onPlayTrack={(t) => {
                const searchQ = [t];
                setPlaybackQueue(searchQ);
                setCurrentQueueIdx(0);
                handlePlayTrack(t);
              }}
              onAddTrackToPlaylist={handleAddTrackToPlaylist}
              playlists={playlists}
              onToggleLike={handleToggleLike}
              likedSongIds={likedSongIds}
              currentPlayingTrackId={currentTrack?.id || null}
              isPlaying={isPlaying}
            />
          ) : (
            <GeminiDJPanel
              onPlayTrack={(t) => {
                handlePlayTrack(t);
              }}
              onAddTracksToQueue={handleAddTracksToQueue}
              onCreateCustomPlaylistWithTracks={handleCreateCustomPlaylistWithTracks}
              currentPlayingTrack={currentTrack}
            />
          )}

          {/* Floating Expandable Multi-Source Audios & Videos Board */}
          {playMode === "youtube" && musicSources && musicSources.length > 0 && (
            <div className={`absolute right-6 bottom-4 w-80 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col transition-all duration-300 animate-fade-in ${sourcesListExpanded ? "h-[320px]" : "h-[220px]"}`}>
              {/* Header */}
              <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-[10px] font-extrabold tracking-widest uppercase text-neutral-300 select-none">
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active: {musicSources[activeSourceIndex]?.name || "Auto Player"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-500 font-mono normal-case">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                  <button 
                    onClick={() => setSourcesListExpanded(!sourcesListExpanded)}
                    className="p-1 text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 rounded transition-colors"
                    title="Change Music Sourcing"
                  >
                    {sourcesListExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Main player box content based on stream type */}
              <div className="flex-1 bg-black relative overflow-hidden flex flex-col justify-center">
                {musicSources[activeSourceIndex]?.type === "direct" ? (
                  /* Audio file playback visuals */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 p-4 text-center select-none">
                    <div className="relative mb-2">
                      <Disc className={`w-14 h-14 text-emerald-500 ${isPlaying ? "animate-spin" : "opacity-60"}`} style={{ animationDuration: "3s" }} />
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full border border-neutral-700 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="block text-xs font-semibold text-neutral-300 text-ellipsis overflow-hidden whitespace-nowrap max-w-full">
                      {musicSources[activeSourceIndex]?.name || "High Bandwidth Stream"}
                    </span>
                    <span className="block text-[9px] text-neutral-500 font-mono tracking-tight mt-0.5">
                      Bypassing video streams with pure HTML5 audio
                    </span>
                  </div>
                ) : (
                  /* Frame playback embed */
                  <iframe
                    id="youtube-player-iframe"
                    src={musicSources[activeSourceIndex]?.url + `&mute=${isMuted ? 1 : 0}`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    referrerPolicy="no-referrer"
                    title="Symphony Custom Embed Stream player"
                  />
                )}
              </div>

              {/* Collapsed/Expanded Alternative Selector Panel */}
              {sourcesListExpanded && (
                <div className="h-28 bg-neutral-950 border-t border-neutral-800 overflow-y-auto p-1.5">
                  <div className="text-[8px] uppercase tracking-wider text-neutral-505 font-extrabold px-1.5 mb-1 flex items-center justify-between text-neutral-500">
                    <span>Available Streams ({musicSources.length})</span>
                    <span className="normal-case font-medium text-neutral-600">Bypass any blocks on the go!</span>
                  </div>
                  <div className="space-y-1">
                    {musicSources.map((src, idx) => {
                      const isActive = idx === activeSourceIndex;
                      return (
                        <button
                          key={src.id || idx}
                          onClick={() => handleSelectSource(idx)}
                          className={`w-full flex items-center justify-between p-1 px-2 rounded text-left text-xs transition-all cursor-pointer ${
                            isActive 
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/55" 
                              : "text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis max-w-[180px]">
                            {src.icon === "Youtube" && <Tv className="w-3.5 h-3.5 text-red-500" />}
                            {src.icon === "ShieldAlert" && <Shield className="w-3.5 h-3.5 text-purple-400" />}
                            {src.icon === "Music" && <Music className="w-3.5 h-3.5 text-rose-400" />}
                            {src.icon === "Music4" && <Music className="w-3.5 h-3.5 text-orange-500" />}
                            {src.icon === "Globe" && <Globe className="w-3.5 h-3.5 text-blue-400" />}
                            {src.icon === "Sparkles" && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="truncate">{src.name}</span>
                          </span>
                          <span className="text-[8px] font-mono uppercase opacity-60 bg-neutral-900 px-1 rounded text-neutral-400">
                            {src.domain || "web"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Side Lyrics Overlays Column Panel */}
        {showLyrics && (
          <div className="w-80 h-full border-l border-neutral-900 flex-shrink-0 animate-fade-in relative z-20">
            <LyricsPanel
              currentTrack={currentTrack}
              currentTime={currentTime}
              onClose={() => setShowLyrics(false)}
              playMode={playMode}
            />
          </div>
        )}

        {/* Right Side Queue list View Panel */}
        {showQueue && (
          <div className="w-80 h-full bg-[#121212] border-l border-[#282828] p-6 flex flex-col font-sans select-none animate-fade-in relative z-20 text-white">
            <div className="flex items-center justify-between mb-6 border-b border-[#282828] pb-4">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <LayoutList className="w-4.5 h-4.5 text-[#1DB954]" />
                <span>Play Queue</span>
              </h3>
              <button
                onClick={() => setShowQueue(false)}
                className="text-xs font-bold text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Current track row details */}
            <div className="mb-6">
              <span className="block text-[10px] font-extrabold tracking-widest uppercase text-[#1DB954] mb-2.5">
                Now Jamming
              </span>
              {currentTrack ? (
                <div className="flex items-center gap-3 bg-[#181818]/65 p-3 rounded-xl border border-[#282828] shadow-sm">
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-neutral-800 border border-neutral-800">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight mb-0.5">{currentTrack.title}</p>
                    <p className="text-[10px] text-neutral-400 truncate leading-tight">{currentTrack.artist}</p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-600 font-semibold p-4 bg-neutral-900/30 rounded-xl border border-[#282828] border-dashed text-center">
                  No active tracks feeding
                </div>
              )}
            </div>

            {/* Queue listing loop list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              <span className="block text-[10px] font-extrabold tracking-widest uppercase text-neutral-400 mb-1.5 label text-left">
                Next in queue ({playbackQueue.length > 0 ? playbackQueue.length - (currentQueueIdx + 1) : 0})
              </span>
              {playbackQueue.length > 0 && currentQueueIdx < playbackQueue.length - 1 ? (
                playbackQueue.slice(currentQueueIdx + 1).map((track, trackIdx) => (
                  <div
                    key={track.id + "-" + trackIdx}
                    onClick={() => {
                      const absoluteIdx = currentQueueIdx + 1 + trackIdx;
                      setCurrentQueueIdx(absoluteIdx);
                      handlePlayTrack(track);
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-[#181818]/60 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-[#282828]"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-neutral-900 border border-neutral-850">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#1ed760] transition-colors leading-tight mb-0.5">{track.title}</p>
                      <p className="text-[9px] text-neutral-400 truncate leading-tight">{track.artist}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-center py-12 text-neutral-600 font-bold border border-[#282828] border-dashed rounded-xl select-none leading-relaxed px-4">
                  Player queue is dry. Tracks will auto-loop once added from Search!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Play Controls Footer bar bottom */}
      <PlayBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={(v) => setVolume(v)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onNext={handleNextTrack}
        onPrevious={handlePreviousTrack}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle(!shuffle)}
        repeat={repeat}
        onToggleRepeat={() => setRepeat(!repeat)}
        showLyrics={showLyrics}
        onToggleLyrics={() => {
          setShowLyrics(!showLyrics);
          setShowQueue(false);
        }}
        showQueue={showQueue}
        onToggleQueue={() => {
          setShowQueue(!showQueue);
          setShowLyrics(false);
        }}
        isLiked={currentTrack ? likedSongIds.has(currentTrack.id) : false}
        onToggleLike={() => {
          if (currentTrack) {
            handleToggleLike(currentTrack);
          }
        }}
        playMode={playMode}
        onTogglePlayMode={handleTogglePlayMode}
        loadingFullSong={loadingFullSong}
        playbackRate={playbackRate}
        onChangePlaybackRate={(rate) => setPlaybackRate(rate)}
        musicSources={musicSources}
        activeSourceIndex={activeSourceIndex}
        sourcesListExpanded={sourcesListExpanded}
        onToggleSourcesExpanded={() => setSourcesListExpanded(!sourcesListExpanded)}
      />
    </div>
  );
}

// Simple Helper to format timeline
const formatDuration = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
};
