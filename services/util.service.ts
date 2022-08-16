import { EventType } from '../types/globalTypes';

export const setIntervalAndStart = (fn: () => void, intervalMs: number) => {
  if (intervalMs > 20000) {
    setTimeout(fn, 5000);
  }
  return setInterval(fn, intervalMs);
};

export const unixTimeToHoursAndMinutes = (date: number) => {
  const dateObj = new Date(date);
  const minutes = dateObj.getMinutes();
  const hours = dateObj.getHours();
  const minuteStr = minutes < 10 ? `0${minutes}` : minutes.toString();
  const hourStr = hours < 10 ? `0${hours}` : hours.toString();
  return `${hourStr}:${minuteStr}`;
};

export class Semaphore {
  #p = 0;

  // eslint-disable-next-line no-unused-vars
  #waitingResolvers: ((_: unknown) => void)[] = [];

  constructor(p: number) {
    if (p < 1) {
      throw new Error('a semaphore requires a p value > 0');
    }
    this.#p = p;
  }

  acquire(): Promise<() => void> {
    if (this.#p === 0) {
      return new Promise((resolve) => {
        this.#waitingResolvers.push(resolve as () => void);
      });
    }
    this.#p--;
    const resolvingFunction = () => {
      const waitingResolver = this.#waitingResolvers.shift();
      if (waitingResolver) {
        waitingResolver(resolvingFunction);
      } else {
        this.#p++;
      }
    };
    return Promise.resolve(resolvingFunction);
  }
}

export const sleep = (ms: number) => new Promise((_resolve) => {
  const resolve = _resolve as () => void;
  setTimeout(() => resolve(), ms);
});

export const msUntilHourUTC = (hour: number) => 86400000 - ((new Date().getTime() - hour * 3600000) % 86400000);

export const padNumberToTwoDigits = (num: number) => (num < 10 ? `0${num}` : num.toString());

export const padNumberToNDigits = (num: number, size: number) => {
  const baseString = num.toString();
  const padSize = size - baseString.length;
  return padSize < 1
    ? baseString
    : `${[...new Array(padSize)].map(() => '0').join('')}${baseString}`;
};

export const eventToEmbedDataValue = (event: EventType) => {
  const baseString = `${event.description}`;
  const additionalFields = [];

  if (!event.allDay) {
    additionalFields.push(`Starts: <t:${
      event.startDate / 1000
    }:t> (<t:${
      event.startDate / 1000
    }:R>)`);
  }
  if (event.endDate) {
    additionalFields.push(
      `Ends: <t:${Math.floor(event.endDate / 1000)}:t> (<t:${Math.floor(event.endDate / 1000)}:R>)`,
    );
  }
  if (event.location) {
    additionalFields.push(`Location: ${event.location}`);
  }

  return additionalFields.length === 0 ? baseString : `${baseString}\n${additionalFields.join('\n')}`;
};
