
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
    // Create instance inside function to ensure environment variables are correctly accessed
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Perform an exhaustive search for the TV series "${title}" specifically for Season ${season}.
    
    CRITICAL: You must provide the data in a single valid JSON code block.
    
    DATA TO FIND:
    - Official Network
    - Primary Genres (array)
    - Episode Count for Season ${season}
    - Avg Episode Length in minutes
    - Numeric ratings: IMDb, Rotten Tomatoes (0-100), Metacritic (0-100), MyAnimeList (if applicable)
    - Direct URLs: IMDb page, RT Season page, Metacritic Season page, MAL page
    - Trailer: Search for "${title} Season ${season} official trailer" and provide the YouTube link.
    - Synopsis: 2-3 sentences about this specific season.
    - Status: isOngoing (boolean), startDate, and endDate (YYYY-MM-DD).
    
    RESPONSE FORMAT:
    \`\`\`json
    {
      "network": "string",
      "genres": ["string"],
      "episodeCount": number,
      "avgEpisodeLength": number,
      "imdbRating": number,
      "rottenTomatoesScore": number,
      "metacriticScore": number,
      "myAnimeListScore": number,
      "trailerUrl": "string",
      "imdbUrl": "string",
      "rottenTomatoesUrl": "string",
      "metacriticUrl": "string",
      "myAnimeListUrl": "string",
      "synopsis": "string",
      "isOngoing": boolean,
      "startDate": "string",
      "endDate": "string"
    }
    \`\`\``;

    // We do NOT use responseMimeType: "application/json" here because it conflicts with the googleSearch tool's grounding metadata.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || "";
    
    // Robustly extract JSON using regex to avoid issues with surrounding conversational text or citations
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : {};

    // Extract grounding chunks as required by the Gemini API rules
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
