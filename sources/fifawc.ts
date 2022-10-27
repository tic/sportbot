import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction,
  genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.fifawc.identifier,
  url: config.source.fifawc.url,
  dropFunction: dropUnrelatedTeams(config.source.fifawc.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.fifawc.identifier,
  collection: 'fifawc',
  events,
  titlePrefix: 'FIFA World Cup',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.fifawc.identifier,
  collection: 'fifawc',
  teams: config.source.fifawc.followedTeams,
  titlePrefix: 'FIFA World Cup',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
