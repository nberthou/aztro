import { ChatClient } from '@twurple/chat';
import { User } from '../../classes/User';

const giftCounts = new Map<string | undefined, number>();

export const handleCommunitySubs = (chatClient: ChatClient) => {
  chatClient.onCommunitySub(async (channel, user, subInfo) => {
    const previousCountGift = giftCounts.get(user) ?? 0;
    giftCounts.set(user, previousCountGift + subInfo.count);
    const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 150 * subInfo.count });
    const { wallet: userWallet } = currentUser;
    await userWallet.earnStars(150 * subInfo.count);
    chatClient.say(
      channel,
      `Merci ${user} pour les ${subInfo.count} subgifts ! En remerciements, prends ces ${
        150 * subInfo.count
      } étoiles ! azgoldLove`
    );
  });
};

export const handleSubs = (chatClient: ChatClient) => {
  chatClient.onSub(async (channel, user, {}) => {
    const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 50 });
    const { wallet: userWallet } = currentUser;
    await userWallet.earnStars(50);
    chatClient.say(channel, `Merci pour le sub ${user} ! En remerciements, prends donc ces 50 étoiles ! azgoldLove`);
  });
};

export const handleResubs = (chatClient: ChatClient) => {
  chatClient.onResub(async (channel, user, { months, displayName }) => {
    const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 50 * months });
    const { wallet: userWallet } = currentUser;
    await userWallet.earnStars(50 * months);
    chatClient.say(
      channel,
      `Merci pour le ${months}ème mois de sub,  ${displayName} ! En remerciements, prends donc ces ${
        months * 50
      } étoiles ! azgoldLove`
    );
  });
};

export const handleSubGifts = (chatClient: ChatClient) => {
  chatClient.onSubGift(async (channel, recipient, subInfo) => {
    const user = subInfo.gifterDisplayName;
    const previousCountGift = giftCounts.get(user) ?? 0;
    if (previousCountGift > 0) {
      giftCounts.set(user, previousCountGift - 1);
    } else {
      const currentUser = await new User(user?.toLocaleLowerCase()).init({ initialStars: 150 });
      const { wallet: userWallet } = currentUser;
      await userWallet.earnStars(150);
      chatClient.say(
        channel,
        `Merci ${user} pour le subgift à ${recipient} ! En remerciements, prends donc ces 150 étoiles ! azgoldLove`
      );
    }
  });
};
