import { ChatClient } from '@twurple/chat';
import { prismaClient } from '../../utils';
import type { CommandProps } from '../handlers/message';

export const handleStarsCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUser = await prismaClient.user.findFirst({
    where: { twitchUsername: user.toLowerCase() },
  });
  if (message.startsWith('!stars')) {
    switch (message.split(' ')[1]) {
      case 'give':
        const recipientUsername = message.split(' ')[2].startsWith('@')
          ? message.split(' ')[2].slice(1)
          : message.split(' ')[2].toLocaleLowerCase();

        if (!isNaN(parseInt(recipientUsername))) {
          chatClient.say(
            channel,
            `@${currentUser?.twitchUsername}, tu dois spécifier l'utilisateur à qui tu veux donner les étoiles.`
          );
        } else {
          const recipient = await prismaClient.user.findFirst({
            where: { twitchUsername: recipientUsername },
          });
          if (!recipient) {
            chatClient.say(
              channel,
              `@${currentUser?.twitchUsername}, l'utilisateur que tu as spécifié n'a pas encore été présent sur le stream.`
            );
          } else {
            if (!message.split(' ')[3]) {
              chatClient.say(channel, `@${currentUser?.twitchUsername}, tu dois spécifier un montant d'étoiles à donner.`);
            } else {
              const amount = parseInt(message.split(' ')[3]);
              if (isNaN(amount)) {
                chatClient.say(
                  channel,
                  `@${currentUser?.twitchUsername}, le nombre d'étoiles que tu as spécifié n'est pas valide.`
                );
              } else if (amount > (currentUser?.stars ?? 0)) {
                chatClient.say(channel, `@${currentUser?.twitchUsername}, tu n'as pas assez d'étoiles...`);
              } else {
                await prismaClient.user.update({
                  where: { id: recipient?.id },
                  data: {
                    stars: { increment: amount },
                    updatedAt: new Date(),
                  },
                });
                await prismaClient.user.update({
                  where: { id: currentUser?.id },
                  data: {
                    stars: { decrement: amount },
                    updatedAt: new Date(),
                  },
                });
                chatClient.say(
                  channel,
                  `@${currentUser?.twitchUsername}, tu as bel et bien donné ${amount} étoiles à @${recipient.twitchUsername} ! Merci pour ta générosité ! azgoldHF`
                );
              }
            }
          }
        }

        break;
      case null || undefined:
      default:
        chatClient.say(
          channel,
          `@${currentUser?.twitchUsername}, tu as actuellement ${currentUser?.stars} étoile${
            currentUser?.stars && currentUser?.stars > 1 ? 's' : ''
          } ! azgoldStar`
        );
        break;
    }
  }
};
