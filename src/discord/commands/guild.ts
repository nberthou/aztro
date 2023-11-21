import {
  SlashCommandBuilder,
  CommandInteraction,
  ButtonStyle,
  ButtonBuilder,
  Colors,
  EmbedBuilder,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import { User } from '../../classes/User';

enum NoGuildButtonType {
  JOIN = 'JOIN',
  INFO = 'INFO',
}

const joinGuild = async (interaction: CommandInteraction) => {};

const handleNoGuild = async (interaction: CommandInteraction) => {
  const joinButton = new ButtonBuilder()
    .setCustomId(NoGuildButtonType.JOIN)
    .setLabel('Rejoindre une guilde')
    .setStyle(ButtonStyle.Success);
  const infoButton = new ButtonBuilder()
    .setCustomId(NoGuildButtonType.INFO)
    .setLabel('En savoir plus')
    .setStyle(ButtonStyle.Primary);
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton, infoButton);

  const getNoGuildEmbed = (): EmbedBuilder => {
    return new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('Guildes')
      .addFields([
        {
          name: "Tu n'es dans aucune guilde !",
          value:
            'Clique sur le bouton "Rejoindre une guilde" afin de commencer ton expérience dans une Guilde du Vaisseau. Si tu veux des explications sur les Guildes, clique sur "En savoir plus".',
        },
      ]);
  };

  const noGuildEmbed = getNoGuildEmbed();
  const response = await interaction.reply({ components: [actionRow], embeds: [noGuildEmbed] });
  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

  collector.on('collect', async ({ customId }) => {
    switch (customId) {
      case NoGuildButtonType.JOIN:
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder().setName('guild').setDescription('Vois les infos sur ta guilde ou rejoins-en une !'),
  async execute(interaction: CommandInteraction) {
    const currentUser = await new User(interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });
    if (!currentUser.guild) {
      handleNoGuild(interaction);
    } else {
      await interaction.reply({
        ephemeral: true,
        content: `Guild name: ${currentUser.guild.name}`,
      });
    }
  },
};
