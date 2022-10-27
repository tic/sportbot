import { config } from '../config';
import {
  dropUnrelatedTeams,
  genericAnnounceFunction,
  genericCollectionFunction,
  genericMergeFunction,
} from '../services/generics.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.fifawwc.identifier,
  url: config.source.fifawwc.url,
  dropFunction: dropUnrelatedTeams(config.source.fifawwc.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.fifawwc.identifier,
  collection: 'fifawwc',
  events,
  titlePrefix: "FIFA Women's World Cup",
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.fifawwc.identifier,
  collection: 'fifawwc',
  teams: config.source.fifawwc.followedTeams,
  titlePrefix: "FIFA Women's World Cup",
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
