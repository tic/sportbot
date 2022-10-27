import { config } from '../config';
import {
  genericCollectionFunction,
  dropUnrelatedTeams,
  genericMergeFunction,
  genericAnnounceFunction,
} from '../services/generics.service';
import { dateObjectToYYYYMMDD } from '../services/util.service';
import { EventControllerType, EventType } from '../types/globalTypes';

const collect = () => genericCollectionFunction({
  logIdentifier: config.source.ncaaf.identifier,
  url: config.source.ncaaf.url.replace(
    '<$YYYYMMDD>',
    dateObjectToYYYYMMDD(new Date()).replace(/-/g, ''),
  ),
  dropFunction: dropUnrelatedTeams(config.source.ncaaf.followedTeams),
  propOverrides: {
    location: (event) => `${event.competitions[0].venue.fullName} -- `
      + `${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}`,
  },
});

const mergeToDb = (events: EventType[]) => genericMergeFunction({
  logIdentifier: config.source.ncaaf.identifier,
  collection: 'ncaaf',
  events,
  titlePrefix: 'NCAA Football',
});

const announcer = () => genericAnnounceFunction({
  logIdentifier: config.source.ncaaf.identifier,
  collection: 'ncaaf',
  teams: config.source.ncaaf.followedTeams,
  titlePrefix: 'NCAA Football',
});

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
