import { Events, Message } from 'discord.js';
import { prismaClient } from '../../utils';

module.exports = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    const currentUser = await prismaClient.user.findFirst({
      where: {
        discordUsername: message.author.username,
      },
    });

    if (!currentUser) {
      await prismaClient.user.create({
        data: {
          discordUsername: message.author.username,
          stars: 1,
        },
      });
    } else if (currentUser && currentUser.updatedAt < new Date(Date.now() - 5000)) {
      await prismaClient.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          stars: { increment: 1 },
        },
      });
    }
  },
};