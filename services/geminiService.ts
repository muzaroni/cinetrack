
import { GoogleGenAI, Type } from "@google/genai";
import { AggregateRatings, ShowURLs } from "../types";

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
  sources?: { title: string; uri: string }[];
}

export const fetchShowMetadata = async (title: string, season: number): Promise<Partial<FetchShowResult>> => {
  // Initialization must happen right before use with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const prompt = `Find comprehensive metadata for Season ${season} of the TV series "${title}".
    Provide URLs for IMDb, Rotten Tomatoes, Metacritic, and a YouTube trailer.
    Include current scores for these platforms. 
    Include total episode count and average length per episode in minutes.
    Provide a concise synopsis (max 3 sentences).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
          required: ["network", "genres", "synopsis"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    // Extract grounding sources as required by guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return {
      network: data.network || 'Unknown',
      genres: data.genres || [],
      episodeCount: data.episodeCount || 0,
      avgEpisodeLength: data.avgEpisodeLength || 0,
      synopsis: data.synopsis || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      isOngoing: !!data.isOngoing,
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
      sources
    };
  } catch (error) {
    console.error("Gemini Metadata Fetch Error:", error);
    return {};
  }
};
