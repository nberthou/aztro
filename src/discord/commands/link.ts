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
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription("Lie ton compte Twitch à ton compte Discord afin de synchroniser le nombre d'étoiles."),
  async execute(interaction: CommandInteraction) {
    const linkModal = new ModalBuilder().setCustomId('linkModal').setTitle('Synchronisation avec Twitch');
    const twitchUsernameInput = new TextInputBuilder()
      .setCustomId('twitchUsernameInput')
      .setLabel("Nom d'utilisateur Twitch")
      .setPlaceholder("Ton nom d'utilisateur Twitch (par exemple : Azgold)")
      .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(twitchUsernameInput);
    linkModal.addComponents(actionRow);

    await interaction.showModal(linkModal);

    const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 });

    await modalInteraction.deferReply({ ephemeral: true });

    if (modalInteraction) {
      const userInput = modalInteraction.fields.getTextInputValue('twitchUsernameInput').toLocaleLowerCase();

      const twitchUser = await prismaClient.user.findFirst({
        where: { twitchUsername: userInput },
      });

      const discordUser = await prismaClient.user.findFirst({
        where: { discordUsername: interaction.user.username.toLocaleLowerCase() },
      });

      if (twitchUser?.discordUsername || discordUser?.twitchUsername) {
        const failureEmbed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Synchronisation échouée.')
          .setDescription('Le pseudo Twitch est déjà relié à un pseudo Discord.');
        await modalInteraction.editReply({
          embeds: [failureEmbed],
        });
        return;
      }
      const successEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('Synchronisation réussie.')
        .setDescription(
          `Le pseudo Twitch a bien été relié à ton compte Discord. Désormais, lorsque tu écris un message sur Discord, tu gagnes une étoile ! ${getEmoji(
            'azgoldHF'
          )}`
        );
      if (!twitchUser?.discordUsername) {
        await prismaClient.user
          .updateMany({
            where: {
              twitchUsername: userInput,
            },
            data: {
              discordUsername: interaction.user.username?.toLocaleLowerCase(),
              stars: { increment: discordUser?.stars },
            },
          })
          .then(async (res) => {
            await prismaClient.user.deleteMany({
              where: {
                discordUsername: interaction.user.username?.toLocaleLowerCase(),
                twitchUsername: { isSet: false },
              },
            });
          });

        await modalInteraction.editReply({ embeds: [successEmbed] });
      } else if (!discordUser?.twitchUsername) {
        await prismaClient.user
          .updateMany({
            where: {
              discordUsername: interaction.user.username?.toLocaleLowerCase(),
            },
            data: {
              twitchUsername: userInput,
              stars: { increment: twitchUser?.stars },
            },
          })
          .then(async (res) => {
            await prismaClient.user.deleteMany({
              where: {
                twitchUsername: twitchUser?.twitchUsername,
                discordUsername: { isSet: false },
              },
            });
          });

        await modalInteraction.editReply({ embeds: [successEmbed] });
      }
    }
  },
};
