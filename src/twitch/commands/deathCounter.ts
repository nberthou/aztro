import { ChatClient } from '@twurple/chat';
import type { CommandProps } from '../handlers/message';
import { DeathCounter } from '../../classes/DeathCounter';

export const handleDeathCounterCommand = async ({ chatClient, user, message, channel, isUserMod }: CommandProps) => {
  const [_, keyword, ...args] = message.split(' ');
  switch (keyword) {
    case 'add':
      const number = parseInt(args[0]);
      const amount = isNaN(number) ? 1 : number;
      if (!isUserMod) {
        chatClient.say(channel, `@${user}, tu n'as pas le droit de faire ça ! Demande de l'aide à une modératrice !`);
      } else {
        const deathCounter = await new DeathCounter().init();
        await deathCounter.addDeaths(amount);
        chatClient.say(channel, `@${user}, Azgold est mort ${deathCounter.deathCount} fois ! azgoldLUL`);
      }
      break;
    case 'set':
      const newGame = args.join(' ').toLocaleLowerCase();
      if (!isUserMod) {
        chatClient.say(channel, `@${user}, tu n'as pas le droit de faire ça ! Demande de l'aide à une modératrice !`);
      } else {
        const deathCounter = await new DeathCounter().init();
        await deathCounter.setActiveGame(newGame);
        chatClient.say(channel, `@${user}, le jeu a été mis à jour ! azgoldHF`);
      }
  }
};
