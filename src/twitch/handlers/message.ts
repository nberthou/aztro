import { ChatClient } from '@twurple/chat';
import { prismaClient } from '../../utils';
import { handleShifumiCommand } from '../commands/shifumi';
import { handleStarsCommand } from '../commands/stars';
import { handleCommandsListCommand } from '../commands/commands';
import { handleRouletteCommand } from '../commands/roulette';
import { User } from '../../classes/User';

export type CommandProps = {
  chatClient: ChatClient;
  channel: string;
  message: string;
  user: string;
  isUserMod: boolean;
};

export const handleMessages = (chatClient: ChatClient) => {
  chatClient.onMessage(async (channel, user, message, msg) => {
    console.debug('--------------------------------------------');
    console.debug('message.ts user l.17', user);
    console.debug('--------------------------------------------');
    const allCommands = await prismaClient.command.findMany();

    const currentUserInstance = new User(user.toLocaleLowerCase());
    const currentUser = await currentUserInstance.getUser();

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
    };

    handleShifumiCommand(commandProps);
    handleStarsCommand(commandProps);
    handleRouletteCommand(commandProps);
    handleCommandsListCommand(commandProps);

    if (!message.startsWith('!') && user.toLocaleLowerCase() !== 'bot_aztro') {
      if (!currentUser) {
        new User(user.toLocaleLowerCase()).createUser({ initialStars: msg.userInfo.isSubscriber ? 2 : 1 });
      } else {
        if (new Date().getTime() - currentUser.updatedAt.getTime() > 5000) {
          const userWallet = await currentUserInstance.getWallet();
          userWallet.earnStars(msg.userInfo.isSubscriber ? 2 : 1);
        }
      }
    }
  });
};
