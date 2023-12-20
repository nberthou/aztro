import { Client, Collection, CommandInteraction, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import { readdirSync } from 'fs';
import { GuildEmoji } from 'discord.js';
import { CommandList } from './Command';

type DiscordClient = Client<boolean> & { commands?: Collection<string, any> };

type Command = {
  id: string;
  name: string;
  content: string;
};

export class DiscordBot {
  private readonly token: string;
  private commands: Command[];
  static client: DiscordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
  });

  constructor() {
    this.token = process.env.DISCORD_TOKEN ?? '';
    this.commands = [];
    return this;
  }

  public async init() {
    this.commands = await new CommandList().getCommands();
    const commandsData = this.commands.map((command) => ({
      data: new SlashCommandBuilder().setName(command.name).setDescription(`${command.content.slice(0, 50)}...`),
      async execute(interaction: CommandInteraction) {
        await interaction.reply(
          command.content
            .split(' ')
            .map((w) => DiscordBot.getEmoji(w) ?? w)
            .join(' ')
        );
      },
    }));

    DiscordBot.client.commands = new Collection();

    commandsData.forEach((command) => {
      if ('data' in command && 'execute' in command) {
        DiscordBot.client.commands?.set(command.data.name, command);
      }
    });
    const commandsPath = path.join(__dirname, '/../discord/commands');
    const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        DiscordBot.client.commands?.set(command.data.name, command);
      }
    }
    const eventsPath = path.join(__dirname, '/../discord/events');
    const eventsFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

    for (const file of eventsFiles) {
      const filePath = path.join(eventsPath, file);
      const event = await import(filePath);

      if (event.once) {
        DiscordBot.client.once(event.name, (...args) => event.execute(...args));
      } else {
        DiscordBot.client.on(event.name, (...args) => event.execute(...args));
      }
    }

    DiscordBot.client.login(this.token);
  }

  static getGuild() {
    return DiscordBot.client.guilds.cache.get(process.env.DISCORD_GUILD_ID ?? '') || null;
  }

  static getEmoji(emojiName: string) {
    const guild = DiscordBot.getGuild();
    if (guild) {
      return guild?.emojis.cache.find((em: GuildEmoji) => em.name === emojiName) || null;
    }
    return null;
  }
}
