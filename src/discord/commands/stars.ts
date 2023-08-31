import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { prismaClient } from '../../utils';
import { getEmoji } from '../utils';

module.exports = {
  data: new SlashCommandBuilder().setName('stars').setDescription("Regarde combien d'étoiles tu possèdes actuellement."),
  async execute(interaction: CommandInteraction) {
    const currentUser = await prismaClient.user.findFirst({
      where: {
        discordUsername: interaction.member?.user.username.toLocaleLowerCase(),
      },
    });
    if (!currentUser) {
      await prismaClient.user.create({
        data: {
          discordUsername: interaction?.user.username.toLocaleLowerCase(),
          stars: 0,
        },
      });
      await interaction.reply({
        ephemeral: true,
        content: `Tu as actuellement 0 étoile. Commence à discuter pour gagner des étoiles ! ${getEmoji('azgoldStar')}`,
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle('Étoiles')
        .setDescription(`Tu as actuellement ${currentUser.stars} étoiles ! ${getEmoji('azgoldStar')}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
