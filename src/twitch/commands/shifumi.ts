import { ChatClient } from '@twurple/chat';
import type { CommandProps } from '../handlers/message';
import { User } from '../../classes/User';

type ShifumiProps = {
  chatClient: ChatClient;
  userChoice: 'pierre' | 'feuille' | 'ciseaux';
  currentUser: User;
  amount: number;
};
const shifumi = async ({ chatClient, userChoice, currentUser, amount }: ShifumiProps) => {
  const choices = ['pierre', 'feuille', 'ciseaux'];
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];
  const { wallet: userWallet, twitchUsername } = currentUser;

  const WINNING_COMBINATIONS = {
    pierre: 'ciseaux',
    feuille: 'pierre',
    ciseaux: 'feuille',
  };
  const userHasWon = WINNING_COMBINATIONS[userChoice] === computerChoice;

  if (userChoice === computerChoice) {
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${twitchUsername}, on a fait égalité ! Tu ne perds rien, et tu ne gagnes rien ! azgoldLUL`
    );
  } else if (userHasWon) {
    await userWallet.earnStars(amount * 1.5);
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${twitchUsername}, j'ai fait ${computerChoice}, tu as donc gagné ! Tu remportes ${amount * 1.5} étoiles ! azgoldHF`
    );
  } else {
    await userWallet.spendStars(amount);
    chatClient.say(
      process.env.TWITCH_CHANNEL_NAME ?? '',
      `@${twitchUsername}, j'ai fait ${computerChoice}, tu as donc perdu ! Tu perds ${amount} étoiles ! azgoldSad`
    );
  }
};

export const handleShifumiCommand = async ({ chatClient, user, message, channel }: CommandProps) => {
  const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: 0 });
  const { wallet: userWallet } = currentUser;
  const { stars } = userWallet;
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
