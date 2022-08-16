import axios from 'axios';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { padNumberToTwoDigits } from '../services/util.service';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const generalUrl = config.source.nfl.url.replace('<$YEAR>', new Date().getFullYear().toString());
    const events: EventType[][] = [];
    for (let i = 1; i < 19; i++) {
      // eslint-disable-next-line no-await-in-loop
      const { data: parsedResult } = await axios.get(generalUrl.replace('<$SEASON_WEEK>', i.toString()));
      const dom = new JSDOM(parsedResult);
      let day = -1;
      const dayStrings = Array.from(
        dom.window.document.getElementsByClassName('Table__Title'),
      ).map((element) => new Date(element.innerHTML));
      const weekEvents = Array.from(
        dom.window.document.getElementsByClassName('Table__TR'),
      ).filter(
        (element) => element.getAttribute('data-idx') !== null,
      ).map((element) => {
        const dataIndex = element.getAttribute('data-idx');
        const baseDate = new Date(dayStrings[dataIndex === '0' ? ++day : day]);
        const dataBits = Array.from(element.getElementsByTagName('td'));
        if (dataBits.length !== 7) {
          return null;
        }

        let timeBits = dataBits[2].textContent.trim().match(/(\d?\d):(\d\d) ([AP]M)/);
        if (timeBits === null) {
          timeBits = ['', '12', '00', 'AM'];
        }
        if (timeBits.length !== 4) {
          return null;
        }
        baseDate.setMinutes(Number(timeBits[2]));
        baseDate.setHours((Number(timeBits[1]) % 12) + (timeBits[3] === 'AM' ? 0 : 12));

        let broadcaster = dataBits[3].textContent;
        if (broadcaster === '') {
          const imgElement = dataBits[3].getElementsByTagName('img').item(0);
          if (imgElement) {
            broadcaster = imgElement.getAttribute('alt');
          }
        }

        return {
          title: `${dataBits[0].textContent}${dataBits[1].textContent}`,
          description: broadcaster,
          startDay: `${
            padNumberToTwoDigits(baseDate.getMonth() + 1)
          }-${
            padNumberToTwoDigits(baseDate.getDate())
          }-${
            baseDate.getFullYear()
          }`,
          startDate: baseDate.getTime(),
          location: dataBits[5].textContent || '',
        } as EventType;
      }).filter((item) => item !== null);
      events.push(weekEvents);
    }
    return events.flat(1);
  } catch (error) {
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
    const now = new Date();
    const startDay = `${
      padNumberToTwoDigits(now.getMonth() + 1)
    }-${
      padNumberToTwoDigits(now.getDate())
    }-${
      now.getFullYear()
    }`;
    const events = (await collections.nfl.find({
      startDay,
    }).toArray()) as unknown as EventType[];
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
