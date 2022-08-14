/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
export enum ChannelClassEnum {
  GENERAL_UPDATES = 'GENERAL_UPDATES',
  HOLIDAY = 'HOLIDAY',
};

export type DiscordRoleType = {
  id: string,
  name: string,
};

export type DiscordChannelType = {
  id: string,
};

export type DiscordServerType = {
  name: string,
  id: string,
  roles: DiscordRoleType[],
  channels: Record<ChannelClassEnum, DiscordChannelType[]>,
};
