import { MongoClient } from 'mongodb';
import { config } from '../config';

export const client = new MongoClient(
  `mongodb+srv://${
    config.mongo.username
  }:${
    config.mongo.password
  }@${
    config.mongo.url
  }/${
    config.mongo.primaryDatabase
  }?retryWrites=true&w=majority`,
  {
    serverSelectionTimeoutMS: 10000,
  },
);

export const collections = {
  formula1: client.db(config.mongo.primaryDatabase).collection('formula1'),
  nfl: client.db(config.mongo.primaryDatabase).collection('nfl'),
  mlb: client.db(config.mongo.primaryDatabase).collection('mlb'),
  nhl: client.db(config.mongo.primaryDatabase).collection('nhl'),
  mls: client.db(config.mongo.primaryDatabase).collection('mls'),
  ncaam: client.db(config.mongo.primaryDatabase).collection('ncaam'),
  ncaab: client.db(config.mongo.primaryDatabase).collection('ncaab'),
  ncaaf: client.db(config.mongo.primaryDatabase).collection('ncaaf'),
  ncaas: client.db(config.mongo.primaryDatabase).collection('ncaas'),
  ncaaws: client.db(config.mongo.primaryDatabase).collection('ncaaws'),
  fifawc: client.db(config.mongo.primaryDatabase).collection('fifawc'),
  fifawwc: client.db(config.mongo.primaryDatabase).collection('fifawwc'),
  holiday: client.db(config.mongo.primaryDatabase).collection('holiday'),
};
