import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction,
  genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.nhl.identifier,
  url: config.source.nhl.url,
  dropFunction: dropUnrelatedTeams(config.source.nhl.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.nhl.identifier,
  collection: 'nhl',
  events,
  titlePrefix: 'NHL',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.nhl.identifier,
  collection: 'nhl',
  teams: config.source.nhl.followedTeams,
  titlePrefix: 'NHL',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
