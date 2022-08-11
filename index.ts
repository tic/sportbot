import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { config } from './config';
import { announce, initialize } from './services/discord.service';
import { logError, logMessage } from './services/logger.service';
import { msUntilHourUTC, setIntervalAndStart } from './services/util.service';
import formula1 from './sources/formula1';
import { EventType } from './types/globalTypes';
import { ChannelClassEnum } from './types/serviceDiscordTypes';
import { LogCategoriesEnum } from './types/serviceLoggerTypes';

initialize();

setIntervalAndStart(async () => {
  const collectionResult = await formula1.collect();
  formula1.mergeToDb(collectionResult);
}, config.sports.formula1.intervalMs);

const eventToEmbedDataValue = (event: EventType) => {
  const baseString = `Description: ${
    event.description
  }\nStart Date: <t:${
    event.startDate / 1000
  }:t> (<t:${
    event.startDate / 1000
  }:R>)`;

  const additionalFields = [];
  if (event.endDate) {
    additionalFields.push(
      `End Date: <t:${Math.floor(event.endDate / 1000)}:t> (<t:${Math.floor(event.endDate / 1000)}:R>)`,
    );
  }
  if (event.location) {
    additionalFields.push(`Location: ${event.location}`);
  }

  return additionalFields.length === 0 ? baseString : `${baseString}\n${additionalFields.join('\n')}`;
};

const runAnnouncers = async () => {
  try {
    logMessage('index_runAnnouncers', 'Running announcers');
    const announcementObjects = await Promise.all([
      formula1.announcer(),
    ]);
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
