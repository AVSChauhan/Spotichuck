import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

let geminiSearchDisabledUntil = 0;

/**
 * Helper to get YouTube ID via Gemini Search Grounding (Highly robust)
 */
async function searchYouTubeWithAI(query: string): Promise<string | null> {
  if (!ai) return null;
  if (Date.now() < geminiSearchDisabledUntil) {
    console.warn("Gemini Search Grounding is temporarily suspended due to quota limits, skipping to fast search backfalls.");
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Find the 11-character YouTube video ID for the query: "${query} official audio". Return ONLY the exact 11-char video ID (e.g. dQw4w9WgXcQ). If you cannot find one, return exactly "NOT_FOUND".`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });
    const text = response.text?.trim() || "";
    if (text && text !== "NOT_FOUND") {
      const match = text.match(/[A-Za-z0-9_-]{11}/);
      if (match) {
        return match[0];
      }
    }
  } catch (err: any) {
    console.error("Gemini YouTube Search Grounding failed:", err);
    const errString = String(err?.message || err || "");
    if (errString.includes("429") || errString.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Detected Gemini quota exhaustion (429/RESOURCE_EXHAUSTED). Suspending Gemini search grounding for 5 minutes.");
      geminiSearchDisabledUntil = Date.now() + 5 * 60 * 1000;
    }
  }
  return null;
}

/**
 * Helper to fallback to DuckDuckGo HTML site search which is extremely lightweight and fast
 */
async function searchYouTubeDuckDuckGo(query: string): Promise<string | null> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=site:youtube.com+${encodeURIComponent(query + " official audio")}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/(?:v=|v%3D)([A-Za-z0-9_-]{11})/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (err) {
    console.error("DuckDuckGo scraping failed:", err);
  }
  return null;
}

/**
 * Helper to fallback to Bing site search
 */
async function searchYouTubeBing(query: string): Promise<string | null> {
  try {
    const url = `https://www.bing.com/search?q=site:youtube.com+${encodeURIComponent(query + " official audio")}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/(?:v=|v%3D)([A-Za-z0-9_-]{11})/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (err) {
    console.error("Bing scraping failed:", err);
  }
  return null;
}

