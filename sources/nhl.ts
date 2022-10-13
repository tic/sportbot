import axios from 'axios';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    // Offset the date by about +5 months since "2022" is a
    // part of games ranging from September 2021 - June 2022
    const offsetDate = new Date(new Date().getTime() + 12960000000);
    const generalUrl = config.source.nhl.url.replace('<$YEAR>', offsetDate.getFullYear().toString());
    const events: EventType[][] = await Promise.all(config.source.nhl.followedTeams.map(async (team) => {
      const { data: parsedResult } = await axios.get(generalUrl.replace('<$TEAM>', team.toLowerCase()));
      const dom = new JSDOM(parsedResult);
      const rows = Array.from(dom.window.document.getElementsByClassName('Table__TR'));
      const { index, found } = rows.reduce((acc, cur, idx) => {
        if (acc.found) {
          return acc;
        }

        if (cur.innerHTML.indexOf('TV') > 0) {
          acc.found = true;
          acc.index = idx;
        }

        return acc;
      }, { found: false, index: 0 });

      if (!found) {
        return [];
      }

      const teamEvents = rows.filter(
        (element) => element.getAttribute('data-idx') !== null && Number(element.getAttribute('data-idx')) > index,
      ).map((element) => {
        const dataBits = Array.from(element.getElementsByTagName('td'));
        if (dataBits.length !== 5) {
          return null;
        }

        const opponent = dataBits[1].innerHTML.match(/.*\/name\/([a-zA-Z]{2}[a-zA-Z]?)\/.*/)[1];
        if (!opponent) {
          return null;
        }

        const baseDate = new Date(dataBits[0].textContent);
        if (Number.isNaN(baseDate.valueOf())) {
          return null;
        }

        const timeBits = dataBits[2].textContent.trim().match(/(\d?\d):(\d\d) ([AP]M)/);
        if (timeBits === null || timeBits.length !== 4) {
          return null;
        }
        baseDate.setMinutes(Number(timeBits[2]));
        baseDate.setHours((Number(timeBits[1]) % 12) + (timeBits[3] === 'AM' ? 0 : 12));

        const now = new Date();
        const isSpringNow = +(now.getMonth() < 7);
        const isTargetSpring = +(baseDate.getMonth() < 7);
        baseDate.setFullYear(
          now.getFullYear() + ((isSpringNow ^ isTargetSpring) * (isSpringNow ? -1 : 1)),
        );

        const isAwayGame = dataBits[1].textContent.includes('@');

        const event: EventType = {
          title: isAwayGame
            ? `${team.toUpperCase()} @ ${opponent.toUpperCase()}`
            : `${opponent.toUpperCase()} @ ${team.toUpperCase()}`,
          description: dataBits[3].textContent.length > 0 ? `Watch on ${dataBits[3].textContent}` : '',
          startDay: dateObjectToMMDDYYYY(baseDate),
          startDate: baseDate.getTime(),
        };

        if (!isAwayGame) {
          event.location = 'Capital One Arena, Washington, D.C.';
        }

        return event;
      }).filter((item) => item !== null) as EventType[];
      return teamEvents;
    }));
    return events.flat(1);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.nhl.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.nhl.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { title: event.title },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.nhl.identifier, String(error));
    return false;
  }
};

const announcer = async () => {
  try {
    const startDay = dateObjectToMMDDYYYY(new Date());
    const events = (await collections.nhl.find({
      startDay,
      $or: config.source.nhl.followedTeams.map((team) => ({ title: { $regex: team, $options: 'i' } })),
    }).toArray()) as unknown as EventType[];
    events.forEach((event) => {
      // eslint-disable-next-line no-param-reassign
      event.title = `(NHL) ${event.title}`;
    });
    return {
      events,
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.nhl.identifier, String(error));
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
