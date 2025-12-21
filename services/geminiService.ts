
import { GoogleGenAI, Type } from "@google/genai";
import { AggregateRatings, ShowURLs } from "../types";

// Always use the process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface FetchShowResult {
  network: string;
  genres: string[];
  aggregateRatings: AggregateRatings;
  urls: ShowURLs;
  synopsis: string;
  isOngoing: boolean;
  startDate: string;
  endDate: string;
  episodeCount: number;
  avgEpisodeLength: number;
}

export const fetchShowMetadata = async (title: string, season: number): Promise<Partial<FetchShowResult>> => {
  try {
    const prompt = `Perform an exhaustive and precise search for the TV series "${title}" to find metadata specifically for Season ${season}.
    
    CRITICAL INSTRUCTIONS FOR EXTERNAL LINKS:
    1. IMDb: Find the official series page. Extract Title ID (tt...).
    2. Rotten Tomatoes: Find the specific TV show season page (e.g., rottentomatoes.com/tv/show_name/s0${season}). Extract the Tomatometer score.
    3. Metacritic: Find the specific TV show season page.
    4. MyAnimeList: Only provide if this is an Anime series.
    5. Trailer: Find the official YouTube trailer for specifically Season ${season} of "${title}".
    
    METADATA REQUIREMENTS:
    - Official Network
    - Primary Genres
    - Episode Count for this specific season
    - Average Episode Length (in minutes)
    - IMDb rating (numeric)
    - Rotten Tomatoes Tomatometer score (numeric 0-100)
    - Metacritic score (numeric)
    - MyAnimeList score (if applicable)
    - A 2-3 sentence synopsis of Season ${season}
    - Airing status and approximate air dates (YYYY-MM-DD format if possible).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            network: { type: Type.STRING },
            genres: { type: Type.ARRAY, items: { type: Type.STRING } },
            episodeCount: { type: Type.NUMBER },
            avgEpisodeLength: { type: Type.NUMBER },
            imdbRating: { type: Type.NUMBER },
            rottenTomatoesScore: { type: Type.NUMBER },
            metacriticScore: { type: Type.NUMBER },
            myAnimeListScore: { type: Type.NUMBER },
            trailerUrl: { type: Type.STRING },
            imdbUrl: { type: Type.STRING },
            rottenTomatoesUrl: { type: Type.STRING },
            metacriticUrl: { type: Type.STRING },
            myAnimeListUrl: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            isOngoing: { type: Type.BOOLEAN },
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING }
          },
          required: ["network", "genres", "synopsis", "imdbUrl", "episodeCount", "avgEpisodeLength"]
        }
      }
    });

    const data = JSON.parse(response.text);

    return {
      network: data.network || 'Unknown',
      genres: data.genres || [],
      aggregateRatings: {
        imdb: data.imdbRating,
        rottenTomatoes: data.rottenTomatoesScore,
        metacritic: data.metacriticScore,
        myanimelist: data.myAnimeListScore
      },
      urls: {
        imdb: data.imdbUrl,
        rottenTomatoes: data.rottenTomatoesUrl,
        metacritic: data.metacriticUrl,
        myanimelist: data.myAnimeListUrl,
        trailer: data.trailerUrl
      },
      synopsis: data.synopsis,
      isOngoing: data.isOngoing,
      startDate: data.startDate,
      endDate: data.endDate,
      episodeCount: data.episodeCount,
      avgEpisodeLength: data.avgEpisodeLength
    };
  } catch (error) {
    console.error("Error fetching show metadata:", error);
    return {};
  }
};
