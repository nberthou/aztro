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
import { getUsersRankEmbed } from '../events/ready';

enum ButtonType {
  NEXT = 'NEXT',
  BACK = 'BACK',
}

export const getRank = async (interaction: CommandInteraction): Promise<any> => {
  let count = 0;
  let users = await new User().getRank(count);
  const backButton = new ButtonBuilder()
    .setCustomId(ButtonType.BACK)
    .setLabel('◀️ Précédent')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(count === 0);
  const nextButton = new ButtonBuilder().setCustomId(ButtonType.NEXT).setLabel('Suivant ▶️').setStyle(ButtonStyle.Primary);
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

  const usersRankEmbed = getUsersRankEmbed(users);
  const response = await interaction.reply({ components: [actionRow], embeds: [usersRankEmbed] });
  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

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
};

module.exports = {
  data: new SlashCommandBuilder().setName('rank').setDescription("Regarde qui sont les personnes possédant le plus d'étoiles !"),
  async execute(interaction: CommandInteraction) {
    getRank(interaction);
  },
};
