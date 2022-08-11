/* eslint-disable arrow-body-style */
import { EventControllerType } from '../types/globalTypes';

const collect = async () => {
  return [];
};

const mergeToDb = async () => {
  return false;
};

const announcer = async () => {
  return {
    events: [],
  };
};

export default {
  collect,
  mergeToDb,
  announcer,
} as EventControllerType;
