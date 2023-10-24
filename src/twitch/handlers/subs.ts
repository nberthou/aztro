import { ChatClient } from '@twurple/chat';
import { User } from '../../classes/User';

const giftCounts = new Map<string | undefined, number>();

export const handleCommunitySubs = (chatClient: ChatClient) => {
  chatClient.onCommunitySub(async (channel, user, subInfo) => {
    const previousCountGift = giftCounts.get(user) ?? 0;
    giftCounts.set(user, previousCountGift + subInfo.count);
    const currentUserInstance = new User(user.toLocaleLowerCase());
    const currentUser = await currentUserInstance.getUser();
    if (!currentUser) {
      await currentUserInstance.createUser({ initialStars: 150 * subInfo.count });
    } else {
      const userWallet = await currentUserInstance.getWallet();
      await userWallet.earnStars(150 * subInfo.count);
    }
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
    const currentUserInstance = new User(user.toLocaleLowerCase());
    const currentUser = await currentUserInstance.getUser();
    if (!currentUser) {
      await currentUserInstance.createUser({ initialStars: 50 });
    } else {
      const userWallet = await currentUserInstance.getWallet();
      await userWallet.earnStars(50);
    }
    chatClient.say(channel, `Merci pour le sub ${user} ! En remerciements, prends donc ces 50 étoiles ! azgoldLove`);
  });
};

export const handleResubs = (chatClient: ChatClient) => {
  chatClient.onResub(async (channel, user, { months, displayName }) => {
    const currentUserInstance = new User(user.toLocaleLowerCase());
    const currentUser = await currentUserInstance.getUser();
    if (!currentUser) {
      await currentUserInstance.createUser({ initialStars: 50 * months });
    } else {
      const userWallet = await currentUserInstance.getWallet();
      await userWallet.earnStars(50 * months);
    }
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
      const currentUserInstance = new User(user?.toLocaleLowerCase());
      const currentUser = await currentUserInstance.getUser();
      if (!currentUser) {
        await currentUserInstance.createUser({ initialStars: 150 });
      } else {
        const userWallet = await currentUserInstance.getWallet();
        await userWallet.earnStars(150);
      }
      chatClient.say(
        channel,
        `Merci ${user} pour le subgift à ${recipient} ! En remerciements, prends donc ces 150 étoiles ! azgoldLove`
      );
    }
  });
};
