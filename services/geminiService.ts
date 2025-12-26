
import { AggregateRatings, ShowURLs } from "../types";

// Note: Using the same process.env.API_KEY variable. 
// Ensure this variable is set to your OMDB API Key in your environment/secrets.
const API_KEY = process.env.API_KEY;

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
  if (!API_KEY) {
    console.error("OMDB API Key is missing. Please set process.env.API_KEY.");
    return {};
  }

  try {
    // 1. Fetch main show details (Ratings, Plot, etc.)
    const showResponse = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
    const showData = await showResponse.json();

    if (showData.Response === "False") {
      console.warn("OMDB Error:", showData.Error);
      return {};
    }

    // 2. Fetch specific season details (Episode Count)
    const seasonResponse = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&Season=${season}&apikey=${API_KEY}`);
    const seasonData = await seasonResponse.json();

    // Map OMDB Ratings to our structure
    const ratings: AggregateRatings = {
      imdb: showData.imdbRating !== "N/A" ? parseFloat(showData.imdbRating) : undefined,
    };

    if (showData.Ratings && Array.isArray(showData.Ratings)) {
      showData.Ratings.forEach((r: any) => {
        if (r.Source === "Rotten Tomatoes") {
          ratings.rottenTomatoes = parseInt(r.Value.replace('%', ''));
        } else if (r.Source === "Metacritic") {
          ratings.metacritic = parseInt(r.Value.split('/')[0]);
        }
      });
    }

    // Map Runtime (e.g., "45 min") to number
    const runtime = showData.Runtime !== "N/A" ? parseInt(showData.Runtime.split(' ')[0]) : 30;

    // Parse Release Date (e.g., "30 Mar 2022") to YYYY-MM-DD
    let startDate = "";
    if (showData.Released && showData.Released !== "N/A") {
      const d = new Date(showData.Released);
      if (!isNaN(d.getTime())) {
        startDate = d.toISOString().split('T')[0];
      }
    }

    return {
      network: showData.Production || 'Unknown',
      genres: showData.Genre !== "N/A" ? showData.Genre.split(',').map((g: string) => g.trim()) : [],
      aggregateRatings: ratings,
      urls: {
        imdb: showData.imdbID ? `https://www.imdb.com/title/${showData.imdbID}/` : undefined,
      },
      synopsis: showData.Plot !== "N/A" ? showData.Plot : "",
      isOngoing: showData.EndYear === "Present",
      startDate: startDate,
      episodeCount: seasonData.Episodes ? seasonData.Episodes.length : 0,
      avgEpisodeLength: runtime
    };
  } catch (error) {
    console.error("Error fetching show metadata from OMDB:", error);
    return {};
  }
};
