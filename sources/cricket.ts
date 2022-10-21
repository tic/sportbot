import axios from 'axios';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { CricketResponse } from '../types/eventCricketTypes';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const { data }: { data: CricketResponse } = await axios.get(config.source.cricket.url);
    const now = Date.now();
    return data.matches.map((match) => {
      const startDate = new Date(match.startTime).getTime();
      if (startDate <= now) {
        return null;
      }

      const homeTeamIndex = match.teams.findIndex((team) => team.isHome);
      const awayTeamIndex = +!homeTeamIndex;
      if (homeTeamIndex < 0) {
        return null;
      }

      const title = `${match.teams[awayTeamIndex].team.abbreviation} @ ${match.teams[homeTeamIndex].team.abbreviation}`;

      return startDate <= now
        ? null
        : {
          identifier: match.id.toString(),
          title,
          description: [
            match.title,
            `Format: ${match.format}`,
            `Timespan: ${match.dayType === 'SINGLE' ? 'Single' : 'Multi'}-day`,
          ].join('\n'),
          startDay: dateObjectToMMDDYYYY(new Date(match.startTime)),
          startDate,
          location: `${match.ground.longName} -- ${match.ground.country.name}`,
        } as EventType;
    }).filter((match) => match !== null);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.cricket.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.cricket.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { identifier: event.identifier },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.cricket.identifier, String(error));
    return false;
  }
};

const announcer = async () => {
  try {
    const startDay = dateObjectToMMDDYYYY(new Date());
    const events = (await collections.cricket.find({
      startDay,
      $or: config.source.cricket.followedTeams.map((team) => [
        { title: { $regex: `^${team} @`, $options: 'i' } },
        { title: { $regex: `@ ${team}$`, $options: 'i' } },
      ]).flat(1),
    }).toArray()) as unknown as EventType[];

    return {
      events: events.map((event) => ({
        ...event,
        title: `(Cricket) ${event.title}`,
      })),
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.cricket.identifier, String(error));
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
