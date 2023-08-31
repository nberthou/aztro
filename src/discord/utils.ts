import { Guild, GuildEmoji } from 'discord.js';
import { client as discordClient } from './main';

export const getGuild = (): Guild | null => discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID ?? '') || null;
export const getEmoji = (emojiName: string): GuildEmoji | null => {
  const guild = getGuild();
  if (guild) {
    return guild?.emojis.cache.find((em: GuildEmoji) => em.name === emojiName) || null;
  }
  return null;
};
