import {
  config as dotenvConfig,
  DotenvConfigOutput,
} from 'dotenv';
import { prodDiscordServerConfig, devDiscordServerConfig } from './discord.config.json';
import { DiscordServerType } from './types/serviceDiscordTypes';

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
        intervalMs: parseInt(env('SOURCE_FORMULA1_INTERVALMS'), 10),
        identifier: 'source_formula1',
        url: env('SOURCE_FORMULA1_URL'),
      },
      nfl: {
        intervalMs: parseInt(env('SOURCE_NFL_INTERVALMS'), 10),
        identifier: 'source_nfl',
        url: env('SOURCE_NFL_URL'),
        followedTeams: inDevelopment ? ['TEST'] : [
          'DAL',
          'PHI',
          'NYG',
          'WSH',
        ],
      },
      mlb: {
        intervalMs: parseInt(env('SOURCE_MLB_INTERVALMS'), 10),
        identifier: 'source_mlb',
        url: env('SOURCE_MLB_URL'),
        followedTeams: ['WSH', 'SEA'],
      },
      nhl: {
        intervalMs: parseInt(env('SOURCE_NHL_INTERVALMS'), 10),
        identifier: 'source_nhl',
        url: env('SOURCE_NHL_URL'),
        followedTeams: ['WSH'],
      },
      ncaam: {
        intervalMs: parseInt(env('SOURCE_NCAA_BASKETBALL_INTERVALMS'), 10),
        identifier: 'source_ncaam',
        url: env('SOURCE_NCAA_BASKETBALL_URL'),
        followedTeams: ['UVA'],
      },
      ncaab: {
        intervalMs: parseInt(env('SOURCE_NCAA_BASEBALL_INTERVALMS'), 10),
        identifier: 'source_ncaab',
        url: env('SOURCE_NCAA_BASEBALL_URL'),
      },
      holiday: {
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
