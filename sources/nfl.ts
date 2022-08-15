import axios from 'axios';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { logError } from '../services/logger.service';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const generalUrl = config.source.nfl.url.replace('<$YEAR>', new Date().getFullYear().toString());
    const events = [];
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
        console.log(baseDate);
        const dataBits = Array.from(element.getElementsByTagName('td'));
        if (dataBits.length !== 7) {
          return null;
        }

        return {
          title: `${dataBits[0].textContent} @ ${dataBits[1].textContent}`,
          description: dataBits[3].textContent || '',
          startDay: '',
          startDate: 0,
          location: dataBits[5].textContent || '',
        } as EventType;
      }).filter((item) => item !== null);
    }
    console.log(events);
    return [];
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.nfl.identifier, String(error));
    return [];
  }
};

// eslint-disable-next-line arrow-body-style, no-unused-vars
const mergeToDb = async (events: EventType[]) => {
  try {
    return false;
  // eslint-disable-next-line no-unreachable
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.nfl.identifier, String(error));
    return false;
  }
};

// eslint-disable-next-line arrow-body-style
const announcer = async () => {
  return {
    events: [],
  };
};

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
