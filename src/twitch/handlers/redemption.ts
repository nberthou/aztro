import { PubSubClient } from '@twurple/pubsub';
import { prismaClient } from '../../utils';
import { ChatClient } from '@twurple/chat';

export const handleRedemptions = (pubSubClient: PubSubClient, chatClient: ChatClient) => {
  const channelId = process.env.TWITCH_CHANNEL_ID ?? '';
  const channelName = process.env.TWITCH_CHANNEL_NAME ?? '';
  pubSubClient.onRedemption(channelId, async (msg) => {
    if (msg.rewardTitle.startsWith('Echanger')) {
      const currentUser = await prismaClient.user.findFirst({ where: { twitchUsername: msg.userName.toLocaleLowerCase() } });
      if (!currentUser) {
        await prismaClient.user.create({
          data: {
            twitchUsername: msg.userName.toLocaleLowerCase(),
            stars: msg.rewardCost,
          },
        });
      } else {
        await prismaClient.user.update({
          where: { id: currentUser.id },
          data: {
            stars: { increment: msg.rewardCost },
          },
        });
      }
      chatClient.say(channelName, `@${msg.userName}, tu as échangé ${msg.rewardCost} étoiles avec succès ! azgoldStar`);
    }
  });
};
