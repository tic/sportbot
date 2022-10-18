import axios from 'axios';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { fullDays } from '../services/constants.service';
import { collections } from '../services/database.service';
import { logError } from '../services/logger.service';
import { dateObjectToMMDDYYYY } from '../services/util.service';
import { Formula1EventType, Formula1WeekendType } from '../types/eventFormula1Types';
import { EventControllerType, EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const getJSONDataFromDom = (dom: JSDOM) => Array.from(
  dom.window.document.getElementsByTagName('script'),
).map((element) => {
  if (element.getAttribute('type') !== 'application/ld+json') {
    return null;
  }
  try {
    return JSON.parse(element.innerHTML);
  } catch {
    return null;
  }
}).filter((item) => item !== null);

const collect = async () => {
  try {
    const urlWithCurrentYear = config.source.formula1.url.replace('<$YEAR>', new Date().getFullYear().toString());
    const { data: parsedResult } = await axios.get(urlWithCurrentYear);
    const data = getJSONDataFromDom(new JSDOM(parsedResult)) as Formula1EventType[];
    const events = await Promise.all(data.map(async (eventBlock) => {
      const url = eventBlock['@id'];
      const { data: parsedRaceResult } = await axios.get(url);
      const raceData = getJSONDataFromDom(new JSDOM(parsedRaceResult)) as Formula1WeekendType[];
      if (raceData.length === 0) {
        return [];
      }
      const subEvents = raceData[0].subEvent.map((event) => {
        const date = new Date(event.startDate);
        return {
          title: event.name,
          description: eventBlock.description,
          startDay: dateObjectToMMDDYYYY(date),
          startDate: new Date(event.startDate).getTime(),
          endDate: new Date(event.endDate).getTime(),
          imageUrl: event.image.url,
          location: eventBlock.location.address,
          url: event['@id'],
        } as EventType;
      });
      const blockDate = new Date(eventBlock.startDate);
      return [{
        title: eventBlock.name,
        description: eventBlock.description,
        startDay: dateObjectToMMDDYYYY(blockDate),
        startDate: new Date(eventBlock.startDate).getTime(),
        endDate: new Date(eventBlock.endDate).getTime(),
        imageUrl: eventBlock.image.url,
        location: eventBlock.location.address,
        url: eventBlock['@id'],
      }, ...subEvents];
    }));
    return events.flat(1);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.formula1.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.formula1.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { title: event.title },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.formula1.identifier, String(error));
    return false;
  }
};

const announcer = async () => {
  const now = new Date().getTime();
  try {
    const todaysEventResults = await collections.formula1.find({
      startDate: {
        $gt: now,
        $lt: now + 84600000,
      },
    }).toArray() as unknown as EventType[];
    const todaysEvents = todaysEventResults.filter((event) => event.endDate - event.startDate < 86400000);

    // On Wednesday, we check if the upcoming weekend is a race weekend
    let dedicatedEmbed: MessageEmbed | undefined;
    if ((config.meta.inDevelopment && !config.meta.inPracticeMode) || new Date().getDay() === 3) {
      const [headerItem, ...weekendItems] = (
        await collections.formula1.find({
          startDate: {
            $gt: now,
            $lt: now + 518400000,
          },
        }).toArray() as unknown as EventType[]
      ).sort((a, b) => {
        if (a.endDate > a.startDate + 86400000) {
          return -1;
        }
        if (b.endDate > b.startDate + 86400000) {
          return 1;
        }
        return a.startDate - b.startDate;
      });
      if (headerItem && weekendItems.length > 0) {
        const embedFields: EmbedFieldData[] = weekendItems.map((item) => ({
          name: `${item.title.split(' - ')[0]} (${fullDays[new Date(item.startDate).getDay()]})`,
          value: `Start time: <t:${item.startDate / 1000}:t> (<t:${item.startDate / 1000}:R>)`,
        }));
        dedicatedEmbed = new MessageEmbed()
          .setColor(Math.random() > 0.5 ? '#ff0000' : '#0000ff')
          .setDescription(headerItem.location || headerItem.title)
          .setAuthor({
            name: headerItem.title,
            iconURL: 'https://i.gyazo.com/8747b3842b2d79eb978da82e5e08b9ab.png',
            url: headerItem.url || '',
          })
          .setThumbnail(headerItem.imageUrl || '')
          .addFields(embedFields);
      }
    }
    return {
      events: todaysEvents.map((event) => ({
        ...event,
        title: `(F1) ${event.title}`,
      })),
      dedicatedEmbed,
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.formula1.identifier, String(error));
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
