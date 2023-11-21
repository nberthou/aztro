import { Events, Client, Collection, REST, Routes } from 'discord.js';
import { prismaClient } from '../../utils';
import { getGuild } from '../utils';

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
    const commands = await prismaClient.command.findMany();
    console.log(`Actualisation des ${commands.length} commandes d'Aztro.`);
    let clientCommands: any[] = [];
    for (const key of client.commands!.keys()) {
      clientCommands.push(client.commands?.get(key));
    }

    clientCommands = clientCommands.map((command) => command.data.toJSON());
    const guild = getGuild();
    guild?.commands.set([]);
    console.debug('--------------------------------------------');
    console.debug(
      'ready.ts commandNames l.27',
      clientCommands.map((command) => command.name)
    );
    console.debug('--------------------------------------------');
    (async () => {
      await rest
        .put(Routes.applicationCommands(clientId), { body: clientCommands })
        .then((data) => {
          console.log(`${(data as unknown[]).length} commandes ont été actualisées.`);
        })
        .catch(console.error);
    })();
  },
};
