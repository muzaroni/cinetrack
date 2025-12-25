
export enum ShowStatus {
  COMPLETED = 'Completed',
  WATCHING = 'Watching',
  RECOMMENDED = 'Recommended',
  ON_HOLD = 'On Hold',
  DROPPED = 'Dropped'
}

export interface AggregateRatings {
  imdb?: number;
  metacritic?: number;
  myanimelist?: number;
  rottenTomatoes?: number;
}

export interface ShowURLs {
  imdb?: string;
  metacritic?: string;
  myanimelist?: string;
  rottenTomatoes?: string;
  trailer?: string;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface TVShowSeason {
  id: string;
  title: string;
  seasonNumber: number;
  network: string;
  genres: string[];
  userRating: number;
  aggregateRatings: AggregateRatings;
  urls: ShowURLs;
  status: ShowStatus;
  review: string;
  synopsis: string;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
  createdAt: number;
  episodeCount?: number;
  avgEpisodeLength?: number;
  groundingLinks?: GroundingLink[];
}

export type ViewType = 'grid' | 'stats';
