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
  ButtonStyle,
  ButtonBuilder,
  ComponentType,
} from 'discord.js';
import { getEmoji } from '../utils';
import { User } from '../../classes/User';

enum ShifumiChoice {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
}

const choices = [
  {
    customId: ShifumiChoice.ROCK,
    label: '🗿 Pierre',
    style: ButtonStyle.Danger,
  },
  {
    customId: ShifumiChoice.PAPER,
    label: '📄 Feuille',
    style: ButtonStyle.Success,
  },
  {
    customId: ShifumiChoice.SCISSORS,
    label: '✂️ Ciseaux',
    style: ButtonStyle.Primary,
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shifumi')
    .setDescription('Joue à pierre, feuille, ciseaux pour tenter de remporter des étoiles !'),
  async execute(interaction: CommandInteraction) {
    const shifumiModal = new ModalBuilder().setCustomId('shifumiModal').setTitle('Pierre, feuille, ciseaux');
    const starsAmountInput = new TextInputBuilder()
      .setCustomId('starsAmountShifumiInput')
      .setLabel("Nombre d'étoiles")
      .setPlaceholder("Le nombre d'étoiles que tu veux miser")
      .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(starsAmountInput);
    shifumiModal.addComponents(actionRow);

    await interaction.showModal(shifumiModal);
    const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 });
    await modalInteraction.deferReply();

    const userInput = modalInteraction.fields.getTextInputValue('starsAmountShifumiInput');
    const starsAmount = parseInt(userInput, 10);

    if (isNaN(starsAmount)) {
      const failureEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Erreur')
        .setDescription(`Le nombre que tu as spécifié est invalide. !`);
      await modalInteraction.editReply({ embeds: [failureEmbed] });
      return;
    }

    // const user = await prismaClient.user.findFirst({ where: { discordUsername: interaction.user.username.toLocaleLowerCase() } });
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

    const shifumiStartEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Pierre, feuille, ciseaux')
      .setDescription(`Tu as misé ${starsAmount} étoiles ! Maintenant choisis : Pierre, feuille ou ciseaux ?`);

    const [rockButton, paperButton, scissorsButton] = choices.map((choice) => {
      return new ButtonBuilder().setCustomId(choice.customId).setLabel(choice.label).setStyle(choice.style);
    });

    const shifumiActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rockButton, paperButton, scissorsButton);

    const response = await modalInteraction.editReply({ components: [shifumiActionRow], embeds: [shifumiStartEmbed] });
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async ({ customId: userChoice }) => {
      const botChoice = choices[Math.floor(Math.random() * choices.length)].customId;
      if (userChoice === botChoice) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Gold)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(`Égalité ! Tu récupères tes ${starsAmount} étoiles ! ${getEmoji('azgoldLUL')}`);
        await modalInteraction.editReply({ embeds: [embed] });
        return;
      } else if (
        (userChoice === ShifumiChoice.ROCK && botChoice === ShifumiChoice.SCISSORS) ||
        (userChoice === ShifumiChoice.PAPER && botChoice === ShifumiChoice.ROCK) ||
        (userChoice === ShifumiChoice.SCISSORS && botChoice === ShifumiChoice.PAPER)
      ) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(
            `Tu as gagné ! Tu remportes ${starsAmount * 1.5} étoiles ! Tu as désormais ${
              user.wallet.stars + starsAmount * 1.5
            } ${getEmoji('azgoldHF')}`
          );
        await user.wallet.earnStars(starsAmount * 1.5);
        await modalInteraction.editReply({ embeds: [embed], components: [] });
        return;
      } else {
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Pierre, feuille, ciseaux')
          .setDescription(
            `Tu as perdu ! Tu perds ${starsAmount} étoiles ! Tu as désormais ${
              user.wallet.stars - starsAmount
            } étoiles ! ${getEmoji('azgoldSad')}`
          );
        await user.wallet.spendStars(starsAmount);
        await modalInteraction.editReply({ embeds: [embed], components: [] });
        return;
      }
    });
  },
};
