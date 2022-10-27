import { config } from '../config';
import {
  genericCollectionFunction,
  dropUnrelatedTeams,
  genericMergeFunction,
  genericAnnounceFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.ncaam.identifier,
  url: config.source.ncaam.url,
  dropFunction: dropUnrelatedTeams(config.source.ncaam.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
    + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.ncaam.identifier,
  collection: 'ncaam',
  events,
  titlePrefix: "NCAA Men's Basketball",
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.ncaam.identifier,
  collection: 'ncaam',
  teams: config.source.ncaam.followedTeams,
  titlePrefix: "NCAA Men's Basketball",
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
