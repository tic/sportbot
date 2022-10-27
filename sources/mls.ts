import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction, genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.mls.identifier,
  url: config.source.mls.url,
  dropFunction: dropUnrelatedTeams(config.source.mls.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.mls.identifier,
  collection: 'mls',
  events,
  titlePrefix: 'MLS',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.mls.identifier,
  collection: 'mls',
  teams: config.source.mls.followedTeams,
  titlePrefix: 'MLS',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
