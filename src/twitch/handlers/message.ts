import { ChatClient } from '@twurple/chat';
import { differenceInCalendarDays } from 'date-fns';

import { User } from '../../classes/User';
import { CommandList } from '../../classes/Command';

import { handleShifumiCommand } from '../commands/shifumi';
import { handleStarsCommand } from '../commands/stars';
import { handleCommandsListCommand } from '../commands/commands';
import { handleRouletteCommand } from '../commands/roulette';
import { handleCooldownCommand } from '../commands/cooldown';
import { handleDeathCounterCommand } from '../commands/deathCounter';
import { handleAuCoinCommand } from '../commands/aucoin';
import { handleFollowageCommand } from '../commands/followage';

export type CommandProps = {
  chatClient: ChatClient;
  channel: string;
  message: string;
  user: string;
  isUserMod: boolean;
  userId: string;
};

export const handleMessages = (chatClient: ChatClient, intervalRandomMessage: NodeJS.Timeout | null) => {
  chatClient.onMessage(async (channel, user, message, msg) => {
    const allCommands = await new CommandList().getCommands();
    const currentUser = await new User(user.toLocaleLowerCase()).init({ initialStars: msg.userInfo.isSubscriber ? 2 : 1 });

    allCommands.forEach((command) => {
      if (message.toLocaleLowerCase().startsWith(`!${command.name}`)) {
        chatClient.say(channel, command.content);
      }
    });

    const commandProps = {
      chatClient,
      channel,
      message,
      user,
      isUserMod: msg.userInfo.isMod || msg.userInfo.isBroadcaster,
      userId: msg.userInfo.userId,
    };

    const firstWord = message.split(' ')[0];

    switch (firstWord) {
      case '!shifumi':
        handleShifumiCommand(commandProps);
        break;
      case '!stars':
        handleStarsCommand(commandProps);
        break;
      case '!roulette':
        handleRouletteCommand(commandProps);
        break;
      case '!commands':
        handleCommandsListCommand(commandProps);
        break;
      case '!deaths':
        handleDeathCounterCommand(commandProps);
        break;
      case '!cd':
        handleCooldownCommand(commandProps);
        break;
      case '!aucoin':
        handleAuCoinCommand(commandProps);
        break;
      case '!followage':
        handleFollowageCommand(commandProps);
        break;
      default:
        break;
    }
    if (!message.startsWith('!') && user.toLocaleLowerCase() !== 'bot_aztro') {
      const { wallet: userWallet } = currentUser;
      if (differenceInCalendarDays(new Date(), currentUser.updatedAt) > 0 && intervalRandomMessage) {
        chatClient.say(channel, `Bonjour ${user}, comment ça va ? azgoldHey`);
      }
      if (new Date().getTime() - currentUser.updatedAt.getTime() > 5000 && intervalRandomMessage) {
        await userWallet?.earnStars(msg.userInfo.isSubscriber ? 2 : 1);
      }
    }

    if (msg.isFirst) {
      chatClient.say(
        channel,
        `Bienvenue sur le stream d'Azgold, ${user} ! Tu peux utiliser !commands pour voir la liste des commandes disponibles, notamment le '!etoiles' qui te permet d'en savoir plus sur le système d'étoiles qu'Azgold a mis au point ! Amuse-toi bien sur le stream ! azgoldHF`
      );
    }
  });
};
