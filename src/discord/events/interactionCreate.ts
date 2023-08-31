import { Events, Client, Collection, Interaction, CacheType } from 'discord.js';

type DiscordClient = Client<boolean> & { commands?: Collection<string, any> };

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;
    const command = (interaction.client as DiscordClient).commands?.get(interaction.commandName);

    if (!command) {
      console.error(`La commande ${interaction.commandName} n'a pas été trouvée.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Il y a eu une erreur avec la commande !', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Il y a eu une erreur avec la commande !', ephemeral: true });
      }
    }
  },
};
