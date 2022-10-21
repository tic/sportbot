import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { config } from './config';
import { announce, initialize } from './services/discord.service';
import { logError, logMessage } from './services/logger.service';
import { eventToEmbedDataValue, msUntilHourUTC, setIntervalAndStart } from './services/util.service';
import cricket from './sources/cricket';
import fifawc from './sources/fifawc';
import fifawwc from './sources/fifawwc';
import formula1 from './sources/formula1';
import holiday from './sources/holidays';
import mlb from './sources/mlb';
import mls from './sources/mls';
import ncaab from './sources/ncaab';
import ncaaf from './sources/ncaaf';
import ncaam from './sources/ncaam';
import ncaas from './sources/ncaas';
import ncaaws from './sources/ncaaws';
import nfl from './sources/nfl';
import nhl from './sources/nhl';
import { ChannelClassEnum } from './types/serviceDiscordTypes';
import { LogCategoriesEnum } from './types/serviceLoggerTypes';

initialize();

const modules = [
  {
    controller: cricket,
    config: config.source.cricket,
  },
  {
    controller: fifawc,
    config: config.source.fifawc,
  },
  {
    controller: fifawwc,
    config: config.source.fifawwc,
  },
  {
    controller: formula1,
    config: config.source.formula1,
  },
  {
    controller: holiday,
    config: config.source.holiday,
  },
  {
    controller: mlb,
    config: config.source.mlb,
  },
  {
    controller: mls,
    config: config.source.mls,
  },
  {
    controller: ncaab,
    config: config.source.ncaab,
  },
  {
    controller: ncaaf,
    config: config.source.ncaaf,
  },
  {
    controller: ncaam,
    config: config.source.ncaam,
  },
  {
    controller: ncaas,
    config: config.source.ncaas,
  },
  {
    controller: ncaaws,
    config: config.source.ncaaws,
  },
  {
    controller: nfl,
    config: config.source.nfl,
  },
  {
    controller: nhl,
    config: config.source.nhl,
  },
];

modules.forEach((module) => {
  setIntervalAndStart(async () => {
    await logMessage(module.config.identifier, 'collect invoked');
    const collectionResult = await module.controller.collect();
    if (collectionResult.length === 0) {
      return;
    }
    await logMessage(module.config.identifier, 'merge to db invoked');
    await module.controller.mergeToDb(collectionResult);
    await logMessage(module.config.identifier, 'merge complete');
  }, module.config.intervalMs);
});

const runAnnouncers = async () => {
  try {
    logMessage('index_runAnnouncers', 'Running announcers');
    const announcementObjects = await Promise.all(
      modules.map(async (module) => {
        await logMessage(module.config.identifier, 'announcer invoked');
        const announcementObj = await module.controller.announcer();
        logMessage(
          module.config.identifier,
          `emitting ${announcementObj.events.length + (announcementObj.dedicatedEmbed ? 1 : 0)} announcement item(s)`,
        );
        return announcementObj;
      }),
    );
    const embedFields: EmbedFieldData[] = [];
    announcementObjects.forEach((announcement) => {
      announcement.events.forEach((event) => {
        embedFields.push({
          name: event.title,
          value: eventToEmbedDataValue(event),
        });
      });

      if (announcement.dedicatedEmbed) {
        announce(ChannelClassEnum.GENERAL_UPDATES, undefined, announcement.dedicatedEmbed, []);
      }
    });

    if (embedFields.length > 0) {
      const collectiveEmbed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle(`Event Report for <t:${Math.floor(new Date().getTime() / 1000)}:D>`)
        .setDescription('The following events are scheduled for today:')
        .addFields(embedFields);
      announce(ChannelClassEnum.GENERAL_UPDATES, undefined, collectiveEmbed, []);
    }
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, 'index_runAnnouncers', String(error));
  }
};

if (config.meta.inDevelopment) {
  setTimeout(runAnnouncers, 3000);
}

setTimeout(() => {
  runAnnouncers();
  setInterval(runAnnouncers, 86400000);
}, msUntilHourUTC(10));
