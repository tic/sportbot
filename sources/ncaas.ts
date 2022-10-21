import axios from 'axios';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { FourFieldApiResponse } from '../types/espnApiTypes';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const { data }: { data: FourFieldApiResponse } = await axios.get(config.source.ncaas.url);
    const now = Date.now();
    return data.events.map((event) => {
      const startDate = new Date(event.date).getTime();
      return startDate <= now
        ? null
        : {
          identifier: event.id,
          title: event.shortName,
          description: [
            event.competitions[0].broadcasts.length === 0
              ? null
              : `Watch on ${
                Array.from(new Set(event.competitions[0].broadcasts.map((b) => b.names).flat(1))).join(', ')
              }`,
            event.competitions[0]?.odds?.[0]?.details && event.competitions[0]?.odds?.[0]?.overUnder
              ? `Odds: ${event.competitions[0].odds[0].details}  o/u ${event.competitions[0].odds[0].overUnder}`
              : null,
          ].filter((bit) => bit !== null).join('\n'),
          startDay: dateObjectToMMDDYYYY(new Date(event.date)),
          startDate,
        } as EventType;
    }).filter((event) => event !== null);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.ncaas.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.ncaas.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { identifier: event.identifier },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.ncaas.identifier, String(error));
    return false;
  }
};

const announcer = async () => {
  try {
    const startDay = dateObjectToMMDDYYYY(new Date());
    const events = (await collections.ncaas.find({
      startDay,
      $or: config.source.ncaas.followedTeams.map((team) => [
        { title: { $regex: `^${team} @`, $options: 'i' } },
        { title: { $regex: `@ ${team}$`, $options: 'i' } },
      ]).flat(1),
    }).toArray()) as unknown as EventType[];

    return {
      events: events.map((event) => ({
        ...event,
        title: `(NCAA Men's Soccer) ${event.title}`,
      })),
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.ncaas.identifier, String(error));
    return {
      events: [],
    };
  }
};

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;