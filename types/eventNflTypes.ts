export interface Season {
  type: number;
  year: number;
}

export interface Venue {
  id: string;
  fullName: string;
  capacity: number;
  indoor: boolean;
  address: {
    city: string;
    state: string;
  };
}

export interface Team {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  venue: {
    id: string;
  };
}

export interface Week {
  number: number;
  teamsOnBye: Team[];
}

export interface Competitor {
  id: string;
  uid: string;
  order: number;
  homeAway: 'home' | 'away';
  team: Team;
  logo: string;
  score: string;
}

export interface Odds {
  provider: {
    id: string;
    name: string;
    priority: number;
  };
  details: string;
  overUnder: number;
}

export interface Broadcast {
  market: string;
  names: string[];
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  startDate: string;
  type: {
    timeValid: boolean;
    neutralSite: boolean;
    conferenceCompetition: boolean;
    recent: boolean;
  };
  odds: Odds[];
  broadcasts: Broadcast[];
  competitors: Team[];
  venue: Venue;
}

export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: Season;
  week: {
    number: number;
  };
  competitions: Competition[]
}

export interface ApiResponse {
  week: Week;
  events: Event[];
}
