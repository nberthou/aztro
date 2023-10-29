import { getEmoji, getGuild } from '../utils';
import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ComponentType,
  ButtonStyle,
  ButtonBuilder,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { User } from '../../classes/User';

enum ButtonType {
  NEXT = 'NEXT',
  BACK = 'BACK',
}

module.exports = {
  data: new SlashCommandBuilder().setName('rank').setDescription("Regarde qui sont les personnes possédant le plus d'étoiles !"),
  async execute(interaction: CommandInteraction) {
    let count = 0;
    let users = await new User().getRank(count);
    const backButton = new ButtonBuilder()
      .setCustomId('BACK')
      .setLabel('◀️ Précédent')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(count === 0);
    const nextButton = new ButtonBuilder().setCustomId('NEXT').setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

    const guild = getGuild();

    const getUsersRankEmbed = (users: User[]): EmbedBuilder => {
      const guildMembers = guild?.members.cache;
      return new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle('Classement des étoiles')
        .addFields(
          ...users.map((user) => {
            const guildMember = guildMembers?.find((member) => !member.user.bot && member.user.username === user.discordUsername);
            return {
              name: guildMember?.displayName ?? (`${user.twitchUsername} (twitch)` || 'Utilisateur inconnu'),
              value: `${user.wallet.stars} ${getEmoji('azgoldStar')}`,
            };
          })
        )
        .setTimestamp();
    };

    const usersRankEmbed = getUsersRankEmbed(users);
    const response = await interaction.reply({ components: [actionRow], embeds: [usersRankEmbed] });
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async ({ customId }) => {
      if (customId === ButtonType.NEXT) {
        count += 1;
      } else {
        count -= 1;
      }
      users = await new User().getRank(count);

      const usersRankEmbed = getUsersRankEmbed(users);
      if (interaction.createdTimestamp + 60000 < Date.now()) {
        await interaction.editReply({ components: [], embeds: [usersRankEmbed] });
      } else {
        backButton.setDisabled(count === 0);
        await interaction.editReply({ components: [actionRow], embeds: [usersRankEmbed] });
      }
    });
  },
};
