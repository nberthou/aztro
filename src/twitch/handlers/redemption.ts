import { PubSubClient } from '@twurple/pubsub';
import { ChatClient } from '@twurple/chat';
import { User } from '../../classes/User';

export const handleRedemptions = (pubSubClient: PubSubClient, chatClient: ChatClient) => {
  const channelId = process.env.TWITCH_CHANNEL_ID ?? '';
  const channelName = process.env.TWITCH_CHANNEL_NAME ?? '';
  pubSubClient.onRedemption(channelId, async (msg) => {
    if (msg.rewardTitle.startsWith('Echanger')) {
      const currentUser = await new User(msg.userName.toLocaleLowerCase()).init({ initialStars: msg.rewardCost });
      const { wallet: userWallet } = currentUser;
      await userWallet.spendStars(msg.rewardCost);
      chatClient.say(channelName, `@${msg.userName}, tu as échangé ${msg.rewardCost} étoiles avec succès ! azgoldStar`);
    }
  });
};
