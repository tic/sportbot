import axios from 'axios';
import { MessageEmbed } from 'discord.js';
import { JSDOM } from 'jsdom';
import { config } from '../config';
import { fullMonths } from '../services/constants.service';
import { collections } from '../services/database.service';
import { announce } from '../services/discord.service';
import { logError } from '../services/logger.service';
import { padNumberToNDigits, padNumberToTwoDigits } from '../services/util.service';
import { EventControllerType, EventType } from '../types/globalTypes';
import { ChannelClassEnum } from '../types/serviceDiscordTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const collect = async () => {
  try {
    const searchDay = new Date(new Date().getTime() + 86400000);
    searchDay.setUTCHours(9);
    searchDay.setUTCMinutes(0);
    searchDay.setUTCSeconds(0);
    searchDay.setUTCMilliseconds(0);
    const date = searchDay.getDate();
    const month = fullMonths[searchDay.getMonth()].toLowerCase();
    const url = config.source.holiday.url.replace('<$DATE>', date.toString()).replace('<$MONTH>', month);
    const { data: parsedResult } = await axios.get(url);
    const dom = new JSDOM(parsedResult);
    const events: EventType[] = Array.from(
      dom.window.document.getElementsByClassName('day-card'),
    ).map((element) => (element.getElementsByClassName('holiday-title').item(0).innerHTML.includes('irthday')
      ? null
      : ({
        title: element.getElementsByClassName('holiday-title').item(0).innerHTML,
        description: element.getElementsByClassName('excerpt').item(0).innerHTML,
        startDay: `${
          padNumberToTwoDigits(searchDay.getMonth() + 1)
        }-${
          padNumberToTwoDigits(searchDay.getDate())
        }-${
          searchDay.getFullYear()
        }`,
        startDate: searchDay.getTime(),
        url: element.getElementsByClassName('excerpt').item(0).previousElementSibling.getAttribute('href'),
        imageUrl: element.getElementsByClassName('day-card-mask')
          .item(0)
          .getAttribute('style')
          .match(/.*url\((.*)\).*/)[1],
        allDay: true,
      }))).filter((item) => item !== null) as EventType[];
    return events;
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, config.source.holiday.identifier, String(error));
    return [];
  }
};

const mergeToDb = async (events: EventType[]) => {
  try {
    const result = await collections.holiday.bulkWrite(events.map((event) => ({
      updateOne: {
        filter: { title: event.title },
        update: { $set: { ...event } },
        upsert: true,
      },
    })));
    return result.isOk();
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, config.source.holiday.identifier, String(error));
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
    const events = (await collections.holiday.find({
      startDay,
    }).toArray()) as unknown as EventType[];

    if (events.length > 0) {
      await announce(
        ChannelClassEnum.HOLIDAY,
        undefined,
        new MessageEmbed()
          .setColor(`#${padNumberToNDigits(now.getTime() % 1000000, 6)}`)
          .setTitle(`Holidays for <t:${Math.floor(now.getTime() / 1000)}:D>`)
          .setDescription('The various national/international holidays scheduled for today.')
          .addFields(events.map((event) => ({
            name: event.title,
            value: `${event.description}${event.url ? `\nRead more: ${event.url}` : ''}`,
          }))),
        [],
      );
    }
    return {
      events: [],
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, config.source.holiday.identifier, String(error));
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
