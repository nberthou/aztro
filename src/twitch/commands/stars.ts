import type { CommandProps } from '../handlers/message';
import { User } from '../../classes/User';

export const handleStarsCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUserInstance = new User(user.toLocaleLowerCase());
  const userWallet = await currentUserInstance.getWallet();
  const userStars = await userWallet.getStars();

  if (message.startsWith('!stars')) {
    switch (message.split(' ')[1]) {
      case 'give':
        const recipientUsername = message.split(' ')[2].startsWith('@')
          ? message.split(' ')[2].slice(1)
          : message.split(' ')[2].toLocaleLowerCase();

        if (!isNaN(parseInt(recipientUsername))) {
          chatClient.say(
            channel,
            `@${currentUserInstance?.twitchUsername}, tu dois spécifier l'utilisateur à qui tu veux donner les étoiles.`
          );
        } else {
          const recipientInstance = new User(recipientUsername.toLocaleLowerCase());
          const recipient = await recipientInstance.getUser();
          if (!recipient) {
            chatClient.say(
              channel,
              `@${currentUserInstance?.twitchUsername}, l'utilisateur que tu as spécifié n'a pas encore été présent sur le stream.`
            );
          } else {
            if (!message.split(' ')[3]) {
              chatClient.say(
                channel,
                `@${currentUserInstance?.twitchUsername}, tu dois spécifier un montant d'étoiles à donner.`
              );
            } else {
              const amount = parseInt(message.split(' ')[3]);
              if (isNaN(amount)) {
                chatClient.say(
                  channel,
                  `@${currentUserInstance?.twitchUsername}, le nombre d'étoiles que tu as spécifié n'est pas valide.`
                );
              } else if (amount > (userStars ?? 0)) {
                chatClient.say(channel, `@${currentUserInstance?.twitchUsername}, tu n'as pas assez d'étoiles...`);
              } else {
                const recipientWallet = await recipientInstance.getWallet();
                await recipientWallet.earnStars(amount);
                await userWallet.spendStars(amount);
                chatClient.say(
                  channel,
                  `@${currentUserInstance?.twitchUsername}, tu as bel et bien donné ${amount} étoiles à @${recipient.twitchUsername} ! Merci pour ta générosité ! azgoldHF`
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
          `@${currentUserInstance.twitchUsername}, tu as actuellement ${userStars} étoile${
            userStars && userStars > 1 ? 's' : ''
          } ! azgoldStar`
        );
        break;
    }
  }
};
