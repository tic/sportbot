import { ApiResponse, Season } from './espnApiTypes';

export interface MlbResponse extends ApiResponse {
  season: Season;
  day: { date: string };
}
