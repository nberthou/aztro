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
  const guild = DiscordBot.getGuild();
  let count = 0;

  setInterval(
    () => {
      if (guild) {
        const channel = guild.channels.cache.find(
          (ch) => ch.id === process.env.DISCORD_RANK_CHANNEL_ID ?? ''
        ) as BaseGuildTextChannel;
        channel.messages.fetch({ limit: 1 }).then(async (messages) => {
          const message = messages.first();
          if (message) {
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
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });
            collector.on('collect', async ({ customId }) => {
              if (customId === 'NEXT') {
                count += 1;
              } else {
                count -= 1;
              }
              users = await new User().getRank(count);
              const usersRankEmbed = getUsersRankEmbed(users);
              backButton.setDisabled(count === 0);
              if (message.createdTimestamp + 30000 < Date.now()) {
                await message.edit({ components: [actionRow], embeds: [usersRankEmbed], content: '' });
              } else {
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

const manageRolesMessage = async () => {
  const guild = DiscordBot.getGuild();
  if (guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.id === process.env.DISCORD_ROLES_CHANNEL_ID ?? ''
    ) as BaseGuildTextChannel;
    channel.messages.fetch({ limit: 1 }).then(async (messages): Promise<any> => {
      const message = messages.first();
      if (!message) {
        const rolesEmbed = new EmbedBuilder()
          .setColor(Colors.Gold)
          .setTitle('Choisis un rôle')
          .setDescription('Clique sur les boutons ci-dessous pour obtenir les rôles correspondants.')
          .addFields({
            name: '🫘 Fall Guys',
            value: 'Pour chercher et trouver des copains avec qui jouer à Fall Guys !',
          });
        const response = await channel.send({ embeds: [rolesEmbed] });
        response.react('🫘');
      } else {
        const collector = message.createReactionCollector();
        collector.on('collect', (reaction, user) => {
          switch (reaction.emoji.name) {
            case '🫘':
              const member = guild.members.cache.find((member) => member.user.id === user.id);
              const role = guild.roles.cache.find((role) => role.name === 'Fall Guys');
              if (member && role) {
                member.roles.add(role);
              }
              break;
          }
        });
      }
    });
  }
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

    const guild = DiscordBot.getGuild();
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
    manageRolesMessage();
  },
};
