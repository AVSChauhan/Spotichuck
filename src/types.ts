export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string; // 30s preview link (or YouTube audio/video stream)
  durationSeconds: number; // Duration in seconds
  videoId?: string; // YouTube video ID for full playback
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

export interface DJMessage {
  id: string;
  role: "user" | "dj";
  text: string;
  playlist?: { title: string; artist: string; id?: string }[];
  timestamp: Date;
}
