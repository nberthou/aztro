import type { CommandProps } from '../handlers/message';
import { User } from '../../classes/User';

export const handleRouletteCommand = async ({ chatClient, message, user, channel }: CommandProps) => {
  if (message.startsWith('!roulette')) {
    const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 0 });
    const { wallet: userWallet } = currentUser;
    const { stars } = userWallet;

    const amount = message.split(' ')[1] === 'all' ? stars : parseInt(message.split(' ')[1]);
    const hasWon = Math.random() > 0.5;
    if (!amount || isNaN(amount)) {
      chatClient.say(channel, `@${user}, le nombre que tu as spécifié n'est pas correct.`);
    } else if (amount > stars) {
      chatClient.say(channel, `@${user}, tu as misé plus d'étoiles que ce que tu possèdes actuellement.`);
    } else {
      hasWon ? await userWallet.earnStars(amount) : await userWallet.spendStars(amount);
      chatClient.say(
        channel,
        `@${user}, tu as ${hasWon ? 'gagné' : 'perdu'} ${amount} étoile${amount > 1 ? 's' : ''} ! Tu as désormais ${
          hasWon ? stars + amount : stars - amount
        } étoiles ! ${hasWon ? 'azgoldStar' : 'azgoldSad'}`
      );
    }
  }
};
