import type { CommandProps } from '../handlers/message';
import { User } from '../../classes/User';

export const handleStarsCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 0 });
  const { wallet: userWallet, twitchUsername } = currentUser;
  const { stars } = userWallet;

  switch (message.split(' ')[1]) {
    case 'give':
      const recipientUsername = message.split(' ')[2].startsWith('@')
        ? message.split(' ')[2].slice(1)
        : message.split(' ')[2].toLocaleLowerCase();

      if (!isNaN(parseInt(recipientUsername))) {
        chatClient.say(channel, `@${twitchUsername}, tu dois spécifier l'utilisateur à qui tu veux donner les étoiles.`);
      } else {
        const recipient = await new User(recipientUsername.toLocaleLowerCase()).init({ initialStars: 0 });
        if (!message.split(' ')[3]) {
          chatClient.say(channel, `@${twitchUsername}, tu dois spécifier un montant d'étoiles à donner.`);
        } else {
          const amount = parseInt(message.split(' ')[3]);
          if (isNaN(amount)) {
            chatClient.say(channel, `@${twitchUsername}, le nombre d'étoiles que tu as spécifié n'est pas valide.`);
          } else if (amount > (stars ?? 0)) {
            chatClient.say(channel, `@${twitchUsername}, tu n'as pas assez d'étoiles...`);
          } else {
            const recipientWallet = recipient.wallet;
            await recipientWallet.earnStars(amount);
            await userWallet.spendStars(amount);
            chatClient.say(
              channel,
              `@${twitchUsername}, tu as bel et bien donné ${amount} étoiles à @${recipient.twitchUsername} ! Merci pour ta générosité ! azgoldHF`
            );
          }
        }
      }

      break;
    case null || undefined:
    default:
      chatClient.say(
        channel,
        `@${twitchUsername}, tu as actuellement ${stars} étoile${stars && stars > 1 ? 's' : ''} ! azgoldStar`
      );
      break;
  }
};
