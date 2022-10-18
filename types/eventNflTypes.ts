import { ApiResponse, Season, Team } from './espnApiTypes';

export interface Week {
  number: number;
  teamsOnBye: Team[];
}

export interface NflResponse extends ApiResponse {
  week: Week;
  season: Season;
};
