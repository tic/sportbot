import { MessageEmbed } from 'discord.js';
import {
  readdirSync,
} from 'fs';
import { announce, initialize } from '../services/discord.service';
import { eventToEmbedDataValue } from '../services/util.service';
import { EventControllerType } from '../types/globalTypes';
import { ChannelClassEnum } from '../types/serviceDiscordTypes';

const { argv } = process;

if (argv.length < 3) {
  console.error('[ERROR] You must provide an event controller to test');
  process.exit(1);
}

const folderEntries = readdirSync('./sources');
const baseLocation = '../sources';

const eventControllerFile = `${argv[2]}.ts`;
if (!folderEntries.includes(eventControllerFile)) {
  console.error('[ERROR] Could not find the specified event controller (sources/%s)', eventControllerFile);
  process.exit(1);
}

// eslint-disable-next-line import/no-dynamic-require, global-require
const eventController = require(`${baseLocation}/${eventControllerFile}`).default as EventControllerType;

(async function run() {
  console.log('============  EXECUTING EVENT CONTROLLER  ============');
  if (argv[3] === 'collect') {
    const collectionResult = await eventController.collect();
    console.log(
      '==========  EVENT CONTROLLER  RETURN VALUE  ==========\n',
      collectionResult,
    );
  }

  if (argv[3] === 'merge') {
    const collectionResult = await eventController.collect();
    const merged = await eventController.mergeToDb(collectionResult);
    console.log(
      '===============  MERGE  RETURN  VALUE  ===============\n',
      merged,
    );
  }

  if (argv[3] === 'announce') {
    await initialize();
    const announcerResults = await eventController.announcer();
    console.log(
      '============  ANNOUNCER   RETURN   VALUE  ============\n',
      announcerResults,
    );
    if (announcerResults.dedicatedEmbed) {
      await announce(ChannelClassEnum.GENERAL_UPDATES, undefined, announcerResults.dedicatedEmbed, []);
    }
    const embedFields = [];
    announcerResults.events.forEach((event) => {
      embedFields.push({
        name: event.title,
        value: eventToEmbedDataValue(event),
      });
    });
    if (embedFields.length > 0) {
      const collectiveEmbed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle(`Event Report for <t:${Math.floor(new Date().getTime() / 1000)}:D>`)
        .setDescription('The following events are scheduled for today:')
        .addFields(embedFields);
      announce(ChannelClassEnum.GENERAL_UPDATES, undefined, collectiveEmbed, []);
    }
  }
}());
