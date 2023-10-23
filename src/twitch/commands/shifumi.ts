import { ChatClient } from '@twurple/chat';
import type { User } from '@prisma/client';
import { prismaClient } from '../../utils';
import type { CommandProps } from '../handlers/message';

type ShifumiProps = {
  chatClient: ChatClient;
  userChoice: 'pierre' | 'feuille' | 'ciseaux';
  currentUser: User | null;
  amount: number;
};
const shifumi = async ({ chatClient, userChoice, currentUser, amount }: ShifumiProps) => {
  const choices = ['pierre', 'feuille', 'ciseaux'];
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];
  const WINNING_COMBINATIONS = {
    pierre: 'ciseaux',
    feuille: 'pierre',
    ciseaux: 'feuille',
  };
  const userHasWon = WINNING_COMBINATIONS[userChoice] === computerChoice;

  if (userChoice === computerChoice) {
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${currentUser?.twitchUsername}, on a fait égalité ! Tu ne perds rien, et tu ne gagnes rien ! azgoldLUL`
    );
  } else if (userHasWon) {
    await prismaClient.user.update({
      where: { id: currentUser?.id },
      data: { stars: { increment: amount * 1.5 }, updatedAt: new Date() },
    });
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${currentUser?.twitchUsername}, j'ai fait ${computerChoice}, tu as donc gagné ! Tu remportes ${
        amount * 1.5
      } étoiles ! azgoldHF`
    );
  } else {
    await prismaClient.user.update({
      where: { id: currentUser?.id },
      data: { stars: { decrement: amount }, updatedAt: new Date() },
    });
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${currentUser?.twitchUsername}, j'ai fait ${computerChoice}, tu as donc perdu ! Tu perds ${amount} étoiles ! azgoldSad`
    );
  }
};

export const handleShifumiCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUser = await prismaClient.user.findFirst({
    where: { twitchUsername: user.toLocaleLowerCase() },
  });
  if (message.startsWith('!shifumi')) {
    const choices = ['pierre', 'feuille', 'ciseaux'];
    if (!currentUser || currentUser.stars < 1) {
      chatClient.say(channel, `Tu n'as pas d'étoiles à miser.`);
    } else if (!choices.includes(message.split(' ')[1])) {
      chatClient.say(channel, `Tu dois choisir entre pierre, feuille ou ciseaux.`);
    } else if (
      !message.split(' ')[2] ||
      (message.split(' ')[2] && message.split(' ')[2] !== 'all' && isNaN(parseInt(message.split(' ')[2])))
    ) {
      chatClient.say(channel, `Tu dois miser un nombre d'étoiles.`);
    } else if (message.split(' ')[2] && parseInt(message.split(' ')[2]) > currentUser.stars) {
      chatClient.say(channel, `Tu n'as pas assez d'étoiles pour miser autant.`);
    } else {
      shifumi({
        chatClient,
        currentUser,
        userChoice: message.split(' ')[1] as 'pierre' | 'feuille' | 'ciseaux',
        amount: message.split(' ')[2] === 'all' ? currentUser?.stars : parseInt(message.split(' ')[2]),
      });
    }
  }
};
