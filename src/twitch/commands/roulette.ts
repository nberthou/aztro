import { ChatClient } from '@twurple/chat';
import type { CommandProps } from '../handlers/message';
import { prismaClient } from '../../utils';

export const handleRouletteCommand = async ({ chatClient, message, user, channel }: CommandProps) => {
  if (message.startsWith('!roulette')) {
    const currentUser = await prismaClient.user.findFirst({
      where: { twitchUsername: user.toLocaleLowerCase() },
    });
    const amount = message.split(' ')[1] === 'all' ? currentUser?.stars : parseInt(message.split(' ')[1]);
    const hasWon = Math.random() > 0.5;
    if (!amount || isNaN(amount)) {
      chatClient.say(channel, `@${user}, le nombre que tu as spécifié n'est pas correct.`);
    } else if (currentUser && amount > currentUser?.stars) {
      chatClient.say(channel, `@${user}, tu as misé plus d'étoiles que ce que tu possèdes actuellement.`);
    } else {
      await prismaClient.user.update({
        where: { id: currentUser?.id },
        data: {
          stars: hasWon ? { increment: amount } : { decrement: amount },
        },
      });
      chatClient.say(
        channel,
        `@${user}, tu as ${hasWon ? 'gagné' : 'perdu'} ${amount} étoile${amount > 1 ? 's' : ''} ! Tu as désormais ${
          hasWon ? currentUser && currentUser?.stars + amount : currentUser && currentUser?.stars - amount
        } étoiles ! ${hasWon ? 'azgoldStar' : 'azgoldSad'}`
      );
    }
  }
};
