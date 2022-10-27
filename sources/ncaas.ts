import { config } from '../config';
import {
  genericCollectionFunction,
  dropUnrelatedTeams,
  genericMergeFunction,
  genericAnnounceFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.ncaas.identifier,
  url: config.source.ncaas.url,
  dropFunction: dropUnrelatedTeams(config.source.ncaas.followedTeams),
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.ncaas.identifier,
  collection: 'ncaas',
  events,
  titlePrefix: "NCAA Men's Soccer",
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.ncaas.identifier,
  collection: 'ncaas',
  teams: config.source.ncaas.followedTeams,
  titlePrefix: "NCAA Men's Soccer",
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
