import { ChatClient } from '@twurple/chat';
import { prismaClient } from '../../utils';
import { handleShifumiCommand } from '../commands/shifumi';
import { handleStarsCommand } from '../commands/stars';
import { handleCommandsListCommand } from '../commands/commands';
import { handleRouletteCommand } from '../commands/roulette';

export type CommandProps = {
  chatClient: ChatClient;
  channel: string;
  message: string;
  user: string;
  isUserMod: boolean;
};

export const handleMessages = (chatClient: ChatClient) => {
  chatClient.onMessage(async (channel, user, message, msg) => {
    const allCommands = await prismaClient.command.findMany();
    const currentUser = await prismaClient.user.findFirst({
      where: { twitchUsername: user.toLocaleLowerCase() },
    });
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
        await prismaClient.user.create({
          data: {
            twitchUsername: user.toLocaleLowerCase(),
            stars: msg.userInfo.isSubscriber ? 2 : 1,
          },
        });
      } else if (currentUser && new Date().getTime() - currentUser.updatedAt.getTime() > 5000) {
        await prismaClient.user.update({
          where: { id: currentUser?.id },
          data: {
            stars: { increment: msg.userInfo.isSubscriber ? 2 : 1 },
            updatedAt: new Date(),
          },
        });
      }
    }
  });
};
