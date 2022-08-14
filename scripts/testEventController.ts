import {
  readdirSync,
} from 'fs';
import { announce, initialize } from '../services/discord.service';
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
    console.log(merged ? 'merged to db' : 'failed to merge to db');
  }

  if (argv[3] === 'announce') {
    await initialize();
    const announcerResults = await eventController.announcer();
    if (announcerResults.dedicatedEmbed) {
      await announce(ChannelClassEnum.GENERAL_UPDATES, undefined, announcerResults.dedicatedEmbed, []);
    }
  }
}());
