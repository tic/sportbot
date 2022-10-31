import axios from 'axios';
import { Collection } from 'mongodb';
import { Event, FourFieldApiResponse } from '../types/espnApiTypes';
import { EventType } from '../types/globalTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from './database.service';
import { logError, logMessage } from './logger.service';
import { dateObjectToMMDDYYYY } from './util.service';

interface GenericFunctionProperties {
  logIdentifier: string;
}

const mutableEventProperties = [
  'title',
  'description',
  'startDay',
  'startDate',
  'endDate',
  'imageUrl',
  'location',
  'url',
  'allDay',
];

export interface ICollectProperties extends GenericFunctionProperties {
  url: string;
  requireFuture?: boolean;
  /* eslint-disable no-unused-vars */
  dropFunction?: (arg0: Event) => boolean; // if true, drop event from results
  propOverrides?: {
    identifier?: (arg0: Event) => string;
    description?: (arg0: Event) => string;
    title?: (arg0: Event) => string;
    startDay?: (arg0: Event) => string;
    startDate?: (arg0: Event) => number;
    endDate?: (arg0: Event) => number;
    imageUrl?: (arg0: Event) => string;
    location?: (arg0: Event) => string;
    url?: (arg0: Event) => string;
    allDay?: (arg0: Event) => boolean;
    /* eslint-enable no-unused-vars */
  }
}

// This is made specifically to handle ESPN API sources.
export const genericCollectionFunction = async ({
  url,
  logIdentifier,
  requireFuture,
  dropFunction,
  propOverrides,
}: ICollectProperties) => {
  const skipPastStarts = requireFuture ?? true;
  try {
    const { data }: { data: FourFieldApiResponse } = await axios.get(url);
    const now = Date.now();
    return data.events.map((event) => {
      const startDate = new Date(event.date).getTime();
      if (skipPastStarts && startDate <= now) {
        return null;
      }

      if (dropFunction && dropFunction(event)) {
        return null;
      }

      if (propOverrides) {
        const ev: EventType = {
          identifier: propOverrides.identifier ? propOverrides.identifier(event) : event.id,
          title: propOverrides.title ? propOverrides.title(event) : event.shortName,
          description: propOverrides.description
            ? propOverrides.description(event)
            : [
              event.competitions[0].broadcasts.length === 0
                ? null
                : `Watch on ${
                  Array.from(new Set(event.competitions[0].broadcasts.map((b) => b.names).flat(1))).join(', ')
                }`,
              event.competitions[0]?.odds?.[0]?.details && event.competitions[0]?.odds?.[0]?.overUnder
                ? `Odds: ${event.competitions[0].odds[0].details}  o/u ${event.competitions[0].odds[0].overUnder}`
                : null,
            ].filter((bit) => bit !== null).join('\n'),
          startDay: propOverrides.startDay ? propOverrides.startDay(event) : dateObjectToMMDDYYYY(new Date(event.date)),
          startDate: propOverrides.startDate ? propOverrides.startDate(event) : startDate,
        };

        if (propOverrides.endDate) {
          ev.endDate = propOverrides.endDate(event);
        }

        if (propOverrides.imageUrl) {
          ev.imageUrl = propOverrides.imageUrl(event);
        }

        if (propOverrides.location) {
          ev.location = propOverrides.location(event);
        }

        if (propOverrides.url) {
          ev.url = propOverrides.url(event);
        }

        if (propOverrides.allDay) {
          ev.allDay = propOverrides.allDay(event);
        }

        return ev;
      }

      return {
        identifier: event.id,
        title: event.shortName,
        description: [
          `Watch on ${Array.from(new Set(event.competitions[0].broadcasts.map((b) => b.names).flat(1))).join(', ')}`,
          event.competitions[0]?.odds?.[0]?.details && event.competitions[0]?.odds?.[0]?.overUnder
            ? `Odds: ${event.competitions[0].odds[0].details}  o/u ${event.competitions[0].odds[0].overUnder}`
            : null,
        ].filter((bit) => bit !== null).join('\n'),
        startDay: dateObjectToMMDDYYYY(new Date(event.date)),
        startDate,
      } as EventType;
    }).filter((event) => event !== null);
  } catch (error) {
    logError(LogCategoriesEnum.SCRAPE_FAILURE, logIdentifier, String(error));
    return [];
  }
};

export interface IMergeProperties extends GenericFunctionProperties {
  collection: string;
  events: EventType[];
  titlePrefix: string;
}

export const genericMergeFunction = async ({
  collection,
  logIdentifier,
  events,
  titlePrefix,
}: IMergeProperties) => {
  try {
    const dbCollection = collections[collection] as Collection;
    const results = await Promise.all(events.map(async (event) => {
      try {
        const result = await dbCollection.findOneAndUpdate(
          { identifier: event.identifier },
          { $set: { ...event } },
          { returnDocument: 'before', upsert: true },
        );

        const todaysAnnouncement = await collections.announced.findOne({ startDay: dateObjectToMMDDYYYY(new Date()) });

        // If today's events haven't been announced, return.
        if (!todaysAnnouncement) {
          return true;
        }

        const originalEvent: Partial<EventType> = result.value as unknown as (Partial<EventType> | null) || {};
        const eventModified = mutableEventProperties.reduce(
          (changed, prop) => changed || (event[prop] !== originalEvent[prop]),
          false,
        );

        if (eventModified && todaysAnnouncement) {
          // Announcer has already run for the day. Push these events into the special announcement collection.
          logMessage(logIdentifier, 'adding special announcement item');
          await collections.specialAnnouncements.insertOne({ ...event, title: `(${titlePrefix}) ${event.title}` });
        }

        return true;
      } catch (error) {
        logError(LogCategoriesEnum.DB_MERGE_FAILURE, logIdentifier, String(error));
        return false;
      }
    }));

    return !results.includes(false);
  } catch (error) {
    logError(LogCategoriesEnum.DB_MERGE_FAILURE, logIdentifier, String(error));
    return false;
  }
};

export interface IAnnounceProperties extends GenericFunctionProperties {
  collection: string;
  teams: string[];
  titlePrefix: string;
}

export const genericAnnounceFunction = async ({
  logIdentifier,
  collection,
  teams,
  titlePrefix,
}: IAnnounceProperties) => {
  const dbCollection = collections[collection] as Collection;
  try {
    const startDay = dateObjectToMMDDYYYY(new Date());
    await collections.announced.findOneAndReplace(
      { startDay },
      { startDay },
      { upsert: true },
    );

    const events = (await dbCollection.find({
      startDay,
      $or: teams.map((team) => [
        { title: { $regex: `^${team} @`, $options: 'i' } },
        { title: { $regex: `@ ${team}$`, $options: 'i' } },
      ]).flat(1),
    }).toArray()) as unknown as EventType[];

    return {
      events: events.map((event) => ({
        ...event,
        title: `(${titlePrefix}) ${event.title}`,
      })),
    };
  } catch (error) {
    logError(LogCategoriesEnum.ANNOUNCE_FAILURE, logIdentifier, String(error));
    return {
      events: [],
    };
  }
};

export const dropUnrelatedTeams = (teams: string[]) => (event: Event) : boolean => !teams.reduce(
  (hasTeam, team) => hasTeam || !!event.shortName.match(new RegExp(team, 'i')),
  false,
);
