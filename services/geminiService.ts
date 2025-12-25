
import { GoogleGenAI } from "@google/genai";
import { AggregateRatings, ShowURLs, GroundingLink } from "../types";

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
  groundingLinks: GroundingLink[];
}

export const fetchShowMetadata = async (title: string, season: number): Promise<Partial<FetchShowResult>> => {
  try {
    // Re-initialize to ensure the latest environment variables are used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Perform a search for the TV series "${title}" Season ${season}.
    
    Provide the found metadata in a single JSON block inside a markdown code block:
    {
      "network": "string",
      "genres": ["string"],
      "episodeCount": number,
      "avgEpisodeLength": number,
      "imdbRating": number,
      "rottenTomatoesScore": number,
      "metacriticScore": number,
      "myAnimeListScore": number,
      "trailerUrl": "Official YouTube trailer link for ${title} Season ${season}",
      "imdbUrl": "string",
      "rottenTomatoesUrl": "string",
      "metacriticUrl": "string",
      "myAnimeListUrl": "string",
      "synopsis": "2-3 sentence summary",
      "isOngoing": boolean,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    }`;

    // Note: responseMimeType: "application/json" is omitted because it conflicts with the search tool
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || "";
    
    // Robustly extract JSON block using regex
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : {};

    // Extract grounding chunks for compliance
    const groundingLinks: GroundingLink[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          groundingLinks.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

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
      avgEpisodeLength: data.avgEpisodeLength,
      groundingLinks: groundingLinks
    };
  } catch (error) {
    console.error("Error fetching show metadata:", error);
    return {};
  }
};
