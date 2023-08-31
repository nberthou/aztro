import { ChatClient } from '@twurple/chat';
import { prismaClient } from '../../utils';

const giftCounts = new Map<string | undefined, number>();

export const handleCommunitySubs = (chatClient: ChatClient) => {
  chatClient.onCommunitySub(async (channel, user, subInfo) => {
    const previousCountGift = giftCounts.get(user) ?? 0;
    giftCounts.set(user, previousCountGift + subInfo.count);
    const currentUser = await prismaClient.user.findFirst({ where: { twitchUsername: user.toLocaleLowerCase() } });
    if (!currentUser) {
      prismaClient.user.create({
        data: {
          twitchUsername: user.toLocaleLowerCase(),
          stars: 150 * subInfo.count,
        },
      });
    } else {
      prismaClient.user.update({
        where: { id: currentUser?.id },
        data: {
          stars: currentUser.stars + 150 * subInfo.count,
          updatedAt: new Date(),
        },
      });
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
    const currentUser = await prismaClient.user.findFirst({ where: { twitchUsername: user.toLocaleLowerCase() } });
    if (!currentUser) {
      await prismaClient.user.create({
        data: {
          twitchUsername: user.toLocaleLowerCase(),
          stars: 50,
        },
      });
    } else {
      await prismaClient.user.update({
        where: { id: currentUser?.id },
        data: {
          stars: { increment: 50 },
          updatedAt: new Date(),
        },
      });
    }
    chatClient.say(channel, `Merci pour le sub ${user} ! En remerciements, prends donc ces 50 étoiles ! azgoldLove`);
  });
};

export const handleResubs = (chatClient: ChatClient) => {
  chatClient.onResub(async (channel, user, { months, displayName }) => {
    const currentUser = await prismaClient.user.findFirst({ where: { twitchUsername: user.toLocaleLowerCase() } });
    if (!currentUser) {
      await prismaClient.user.create({
        data: {
          twitchUsername: user.toLocaleLowerCase(),
          stars: 50 * months,
        },
      });
    } else {
      await prismaClient.user.update({
        where: { id: currentUser?.id },
        data: {
          stars: { increment: 50 * months },
          updatedAt: new Date(),
        },
      });
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
      const currentUser = await prismaClient.user.findFirst({ where: { twitchUsername: user?.toLocaleLowerCase() } });
      if (!currentUser) {
        await prismaClient.user.create({
          data: {
            twitchUsername: user?.toLocaleLowerCase(),
            stars: 150,
          },
        });
      } else {
        await prismaClient.user.update({
          where: { id: currentUser?.id },
          data: {
            stars: { increment: 150 },
            updatedAt: new Date(),
          },
        });
      }
      chatClient.say(
        channel,
        `Merci ${user} pour le subgift à ${recipient} ! En remerciements, prends donc ces 150 étoiles ! azgoldLove`
      );
    }
  });
};
