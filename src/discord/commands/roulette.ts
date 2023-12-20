import {
  SlashCommandBuilder,
  CommandInteraction,
  ModalBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { User } from '../../classes/User';
import { DiscordBot } from '../../classes/DiscordBot';

module.exports = {
  data: new SlashCommandBuilder().setName('roulette').setDescription('Joue à la roulette pour gagner ou perdre des étoiles !'),
  async execute(interaction: CommandInteraction) {
    const rouletteModal = new ModalBuilder().setCustomId('rouletteModal').setTitle('Roulette');
    const starsAmountInput = new TextInputBuilder()
      .setCustomId('starsAmountRouletteInput')
      .setLabel("Nombre d'étoiles")
      .setPlaceholder("Le nombre d'étoiles que tu veux miser")
      .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(starsAmountInput);
    rouletteModal.addComponents(actionRow);

    await interaction.showModal(rouletteModal);
    const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 });
    await modalInteraction.deferReply();

    const userInput = modalInteraction.fields.getTextInputValue('starsAmountRouletteInput');
    const starsAmount = parseInt(userInput, 10);
    if (isNaN(starsAmount)) {
      const failureEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Erreur')
        .setDescription(`Le nombre que tu as spécifié est invalide. !`);
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    const user = await new User(interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });

    if (user.wallet.stars === 0) {
      const failureEmbed = new EmbedBuilder().setColor(Colors.Red).setTitle('Erreur').setDescription(`Tu n'as pas d'étoiles !`);
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    if (user.wallet.stars < starsAmount) {
      const failureEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Erreur')
        .setDescription(`Tu n'as pas assez d'étoiles ! Tu n'en as que ${user.wallet.stars} !`);
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    const hasWon = Math.random() > 0.5;
    hasWon ? await user.wallet.earnStars(starsAmount) : await user.wallet.spendStars(starsAmount);
    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Résultat de la roulette')
      .setDescription(
        `Tu as ${hasWon ? 'gagné' : 'perdu'} ${starsAmount} étoiles ! Tu as désormais ${
          hasWon ? user.wallet.stars + starsAmount : user.wallet.stars - starsAmount
        } étoiles ! ${DiscordBot.getEmoji(hasWon ? 'azgoldStar' : 'azgoldSad')}`
      );
    await modalInteraction.editReply({ embeds: [resultEmbed] });
  },
};
