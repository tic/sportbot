export interface Formula1EventType {
  '@context': string,
  '@type': string,
  '@id': string,
  name: string,
  description: string,
  image: {
    '@type': string,
    url: string,
  },
  location: {
    '@type': string,
    '@id': string,
    name: string,
    address: string,
  },
  startDate: string,
  endDate: string,
  eventStatus: string,
  performers: string,
  eventAttendanceMode: string,
};

export interface Formula1WeekendType extends Formula1EventType {
  subEvent: Formula1EventType[],
};
