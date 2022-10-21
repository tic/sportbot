import { JsDateString } from './globalTypes';

export interface Team {
  team: {
    id: number,
    objectId: number,
    scribeId: number,
    slug: string,
    name: string,
    longName: string,
    abbreviation: string,
    isCountry: boolean,
    primaryColor: string | null,
  },
  isHome: boolean,
  isLive: boolean,
}

export interface Match {
  _uid: number;
  id: number;
  objectId: number;
  scribeId: number;
  slug: string;
  stage: 'SCHEDULED' | 'RUNNING' | 'FINISHED';
  state: 'PRE' | 'LIVE' | 'POST';
  internationalClassId: string | null;
  generalClassId: 4;
  subClassId: string | null;
  season: string;
  title: string;
  floodlit: string;
  startDate: JsDateString;
  endDate: JsDateString;
  startTime: JsDateString;
  timePublished: true;
  scheduleNote: string;
  isCancelled: false;
  coverage: string;
  coverageNote: string;
  liveStreamUrl: string | null;
  highlightsUrl: string | null;
  status: string;
  statusText: string;
  statusEng: string;
  internationalNumber: string | null;
  generalNumber: string | null;
  winnerTeamId: string | null;
  tossWinnerTeamId: string | null;
  tossWinnerChoice: string | null;
  resultStatus: string | null;
  liveInning: string | null;
  liveInningPredictions: string | null;
  ballsPerOver: string | null;
  series: {
    id: number;
    objectId: number;
    scribeId: number;
    slug: string;
    name: string;
    longName: string;
    alternateName: string;
    longAlternateName: string;
    year: number;
    typeId: number;
    isTrophy: boolean;
    description: string;
    season: string;
    startDate: JsDateString;
    endDate: JsDateString;
    hasStandings: boolean;
  };
  ground: {
    id: number;
    objectId: number;
    name: string;
    smallName: string;
    longName: string;
    location: string;
    town: {
      id: number;
      objectId: number;
      name: string;
      area: string;
      timezone: string;
    };
    country: {
      id: number;
      objectId: number;
      name: string;
      shortName: string;
    };
  };
  teams: [Team, Team];
  dayType: 'SINGLE' | 'MULTI',
  format: 'T20' | 'ODI' | 'TEST',
  generatedAt: JsDateString
}

export interface CricketResponse {
  matches: Match[];
  objects: { recentInfos: {} };
}
