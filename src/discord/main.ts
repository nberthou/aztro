import { Client, GatewayIntentBits, SlashCommandBuilder, Collection, CommandInteraction } from 'discord.js';
import path from 'path';
import { readdirSync } from 'fs';
import { getEmoji } from './utils';
import { CommandList } from '../classes/Command';

type DiscordClient = Client<boolean> & { commands?: Collection<string, any> };

export const client: DiscordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
async function main() {
  const token = process.env.DISCORD_TOKEN ?? '';

  const commands = await new CommandList().getCommands();

  const commandsData = commands.map((command) => ({
    data: new SlashCommandBuilder().setName(command.name).setDescription(`${command.content.slice(0, 50)}...`),
    async execute(interaction: CommandInteraction) {
      await interaction.reply(
        command.content
          .split(' ')
          .map((w) => getEmoji(w) ?? w)
          .join(' ')
      );
    },
  }));

  client.commands = new Collection();

  commandsData.forEach((command) => {
    if ('data' in command && 'execute' in command) {
      client.commands?.set(command.data.name, command);
    }
  });

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands?.set(command.data.name, command);
    }
  }

  const eventsPath = path.join(__dirname, 'events');
  const eventsFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

  for (const file of eventsFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  client.login(token);
}
export default main;
