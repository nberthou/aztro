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

      const currentUser = await new User(userInput, interaction.user.username.toLocaleLowerCase()).init({ initialStars: 0 });
      const failureEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Synchronisation échouée.')
        .setDescription('Le pseudo Twitch est déjà relié à un pseudo Discord.');
      if (await currentUser.isUsernameAlreadyLinked()) {
        await modalInteraction.editReply({
          embeds: [failureEmbed],
        });
        return;
      } else {
        const successEmbed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Synchronisation réussie.')
          .setDescription(
            `Le pseudo Twitch a bien été relié à ton compte Discord. Désormais, lorsque tu écris un message sur Discord, tu gagnes une étoile ! ${DiscordBot.getEmoji(
              'azgoldHF'
            )}`
          );
        await currentUser
          .linkUsers()
          .then(async () => {
            await modalInteraction.editReply({ embeds: [successEmbed] });
          })
          .catch(async (err: string) => {
            console.log(err);
            await modalInteraction.editReply({
              embeds: [failureEmbed],
            });
          });
      }
    }
  },
};
