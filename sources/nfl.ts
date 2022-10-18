import axios from 'axios';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { ApiResponse } from '../types/eventNflTypes';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const { data }: { data: ApiResponse } = await axios.get(config.source.nfl.url);
    return data.events.map((event) => ({
      title: event.shortName,
      description: [
        `Watch on ${Array.from(new Set(event.competitions[0].broadcasts.map((b) => b.names).flat(1))).join(', ')}`,
        event.competitions[0].odds
          ? `Odds: ${event.competitions[0].odds[0].details}  o/u ${event.competitions[0].odds[0].overUnder}`
          : null,
      ].filter((bit) => bit !== null).join('\n'),
      startDay: dateObjectToMMDDYYYY(new Date(event.date)),
      startDate: new Date(event.date).getTime(),
      identifier: event.uid,
      location:
        `${event.competitions[0].venue.fullName} -- `
        + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
    } as EventType));
  } catch (error) {
    console.error(error);
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.nfl.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.nfl.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { title: event.title },
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
      $or: config.source.nfl.followedTeams.map((team) => ({ title: { $regex: team, $options: 'i' } })),
    }).toArray()) as unknown as EventType[];
    events.forEach((event) => {
      // eslint-disable-next-line no-param-reassign
      event.title = `(NFL) ${event.title}`;
    });
    return {
      events,
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
