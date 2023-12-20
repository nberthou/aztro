import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { PubSubClient, PubSubRedemptionMessage } from '@twurple/pubsub';
import { promises as fs } from 'fs';
import { handleMessages } from './handlers/message';
import { handleRaid } from './handlers/raid';
import { handleCommunitySubs, handleResubs, handleSubGifts, handleSubs } from './handlers/subs';
import { handleRedemptions } from './handlers/redemption';

async function main() {
  const clientId = process.env.TWITCH_CLIENT_ID ?? '';
  const clientSecret = process.env.TWITCH_CLIENT_SECRET ?? '';
  const channelId = process.env.TWITCH_CHANNEL_ID ?? '';
  const tokenData = JSON.parse(await fs.readFile(__dirname + '/tokens.json', 'utf-8'));
  const pubSubTokenData = JSON.parse(await fs.readFile(__dirname + '/pubSubTokens.json', 'utf-8'));
  const authProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
  });

  const pubSubAuthProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
  });

  authProvider.onRefresh(
    async (userId, newTokenData) => await fs.writeFile(__dirname + '/tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8')
  );

  pubSubAuthProvider.onRefresh(
    async (userId, newTokenData) =>
      await fs.writeFile(__dirname + '/pubSubTokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8')
  );

  await authProvider.addUser(channelId, tokenData, ['chat', 'channel:read:redemptions']);
  await pubSubAuthProvider.addUser(channelId, pubSubTokenData, ['channel:read:redemptions']);
  const chatClient = new ChatClient({ authProvider, channels: [process.env.TWITCH_CHANNEL_NAME ?? ''] });
  const pubSubClient = new PubSubClient({ authProvider: pubSubAuthProvider });

  chatClient.onAuthenticationSuccess(() => console.log(`Je suis maintenant connecté sur Twitch !`));
  chatClient.onAuthenticationFailure((error) => console.error(`Impossible de se connecter sur Twitch : ${error}`));

  pubSubClient.onListenError((handler, error, userInitiated) => {
    console.debug('--------------------------------------------');
    console.debug('main.ts handler l.34', handler.topic);
    console.debug('error', error);
    console.debug('userInitiated', userInitiated);
    console.debug('--------------------------------------------');
  });

  await handleMessages(chatClient);
  await handleRaid(chatClient);
  await handleCommunitySubs(chatClient);
  await handleSubs(chatClient);
  await handleResubs(chatClient);
  await handleSubGifts(chatClient);
  await handleRedemptions(pubSubClient, chatClient);

  chatClient.connect();
}

export default main;
