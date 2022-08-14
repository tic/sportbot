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
      },
      mlb: {
        intervalMs: parseInt(env('SOURCE_MLB_INTERVALMS'), 10),
        identifier: 'spot_mlb',
        url: env('SOURCE_MLB_URL'),
      },
      nhl: {
        intervalMs: parseInt(env('SOURCE_NHL_INTERVALMS'), 10),
        identifier: 'source_nhl',
        url: env('SOURCE_NHL_URL'),
      },
      ncaaBasketball: {
        intervalMs: parseInt(env('SOURCE_NCAA_BASKETBALL_INTERVALMS'), 10),
        identifier: 'source_ncaaBasketball',
        url: env('SOURCE_NCAA_BASKETBALL_URL'),
      },
      ncaaBaseball: {
        intervalMs: parseInt(env('SOURCE_NCAA_BASEBALL_INTERVALMS'), 10),
        identifier: 'source_ncaaBaseball',
        url: env('SOURCE_NCAA_BASEBALL_URL'),
      },
      holiday: {
        intervalMs: parseInt(env('SOURCE_HOLIDAY_INTERVALMS'), 10),
        identifier: 'source_holiday',
        url: env('SOURCE_HOLIDAY_URL'),
      },
    },
    meta: {
      inDevelopment: parsedEnv?.MODE !== 'PRODUCTION',
    },
    discord: {
      secret: env('DISCORD_SECRET'),
      username: env('DISCORD_USERNAME'),
      servers: (
        parsedEnv?.MODE !== 'PRODUCTION'
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
