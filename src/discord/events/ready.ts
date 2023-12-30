import {
  Events,
  Client,
  Collection,
  REST,
  Routes,
  BaseGuildTextChannel,
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { prismaClient } from '../../utils';
import { DiscordBot } from '../../classes/DiscordBot';
import { User } from '../../classes/User';

type DiscordClient = Client<boolean> & { commands?: Collection<string, any> };

const token = process.env.DISCORD_TOKEN ?? '';
const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const guildId = process.env.DISCORD_GUILD_ID ?? '';
const guild = DiscordBot.getGuild();

const rest = new REST().setToken(token);

export const getUsersRankEmbed = (users: User[]): EmbedBuilder => {
  const guild = DiscordBot.getGuild();
  const guildMembers = guild?.members.cache;
  return new EmbedBuilder()
    .setColor(Colors.Gold)
    .setTitle('Classement des étoiles')
    .addFields(
      ...users.map((user) => {
        const guildMember = guildMembers?.find((member) => !member.user.bot && member.user.username === user.discordUsername);
        return {
          name: guildMember?.displayName ?? (`${user.twitchUsername} (twitch)` || 'Utilisateur inconnu'),
          value: `${user.wallet.stars} ${DiscordBot.getEmoji('azgoldStar')}`,
        };
      })
    )
    .setTimestamp();
};

const updateRankMessage = () => {
  setInterval(
    () => {
      if (guild) {
        const channel = guild.channels.cache.find(
          (ch) => ch.id === process.env.DISCORD_RANK_CHANNEL_ID ?? ''
        ) as BaseGuildTextChannel;
        channel.messages.fetch({ limit: 1 }).then(async (messages) => {
          const message = messages.first();
          if (message) {
            let count = 0;
            let users = await new User().getRank(count);
            const backButton = new ButtonBuilder()
              .setCustomId('BACK')
              .setLabel('◀️ Précédent')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(count === 0);
            const usersRankEmbed = getUsersRankEmbed(users);
            const nextButton = new ButtonBuilder().setCustomId('NEXT').setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);
            const response = await message.edit({ components: [actionRow], embeds: [usersRankEmbed], content: '' });
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });
            collector.on('collect', async ({ customId }) => {
              if (customId === 'NEXT') {
                count += 1;
              } else {
                count -= 1;
              }
              users = await new User().getRank(count);

              const usersRankEmbed = getUsersRankEmbed(users);
              if (message.createdTimestamp + 300000 < Date.now()) {
                await message.edit({ components: [], embeds: [usersRankEmbed], content: '' });
              } else {
                backButton.setDisabled(count === 0);
                await message.edit({ components: [actionRow], embeds: [usersRankEmbed], content: '' });
              }
            });
          }
        });
      }
    },
    1000 * 60 * 5
  );
};

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

    guild?.commands.set([]);

    (async () => {
      await rest
        .put(Routes.applicationCommands(clientId), { body: clientCommands })
        .then((data) => {
          console.log(`${(data as unknown[]).length} commandes ont été actualisées.`);
        })
        .catch(console.error);
    })();

    updateRankMessage();
  },
};
