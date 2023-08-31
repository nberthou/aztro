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
import { prismaClient } from '../../utils';
import { getEmoji } from '../utils';

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

    const user = await prismaClient.user.findFirst({
      where: { discordUsername: interaction.user.username?.toLocaleLowerCase() },
    });

    if (!user || user.stars === 0) {
      const failureEmbed = new EmbedBuilder().setColor(Colors.Red).setTitle('Erreur').setDescription(`Tu n'as pas d'étoiles !`);
      if (!user) {
        await prismaClient.user.create({
          data: {
            discordUsername: interaction.user.username?.toLocaleLowerCase(),
            stars: 0,
          },
        });
      }
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    if (user.stars < starsAmount) {
      const failureEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Erreur')
        .setDescription(`Tu n'as pas assez d'étoiles ! Tu n'en as que ${user.stars} !`);
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    const hasWon = Math.random() > 0.5;
    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        stars: hasWon ? { increment: starsAmount } : { decrement: starsAmount },
      },
    });
    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Résultat de la roulette')
      .setDescription(
        `Tu as ${hasWon ? 'gagné' : 'perdu'} ${starsAmount} étoiles ! Tu as désormais ${
          hasWon ? user.stars + starsAmount : user.stars - starsAmount
        } étoiles ! ${getEmoji(hasWon ? 'azgoldStar' : 'azgoldSad')}`
      );
    await modalInteraction.editReply({ embeds: [resultEmbed] });
  },
};
