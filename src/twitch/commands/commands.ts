import type { CommandProps } from '../handlers/message';
import { CommandList } from '../../classes/Command';
import { Command } from '@prisma/client';

export const handleCommandsListCommand = async ({ chatClient, message, channel, isUserMod, user }: CommandProps) => {
  if (message.startsWith('!commands')) {
    const [name, ...content] = message.split(' ').slice(2);
    const commandName = name && (name.startsWith('!') ? name.slice(1) : name).toLocaleLowerCase();
    const commandContent = content ? content.join(' ') : '';
    const commandListInstance = new CommandList();
    if (!isUserMod && message.split(' ')[1]) {
      chatClient.say(
        channel,
        `@${user}, tu n'as pas les droits pour créer une nouvelle commande. Demande à une modératrice de t'aider.`
      );
    } else if (!message.split(' ')[1]) {
      const allCommands = await commandListInstance.getCommands();
      chatClient.say(
        channel,
        `@${user}, voici la liste des commandes disponibles : ${allCommands
          .map((command: Command) => `!${command.name}`)
          .join(', ')}`
      );
    } else {
      const commandExists = await commandListInstance.getCommand(commandName);
      switch (message.split(' ')[1]) {
        case 'add':
          if (commandExists) {
            chatClient.say(channel, `@${user}, cette commande existe déjà !`);
          } else {
            await commandListInstance.addCommand(commandName, commandContent);
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été créée avec succès ! azgoldHF`);
          }
          break;
        case 'edit':
          if (!commandExists) {
            chatClient.say(channel, `@${user}, la commande "!${commandName}" n'existe pas...`);
          } else {
            await commandListInstance.editCommand(commandName, commandContent);
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été modifiée avec succès ! azgoldHF`);
          }
          break;
        case 'remove':
          if (!commandExists) {
            chatClient.say(channel, `@${user}, la commande "!${commandName}" n'existe pas...`);
          } else {
            await commandListInstance.removeCommand(commandName);
            chatClient.say(channel, `@${user}, la commande "!${commandName}" a été supprimée avec succès ! azgoldHF`);
          }
      }
    }
  }
};
