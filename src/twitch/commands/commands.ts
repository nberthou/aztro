import { ChatClient } from '@twurple/chat';
import { prismaClient } from '../../utils';
import type { CommandProps } from '../handlers/message';

export const handleCommandsListCommand = async ({ chatClient, message, channel, isUserMod, user }: CommandProps) => {
  if (message.startsWith('!commands')) {
    const [name, ...content] = message.split(' ').slice(2);
    const commandName = (name.startsWith('!') ? name.slice(1) : name).toLocaleLowerCase();
    const commandContent = content ? content.join(' ') : '';
    const command = await prismaClient.command.findUnique({
      where: { name: commandName },
    });
    if (!isUserMod) {
      chatClient.say(
        channel,
        `@${user}, tu n'as pas les droits pour créer une nouvelle commande. Demande à une modératrice de t'aider.`
      );
    } else {
      switch (message.split(' ')[1]) {
        case 'add':
          if (command) {
            chatClient.say(channel, `@${user}, cette commande existe déjà !`);
          } else {
            await prismaClient.command.create({
              data: {
                name: commandName,
                content: commandContent,
              },
            });
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été créée avec succès ! azgoldHF`);
          }
          break;
        case 'edit':
          if (!command) {
            chatClient.say(channel, `@${user}, la commande "!${commandName}" n'existe pas...`);
          } else {
            await prismaClient.command.update({
              where: { id: command.id },
              data: {
                content: commandContent,
              },
            });
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été modifiée avec succès ! azgoldHF`);
          }
          break;
        case 'remove':
          if (!command) {
            chatClient.say(channel, `@${user}, la commande "!${commandName}" n'existe pas...`);
          } else {
            await prismaClient.command.delete({
              where: { id: command.id },
            });
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été supprimée avec succès ! azgoldHF`);
          }
      }
    }
  }
};
