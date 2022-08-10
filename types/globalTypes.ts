/* eslint-disable no-unused-vars */
import { MessageEmbed } from 'discord.js';
import { ObjectId } from 'mongodb';

export type DatabaseItem = {
  _id: ObjectId,
};

export type EventType = {
  title: string,
  description: string,
  startDay: string,
  startDate: number,
  endDate?: number,
  imageUrl?: string,
  location?: string,
};

// collect: goes out to the internet and gets event items for the given sport
// mergeToDb: stores a list of events in the database
// announcer: runs once a day and needs to generate announcement items
//            typically this is something like a list of events for the given
//            sport which are scheduled for that day, but other possibilities
//            exist. ex: formula 1 posts on wednesday a bulk item which shows
//            the entire schedule for an upcoming race weekend, but also does
//            individual items on the actual day of the event, e.g. qualifier
export type SportCollectorType = {
  collect: () => Promise<EventType[]>,
  mergeToDb: (_: EventType[]) => Promise<boolean>,
  announcer: () => Promise<{
    events: EventType[],
    dedicatedEmbed: MessageEmbed,
  }>,
};
