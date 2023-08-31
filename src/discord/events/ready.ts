import { Events, Client, Collection, REST, Routes } from 'discord.js';
import { prismaClient } from '../../utils';

type DiscordClient = Client<boolean> & { commands?: Collection<string, any> };

const token = process.env.DISCORD_TOKEN ?? '';
const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const guildId = process.env.DISCORD_GUILD_ID ?? '';

const rest = new REST().setToken(token);

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: DiscordClient) {
    console.log(`Je suis actuellement connecté sur Discord.`);
    try {
      const commands = await prismaClient.command.findMany();
      console.log(`Actualisation des ${commands.length} commandes d'Aztro.`);
      let clientCommands = [];
      console.debug('--------------------------------------------');
      console.debug(client.commands!.keys());
      console.debug('--------------------------------------------');
      for (const key of client.commands!.keys()) {
        clientCommands.push(client.commands?.get(key));
      }
      clientCommands = clientCommands.map((command) => command.data.toJSON());
      const data = (await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: clientCommands })) as any[];
      console.log(`${data.length} commandes ont été actualisées.`);
    } catch (error) {
      console.error(error);
    }
  },
};
