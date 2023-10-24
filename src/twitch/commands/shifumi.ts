import { ChatClient } from '@twurple/chat';
import type { User as UserType } from '@prisma/client';
import type { CommandProps } from '../handlers/message';
import { User } from '../../classes/User';

type ShifumiProps = {
  chatClient: ChatClient;
  userChoice: 'pierre' | 'feuille' | 'ciseaux';
  currentUser: UserType | null;
  amount: number;
};
const shifumi = async ({ chatClient, userChoice, currentUser, amount }: ShifumiProps) => {
  const choices = ['pierre', 'feuille', 'ciseaux'];
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];
  const currentUserInstance = new User(currentUser?.twitchUsername);
  const userWallet = await currentUserInstance.getWallet();

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
    userWallet.earnStars(amount * 1.5);
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${currentUser?.twitchUsername}, j'ai fait ${computerChoice}, tu as donc gagné ! Tu remportes ${
        amount * 1.5
      } étoiles ! azgoldHF`
    );
  } else {
    userWallet.spendStars(amount);
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${currentUser?.twitchUsername}, j'ai fait ${computerChoice}, tu as donc perdu ! Tu perds ${amount} étoiles ! azgoldSad`
    );
  }
};

export const handleShifumiCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUserInstance = new User(user.toLocaleLowerCase());
  const currentUser = await currentUserInstance.getUser();
  const userWallet = await currentUserInstance.getWallet();
  const stars = await userWallet.getStars();
  if (message.startsWith('!shifumi')) {
    const choices = ['pierre', 'feuille', 'ciseaux'];
    if (!stars || stars < 1) {
      chatClient.say(channel, `Tu n'as pas d'étoiles à miser.`);
    } else if (!choices.includes(message.split(' ')[1])) {
      chatClient.say(channel, `Tu dois choisir entre pierre, feuille ou ciseaux.`);
    } else if (
      !message.split(' ')[2] ||
      (message.split(' ')[2] && message.split(' ')[2] !== 'all' && isNaN(parseInt(message.split(' ')[2])))
    ) {
      chatClient.say(channel, `Tu dois miser un nombre d'étoiles.`);
    } else if (message.split(' ')[2] && parseInt(message.split(' ')[2]) > stars) {
      chatClient.say(channel, `Tu n'as pas assez d'étoiles pour miser autant.`);
    } else {
      shifumi({
        chatClient,
        currentUser,
        userChoice: message.split(' ')[1] as 'pierre' | 'feuille' | 'ciseaux',
        amount: message.split(' ')[2] === 'all' ? stars : parseInt(message.split(' ')[2]),
      });
    }
  }
};
