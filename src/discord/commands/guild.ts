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
import { GuildName, Guild, GuildEmoji } from '../../classes/Guild';
import { DiscordBot } from '../../classes/DiscordBot';

enum NoGuildButtonType {
  JOIN = 'JOIN',
  INFO = 'INFO',
}

const handleJoinGuildDisplay = async (interaction: CommandInteraction) => {
  const joinGuildEmbed = new EmbedBuilder()
    .setColor(Colors.Gold)
    .setTitle('Rejoindre une guilde')
    .setDescription('Il existe 3 guildes dans le Vaisseau : la Fusée, la Planète et la Comète. Choisis celle que tu préfères !')
    .addFields([
      {
        name: `La ${GuildName.FUSEE} 🚀`,
        value: 'Les membres de la Fusée sont ambitieux, innovants, et aiment collaborer avec les autres.',
      },
      {
        name: `La ${GuildName.PLANETE} 🪐`,
        value:
          "Les membres de la Planète sont résilients, responsables, et s'engagent dans les causes qui leur tiennent à coeur.",
      },
      {
        name: `La ${GuildName.COMETE} ☄️`,
        value: "Les membres de la Comète sont créatifs, curieux et n'ont pas peur de s'aventurer dans l'inconnu.",
      },
    ]);

  const rocketButton = new ButtonBuilder()
    .setCustomId(GuildName.FUSEE)
    .setLabel(GuildName.FUSEE)
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🚀');
  const planetButton = new ButtonBuilder()
    .setCustomId(GuildName.PLANETE)
    .setLabel(GuildName.PLANETE)
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🪐');
  const cometButton = new ButtonBuilder()
    .setCustomId(GuildName.COMETE)
    .setLabel(GuildName.COMETE)
    .setStyle(ButtonStyle.Success)
    .setEmoji('☄️');
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rocketButton, planetButton, cometButton);

  const response = await interaction.editReply({ embeds: [joinGuildEmbed], components: [actionRow] });
  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on('collect', async ({ customId }) => {
    joinGuild(interaction, customId as GuildName);
  });
};

const joinGuild = async (interaction: CommandInteraction, customId: GuildName) => {
  const user = await new User(null, interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });
  await user.joinGuild(customId);
  const guild = await new Guild(user.id).init();

  if (guild && guild.members.find((member) => member.id === user.id)) {
    const discordGuild = DiscordBot.getGuild();
    const guildRole = discordGuild?.roles.cache.find((role) => role.name === guild.name);
    const guildMember = discordGuild?.members.cache.find((member) => member.user.username === user.discordUsername);

    await guildMember?.roles.add(guildRole!).then(async () => {
      await handleGuildJoined(interaction, guild);
    });
  }
};

const handleGuildJoined = async (interaction: CommandInteraction, guild: Guild) => {
  const guildJoinedEmbed = new EmbedBuilder()
    .setColor(guild.color)
    .setTitle(`Bienvenue dans la ${guild.name}`)
    .setDescription(
      `Bienvenue à toi dans la ${guild.name} ! Tu peux refaire /guild afin de voir les infos sur ta guilde ainsi que les différentes options.`
    );

  await interaction.editReply({ embeds: [guildJoinedEmbed], components: [] });
};

const handleNoGuild = async (interaction: CommandInteraction) => {
  const joinButton = new ButtonBuilder()
    .setCustomId(NoGuildButtonType.JOIN)
    .setLabel('Rejoindre une guilde')
    .setStyle(ButtonStyle.Success);
  //   const infoButton = new ButtonBuilder()
  //     .setCustomId(NoGuildButtonType.INFO)
  //     .setLabel('En savoir plus')
  //     .setStyle(ButtonStyle.Primary);
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

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
  const response = await interaction.reply({ components: [actionRow], embeds: [noGuildEmbed], ephemeral: true });
  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on('collect', async ({ customId }) => {
    switch (customId) {
      case NoGuildButtonType.JOIN:
        handleJoinGuildDisplay(interaction);
    }
  });
};

const handleGuildInfo = async (interaction: CommandInteraction) => {
  const currentUser = await new User(null, interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });
  const guild = await new Guild(currentUser.id).init();

  if (!guild) {
    await handleNoGuild(interaction);
    return;
  }

  const guildLeader = await guild.getLeader();

  const guildInfoEmbed = new EmbedBuilder()
    .setColor(guild.color)
    .setTitle(
      `La ${guild.name} ${
        GuildEmoji[
          guild.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase() as any as keyof typeof GuildEmoji
        ]
      }`
    )
    .addFields([
      { name: 'Membres', value: guild.members.length.toString(), inline: true },
      { name: 'Banque', value: `${guild.bank.stars} ${DiscordBot.getEmoji('azgoldStar')}`, inline: true },
      {
        name: 'Chef de guilde',
        value: guildLeader
          ? (guildLeader.discordUsername || guildLeader.twitchUsername)!
          : "Il n'y a pas de chef de guilde pour le moment.",
      },
    ]);

  await interaction.reply({ embeds: [guildInfoEmbed], ephemeral: true });
};

module.exports = {
  data: new SlashCommandBuilder().setName('guild').setDescription('Vois les infos sur ta guilde ou rejoins-en une !'),
  async execute(interaction: CommandInteraction) {
    const currentUser = await new User(null, interaction.user.username?.toLocaleLowerCase()).init({ initialStars: 0 });
    if (!currentUser.guild) {
      await handleNoGuild(interaction);
    } else {
      await handleGuildInfo(interaction);
    }
  },
};
