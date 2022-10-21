import {
  config as dotenvConfig,
  DotenvConfigOutput,
} from 'dotenv';
import { prodDiscordServerConfig, devDiscordServerConfig } from './discord.config.json';
import { DiscordServerType } from './types/serviceDiscordTypes';

export type GenericSourceType = {
  friendlyName: string;
  intervalMs: number;
  identifier: string;
  url: string;
  followedTeams?: string[];
}

export const getConfig = () => {
  console.log('[CNFIG] Loading project configuration...');
  const { parsed: parsedEnv }: DotenvConfigOutput = dotenvConfig();
  if (parsedEnv === undefined) {
    throw new Error('failed to load environment file. does it exist?');
  }
  const missingKeys: string[] = [];
  function env(key: string) {
    if (key === '') {
      return '';
    }
    const value = parsedEnv?.[key];
    if (value === undefined) {
      missingKeys.push(key);
      return '';
    }
    return value;
  }

  const inDevelopment = parsedEnv?.MODE !== 'PRODUCTION';

  // On Linux systems, the system timezone is usually set to UTC.
  // We need to override that, since our time parsing logic relies
  // on the Nodejs process operating in the same timezone in which
  // it intends to post event times for.
  process.env.TZ = env('TZ');

  const createdConfig = {
    source: {
      formula1: {
        friendlyName: 'Formula 1',
        intervalMs: parseInt(env('SOURCE_FORMULA1_INTERVALMS'), 10),
        identifier: 'source_formula1',
        url: env('SOURCE_FORMULA1_URL'),
      },
      nfl: {
        friendlyName: 'NFL',
        intervalMs: parseInt(env('SOURCE_NFL_INTERVALMS'), 10),
        identifier: 'source_nfl',
        url: env('SOURCE_NFL_URL'),
        followedTeams: ['DAL', 'PHI', 'NYG', 'WSH'],
      },
      mlb: {
        friendlyName: 'MLB',
        intervalMs: parseInt(env('SOURCE_MLB_INTERVALMS'), 10),
        identifier: 'source_mlb',
        url: env('SOURCE_MLB_URL'),
        followedTeams: ['WSH', 'SEA'],
      },
      nhl: {
        friendlyName: 'NHL',
        intervalMs: parseInt(env('SOURCE_NHL_INTERVALMS'), 10),
        identifier: 'source_nhl',
        url: env('SOURCE_NHL_URL'),
        followedTeams: ['WSH'],
      },
      ncaam: {
        friendlyName: "NCAA Men's Basketball",
        intervalMs: parseInt(env('SOURCE_NCAA_BASKETBALL_INTERVALMS'), 10),
        identifier: 'source_ncaam',
        url: env('SOURCE_NCAA_BASKETBALL_URL'),
        followedTeams: ['UVA'],
      },
      ncaab: {
        friendlyName: 'NCAA Baseball',
        intervalMs: parseInt(env('SOURCE_NCAA_BASEBALL_INTERVALMS'), 10),
        identifier: 'source_ncaab',
        url: env('SOURCE_NCAA_BASEBALL_URL'),
        followedTeams: ['UVA'],
      },
      ncaaf: {
        friendlyName: 'NCAA Football',
        intervalMs: parseInt(env('SOURCE_NCAA_FOOTBALL_INTERVALMS'), 10),
        identifier: 'source_ncaaf',
        url: env('SOURCE_NCAA_FOOTBALL_URL'),
        followedTeams: ['UVA'],
      },
      ncaas: {
        friendlyName: "NCAA Men's Soccer",
        intervalMs: parseInt(env('SOURCE_NCAA_MENS_SOCCER_INTERVALMS'), 10),
        identifier: 'source_ncaas',
        url: env('SOURCE_NCAA_MENS_SOCCER_URL'),
        followedTeams: ['UVA'],
      },
      ncaaws: {
        friendlyName: "NCAA Women's Soccer",
        intervalMs: parseInt(env('SOURCE_NCAA_WOMENS_SOCCER_INTERVALMS'), 10),
        identifier: 'source_ncaaws',
        url: env('SOURCE_NCAA_WOMENS_SOCCER_URL'),
        followedTeams: ['UVA'],
      },
      mls: {
        friendlyName: 'MLS',
        intervalMs: parseInt(env('SOURCE_MLS_INTERVALMS'), 10),
        identifier: 'source_mls',
        url: env('SOURCE_MLS_URL'),
        followedTeams: ['DC-UNITED'],
      },
      fifawc: {
        friendlyName: 'FIFA World Cup',
        intervalMs: parseInt(env('SOURCE_FIFA_WORLD_CUP_INTERVALMS'), 10),
        identifier: 'source_fifawc',
        url: env('SOURCE_FIFA_WORLD_CUP_URL'),
        followedTeams: ['USA'],
      },
      fifawwc: {
        friendlyName: "FIFA Women's World Cup",
        intervalMs: parseInt(env('SOURCE_FIFA_WOMENS_WORLD_CUP_INTERVALMS'), 10),
        identifier: 'source_fifawwc',
        url: env('SOURCE_FIFA_WOMENS_WORLD_CUP_URL'),
        followedTeams: ['USA'],
      },
      cricket: {
        friendlyName: 'International Cricket',
        intervalMs: parseInt(env('SOURCE_CRICKET_INTERVALMS'), 10),
        identifier: 'source_cricket',
        url: env('SOURCE_CRICKET_URL'),
        followedTeams: ['USA'],
      },
      holiday: {
        friendlyName: 'Unoffical Holidays',
        intervalMs: parseInt(env('SOURCE_HOLIDAY_INTERVALMS'), 10),
        identifier: 'source_holiday',
        url: env('SOURCE_HOLIDAY_URL'),
      },
    },
    meta: {
      inDevelopment,
      inPracticeMode: env('PRACTICE_MODE') === 'true',
    },
    discord: {
      secret: env('DISCORD_SECRET'),
      username: env('DISCORD_USERNAME'),
      servers: (
        inDevelopment
          ? devDiscordServerConfig
          : prodDiscordServerConfig
        ) as unknown as DiscordServerType[],
      identifier: 'service_discord',
      prefix: 'ev!',
    },
    mongo: {
      url: env('MONGO_URL'),
      primaryDatabase: env('MONGO_PRIMARY_DATABASE'),
      username: env('MONGO_USERNAME'),
      password: env('MONGO_PASSWORD'),
    },
  };

  if (missingKeys.length > 0) {
    console.warn(
      '[CNFIG] Global configuration referenced missing environment variables:\n\t- %s',
      missingKeys.join('\n\t- '),
    );
    console.error('[CNFIG] The project cannot continue with an incomplete configuration. Exiting...');
    process.exit(1);
  }

  console.log('[CNFIG] Configuration loaded.');
  return createdConfig;
};

export const config = getConfig();
