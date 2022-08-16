import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { config } from './config';
import { announce, initialize } from './services/discord.service';
import { logError, logMessage } from './services/logger.service';
import { eventToEmbedDataValue, msUntilHourUTC, setIntervalAndStart } from './services/util.service';
import formula1 from './sources/formula1';
import holiday from './sources/holidays';
import nfl from './sources/nfl';
import nhl from './sources/nhl';
import { ChannelClassEnum } from './types/serviceDiscordTypes';
import { LogCategoriesEnum } from './types/serviceLoggerTypes';

initialize();

const modules = [
  {
    controller: formula1,
    config: config.source.formula1,
  },
  {
    controller: holiday,
    config: config.source.holiday,
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
