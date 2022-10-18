import axios from 'axios';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { NflResponse } from '../types/eventNflTypes';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const { data }: { data: NflResponse } = await axios.get(config.source.nfl.url);
    const now = Date.now();
    return data.events.map((event) => {
      const startDate = new Date(event.date).getTime();
      return startDate <= now
        ? null
        : {
          identifier: event.id,
          title: event.shortName,
          description: [
            `Watch on ${Array.from(new Set(event.competitions[0].broadcasts.map((b) => b.names).flat(1))).join(', ')}`,
            event.competitions[0]?.odds[0]?.details && event.competitions[0]?.odds[0]?.overUnder
              ? `Odds: ${event.competitions[0].odds[0].details}  o/u ${event.competitions[0].odds[0].overUnder}`
              : null,
          ].filter((bit) => bit !== null).join('\n'),
          startDay: dateObjectToMMDDYYYY(new Date(event.date)),
          startDate,
          location:
            `${event.competitions[0].venue.fullName} -- `
            + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
        } as EventType;
    }).filter((event) => event !== null);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.nfl.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.nfl.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { identifier: event.identifier },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.nfl.identifier, String(error));
    return false;
  }
};

const announcer = async () => {
  try {
    const startDay = dateObjectToMMDDYYYY(new Date());
    const events = (await collections.nfl.find({
      startDay,
      $or: config.source.nfl.followedTeams.map((team) => [
        { title: { $regex: `^${team} @`, $options: 'i' } },
        { title: { $regex: `@ ${team}$`, $options: 'i' } },
      ]).flat(1),
    }).toArray()) as unknown as EventType[];

    return {
      events: events.map((event) => ({
        ...event,
        title: `(NFL) ${event.title}`,
      })),
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.nfl.identifier, String(error));
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
