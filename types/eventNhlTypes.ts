import { ApiResponse, Season } from './espnApiTypes';

export interface NhlResponse extends ApiResponse {
  season: Season;
  day: { date: string };
}
