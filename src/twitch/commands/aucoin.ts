import { TwitchBot } from '../../classes/TwitchBot';
import { CommandProps } from '../handlers/message';
import { DiscordBot } from '../../classes/DiscordBot';
import { User } from '../../classes/User';

export const handleAuCoinCommand = async ({ chatClient, message, channel, isUserMod, user }: CommandProps) => {
  const [_, userToTimeout, ...__] = message.split(' ');
  const userTo = userToTimeout.replace('@', '');
  const dbUser = await new User(null, userTo.toLocaleLowerCase()).init({ initialStars: 0 });
  const timeoutDuration = 60;
  const timeoutReason = "C'est vilain de se bash";
  TwitchBot.bot.timeout(channel, userTo, timeoutDuration, timeoutReason);
  chatClient.say(channel, `${userToTimeout}, c'est vilain de se bash ! azgoldAuCoin`);
  DiscordBot.moveUserToVoiceChannel(dbUser.discordUsername ?? userTo, process.env.DISCORD_CORNER_CHANNEL_ID!);
};
