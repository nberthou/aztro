import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { getEmoji } from '../utils';
import { User } from '../../classes/User';

module.exports = {
  data: new SlashCommandBuilder().setName('stars').setDescription("Regarde combien d'étoiles tu possèdes actuellement."),
  async execute(interaction: CommandInteraction) {
    const currentUser = await new User(interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });
    if (currentUser.wallet.stars === 0) {
      await interaction.reply({
        ephemeral: true,
        content: `Tu as actuellement 0 étoile. Commence à discuter pour gagner des étoiles ! ${getEmoji('azgoldStar')}`,
      });
    } else {
      const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle('Étoiles')
        .setDescription(`Tu as actuellement ${currentUser.wallet.stars} étoiles ! ${getEmoji('azgoldStar')}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