const INVIDIOUS_INSTANCES = [
  "https://invidious.flokinet.to",
  "https://invidious.projectsegfaut.im",
  "https://yewtu.be",
  "https://iv.ggtyler.dev",
  "https://inv.tux.im",
  "https://invidious.privacydev.net"
];

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function searchYouTubeInvidious(query: string): Promise<string | null> {
  const searchQuery = encodeURIComponent(query + " official audio");
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${searchQuery}&type=video`;
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      }, 2500);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const video = data.find((item: any) => item && (item.type === "video" || item.videoId));
          if (video && video.videoId) {
            console.log(`Successfully found Youtube video via Invidious instance ${instance}`);
            return video.videoId;
          }
        }
      }
    } catch (err: any) {
      console.warn(`Invidious instance ${instance} fail or aborted:`, err?.message || err);
    }
  }
  return null;
}

/**
 * Robust YouTube search with multiple fallback tiers.
 * Resolves the 11-char video ID for a query.
 */
async function searchYouTube(query: string): Promise<string | null> {
  // Tier 1: Gemini Search Grounding (Highly reliable, uses real-time search engine)
  if (ai) {
    const aiId = await searchYouTubeWithAI(query);
    if (aiId) {
      console.log(`Resolved video ID "${aiId}" using Gemini Search Grounding for "${query}"`);
      return aiId;
    }
  }

  // Tier 2: Invidious structured JSON search APIs (Fast, highly stable, avoids bot-blocks/scrapes)
  const invidiousId = await searchYouTubeInvidious(query);
  if (invidiousId) {
    console.log(`Resolved video ID "${invidiousId}" using Invidious API for "${query}"`);
    return invidiousId;
  }

  // Tier 3: DuckDuckGo HTML scrape (Extremely resilient against bot blocks)
  const ddgId = await searchYouTubeDuckDuckGo(query);
  if (ddgId) {
    console.log(`Resolved video ID "${ddgId}" using DuckDuckGo fallback for "${query}"`);
    return ddgId;
  }

  // Tier 4: Bing HTML scrape
  const bingId = await searchYouTubeBing(query);
  if (bingId) {
    console.log(`Resolved video ID "${bingId}" using Bing fallback for "${query}"`);
    return bingId;
  }

  // Tier 4: Direct YouTube scrapers
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " official audio")}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.ok) {
      const html = await res.text();
      
      const matches = html.match(/"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/);
      if (matches && matches[1]) {
        console.log(`Resolved video ID "${matches[1]}" using primary YouTube scrape matches for "${query}"`);
        return matches[1];
      }
      
      const hrefMatches = html.match(/\/watch\?v=([A-Za-z0-9_-]{11})/);
      if (hrefMatches && hrefMatches[1]) {
        console.log(`Resolved video ID "${hrefMatches[1]}" using secondary YouTube scrape matches for "${query}"`);
        return hrefMatches[1];
      }
    }
  } catch (err) {
    console.error("Direct YouTube scraper failed:", err);
  }

  return null;
}

// REST API Endpoints

// 1. YouTube Search API proxy
app.get("/api/youtube-search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }
  
  const videoId = await searchYouTube(q);
  if (videoId) {
    res.json({ videoId });
  } else {
    res.status(404).json({ error: "No video found for your query" });
  }
});

// 2. AI Recommendation DJ
app.post("/api/recommend", async (req, res) => {
  const { prompt, currentSong, history = [] } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body" });
  }

  if (!ai) {
    // Graceful fallback with zero crash if Gemini key is missing
    return res.json({
      reply: `I'd love to help cue up some tunes for you! Since the server AI key is not currently configured, I've selected a premier list of vibes for "${prompt}" from our ultimate database. Enjoy!`,
      playlist: [
        { title: "Blinding Lights", artist: "The Weeknd" },
        { title: "As It Was", artist: "Harry Styles" },
        { title: "Flowers", artist: "Miley Cyrus" },
        { title: "Cruel Summer", artist: "Taylor Swift" },
        { title: "Stay", artist: "The Kid LAROI & Justin Bieber" }
      ]
    });
  }

  try {
    const formattedHistory = history
      .slice(-4)
      .map((h: any) => `${h.role === "user" ? "User" : "DJ"}: ${h.text}`)
      .join("\n");

    const systemInstruction = `You are "Gemini DJ", an ultra-cool, witty, and knowledgeable AI radio DJ on Spotify.
Your job is to respond enthusiastically to the user's mood, chat statement, or musical request, and curate exactly 5 real and famous songs that fit the vibe perfectly.
Produce your response in structured JSON format with:
1. 'reply': A short, engaging, radio-host-style commentary (2-3 sentences max) introducing the selection. Use music lingo, keep it charismatic and warm.
2. 'playlist': A list of exactly 5 real tracks, each having 'title' and 'artist' keys.

Guidelines:
- Match the user's requested vibe: ${prompt}
- Avoid obscure references unless asked; pick famous tracks that exist on iTunes/Spotify.
- Current playing track: ${currentSong ? `${currentSong.title} by ${currentSong.artist}` : 'None'}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `User's prompt: ${prompt}\n\nRecent chat history:\n${formattedHistory}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["reply", "playlist"],
          properties: {
            reply: {
              type: Type.STRING,
              description: "A charismatic 2-3 sentence DJ commentary introducing the songs."
            },
            playlist: {
              type: Type.ARRAY,
              description: "A list of exactly 5 recommended songs.",
              items: {
                type: Type.OBJECT,
                required: ["title", "artist"],
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING }
                }
              }
            }
          }
        },
        temperature: 0.8,
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gemini recommendation failed:", err);
    res.status(500).json({ error: "Failed to generate recommendations", details: err.message });
  }
});

// 3. AI Scrolling Lyrics Generator
app.get("/api/lyrics", async (req, res) => {
  const { title, artist, durationSeconds = 30 } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing song title or artist" });
  }

  const limitSeconds = Number(durationSeconds) || 30;

  if (!ai) {
    // Generate beautiful generic lyrics based on title & artist for the 30-sec preview!
    const fallbackLines = [
      { text: `🎶 [Intro Beats - ${title} by ${artist}]`, time: 0 },
      { text: "Yeah, you know this vibe is real...", time: 3 },
      { text: `And we are playing ${title} right here, right now`, time: 7 },
      { text: "Turn up the volume, let the music take control", time: 12 },
      { text: `Feel the rhythm of ${artist}'s amazing melody`, time: 17 },
      { text: "Moving to the beat, we never want to stop...", time: 22 },
      { text: "🎶 [Outro - Stream full track via YouTube Panel!] 🎶", time: 27 }
    ];
    return res.json({ lyrics: fallbackLines });
  }

  try {
    const prompt = `Generate synchronization timestamps for the song "${title}" by "${artist}". 
Provide lyrics lines spaced between 0 and ${limitSeconds} seconds.
Each line must have a 'time' (integer from 0 to ${limitSeconds} indicating the second mark) and a 'text' (the lyrics line).
Provide real lyrics lines of the song if you know them. If not, generate highly believable aesthetic lyrics fitting of the song's name and style.
Return the output in JSON format matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional lyrics synchronization system. Always output JSON matching the exact schema requested.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["lyrics"],
          properties: {
            lyrics: {
              type: Type.ARRAY,
              description: "A list of synchronized lyric lines.",
              items: {
                type: Type.OBJECT,
                required: ["text", "time"],
                properties: {
                  text: { type: Type.STRING, description: "The lyric text or description of the sound" },
                  time: { type: Type.INTEGER, description: "Seconds from the start of the song (0 to 30)" }
                }
              }
            }
          }
        },
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    // Sort lyrics by time to capture correct order
    if (parsed.lyrics && Array.isArray(parsed.lyrics)) {
      parsed.lyrics.sort((a: any, b: any) => a.time - b.time);
    }
    res.json(parsed);
  } catch (err: any) {
    console.error("Lyrics generation failed:", err);
    res.status(500).json({ error: "Failed to generate lyrics" });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
