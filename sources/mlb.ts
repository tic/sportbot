import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction, genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.mlb.identifier,
  url: config.source.mlb.url,
  dropFunction: dropUnrelatedTeams(config.source.mlb.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.mlb.identifier,
  collection: 'mlb',
  events,
  titlePrefix: 'MLB',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.mlb.identifier,
  collection: 'mlb',
  teams: config.source.mlb.followedTeams,
  titlePrefix: 'MLB',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
