import { EmbedBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  Collection,
  Colors,
  CommandInteraction,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputComponent,
  TextInputStyle,
} from 'discord.js';

const NUMBER_TO_EMOJI: any = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
};

module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('Crée un sondage !'),
  async execute(interaction: CommandInteraction) {
    const pollModal = new ModalBuilder().setCustomId('pollModal').setTitle("Création d'un nouveau sondage");
    const pollQuestionInput = new TextInputBuilder()
      .setCustomId('pollQuestionInput')
      .setLabel('Question')
      .setPlaceholder('Quelle est ta question ?')
      .setStyle(TextInputStyle.Paragraph);
    const questionActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(pollQuestionInput);
    pollModal.addComponents(questionActionRow);
    const options = [
      { id: 'option1', label: 'Option 1' },
      { id: 'option2', label: 'Option 2' },
      { id: 'option3', label: 'Option 3' },
      { id: 'option4', label: 'Option 4' },
    ];
    options.forEach((option, index) => {
      const optionInput = new TextInputBuilder()
        .setCustomId(option.id)
        .setLabel(option.label)
        .setPlaceholder(option.label)
        .setStyle(TextInputStyle.Short)
        .setRequired(index < 2);
      const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(optionInput);
      pollModal.addComponents(actionRow);
    });
    await interaction.showModal(pollModal);

    const modalInteraction = await interaction.awaitModalSubmit({ time: 60000 });
    await modalInteraction.deferReply();

    if (modalInteraction) {
      const question = modalInteraction.fields.getField('pollQuestionInput');
      const options: Collection<string, TextInputComponent> = modalInteraction.fields.fields.filter(
        (field) => field.customId !== 'pollQuestionInput' && field.value.length > 0
      );
      const pollEmbed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(question.value)
        .addFields(
          options.map((option, index) => ({
            name: `${NUMBER_TO_EMOJI[index[index.length - 1]]} ${option.value}`,
            value: '0 vote',
          }))
        );
      const response = await modalInteraction.editReply({ embeds: [pollEmbed] });
      options.forEach(async (option, index) => {
        const emoji = NUMBER_TO_EMOJI[index[index.length - 1]];
        response.react(emoji);
      });
      const collector = response.createReactionCollector({ filter: (reaction, user) => user.id !== response.author.id });
      collector.on('collect', (reaction, user) => {
        if (Object.values(NUMBER_TO_EMOJI).includes(reaction.emoji.name)) {
          const emoji = reaction.emoji.name;
          // Get all reactions

          const reactions = response.reactions.cache.map((reaction) => ({
            name: reaction.emoji.name,
            count: reaction.count,
          }));
          const newPollEmbed = new EmbedBuilder()
            .setColor(Colors.Gold)
            .setTitle(question.value)
            .addFields(
              options.map((option, index) => {
                const emoji = NUMBER_TO_EMOJI[index[index.length - 1]];
                const reaction = reactions.find((reaction) => reaction.name === emoji);
                const count = reaction?.count ? reaction?.count - 1 : 0;
                return {
                  name: `${emoji} ${option.value}`,
                  value: `${count ?? 0} vote${count - 1 <= 1 ? '' : 's'}`,
                };
              })
            );
          response.edit({ embeds: [newPollEmbed] });
        }
      });
    }
  },
};
