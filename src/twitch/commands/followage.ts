import { CommandProps } from '../handlers/message';
import { TwitchBot } from '../../classes/TwitchBot';

export const handleFollowageCommand = async ({ chatClient, message, channel, isUserMod, user, userId }: CommandProps) => {
  const {
    data: [follow],
  } = await TwitchBot.apiClient.channels.getChannelFollowers(process.env.TWITCH_CHANNEL_ID!, userId);

  if (follow) {
    const currentTimestamp = new Date();
    const followTimestamp = new Date(follow.followDate);
    const diff = currentTimestamp.getTime() - followTimestamp.getTime();
    // Convert to years, months, days, hours
    const diffYears = Math.floor(diff / 31536000000);
    const diffMonths = Math.floor((diff / 2628000000) % 12);
    const diffDays = Math.floor((diff / 86400000) % 30);
    const diffHours = Math.floor((diff / 3600000) % 24);
    const diffMinutes = Math.floor((diff / 60000) % 60);
    const diffTime = `${diffYears} années, ${diffMonths} mois, ${diffDays} jours, ${diffHours} heures et ${diffMinutes} minutes`;
    chatClient.say(channel, `@${user}, tu follow la chaîne d'Azgold depuis ${diffTime} !`);
  } else {
    chatClient.say(channel, `@${user}, tu n'est pas follow à la chaîne d'Azgold !`);
  }
};
