import { ChatClient } from '@twurple/chat';
import { handleShifumiCommand } from '../commands/shifumi';
import { handleStarsCommand } from '../commands/stars';
import { handleCommandsListCommand } from '../commands/commands';
import { handleRouletteCommand } from '../commands/roulette';
import { User } from '../../classes/User';
import { CommandList } from '../../classes/Command';

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
    };

    handleShifumiCommand(commandProps);
    handleStarsCommand(commandProps);
    handleRouletteCommand(commandProps);
    handleCommandsListCommand(commandProps);

    if (!message.startsWith('!') && user.toLocaleLowerCase() !== 'bot_aztro') {
      const { wallet: userWallet } = currentUser;
      if (new Date().getTime() - currentUser.updatedAt.getTime() > 5000) {
        await userWallet?.earnStars(msg.userInfo.isSubscriber ? 2 : 1);
      }
    }
  });
};
