import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction, genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.ncaab.identifier,
  url: config.source.ncaab.url,
  dropFunction: dropUnrelatedTeams(config.source.ncaab.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.ncaab.identifier,
  collection: 'ncaab',
  events,
  titlePrefix: 'NCAA Baseball',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.ncaab.identifier,
  collection: 'ncaab',
  teams: config.source.ncaab.followedTeams,
  titlePrefix: 'NCAA Baseball',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
