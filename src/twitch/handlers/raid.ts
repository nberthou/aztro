import { ChatClient } from '@twurple/chat';

export const handleRaid = (chatClient: ChatClient) => {
  chatClient.onRaid((channel, user, raidInfo) => {
    chatClient.say(
      channel,
      `Merci pour le raid ${user} ! Bienvenue à toutes et à tous les raiders ! azgoldFusee azgoldFusee azgoldFusee`
    );
  });
};
