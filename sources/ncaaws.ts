import { config } from '../config';
import {
  genericCollectionFunction,
  dropUnrelatedTeams,
  genericMergeFunction,
  genericAnnounceFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.ncaaws.identifier,
  url: config.source.ncaaws.url,
  dropFunction: dropUnrelatedTeams(config.source.ncaaws.followedTeams),
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.ncaaws.identifier,
  collection: 'ncaaws',
  events,
  titlePrefix: "NCAA Women's Soccer",
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.ncaaws.identifier,
  collection: 'ncaaws',
  teams: config.source.ncaaws.followedTeams,
  titlePrefix: "NCAA Women's Soccer",
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
