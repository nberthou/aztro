import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { PubSubClient } from '@twurple/pubsub';
import { promises as fs } from 'fs';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { handleMessages } from '../twitch/handlers/message';
import { handleRaid } from '../twitch/handlers/raid';
import { handleCommunitySubs, handleResubs, handleSubGifts, handleSubs } from '../twitch/handlers/subs';
import { handleRedemptions } from '../twitch/handlers/redemption';
import { DiscordBot } from './DiscordBot';

export class TwitchBot {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly channelId: string;
  private authProvider: RefreshingAuthProvider;
  private pubSubProvider: RefreshingAuthProvider;
  static apiClient: ApiClient;
  static listener: EventSubWsListener;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID ?? '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET ?? '';
    this.channelId = process.env.TWITCH_CHANNEL_ID ?? '';
    this.authProvider = new RefreshingAuthProvider({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    this.pubSubProvider = new RefreshingAuthProvider({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    TwitchBot.apiClient = new ApiClient({ authProvider: this.authProvider });
    TwitchBot.listener = new EventSubWsListener({
      apiClient: TwitchBot.apiClient,
    });
    TwitchBot.listener.start();

    return this;
  }

  public async init() {
    const tokenData = JSON.parse(await fs.readFile(__dirname + '/../twitch/tokens.json', 'utf-8'));
    const pubSubTokenData = JSON.parse(await fs.readFile(__dirname + '/../twitch/pubSubTokens.json', 'utf-8'));

    this.authProvider.onRefresh(
      async (userId: string, newTokenData: any) =>
        await fs.writeFile(__dirname + '/../twitch/tokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8')
    );

    this.pubSubProvider.onRefresh(
      async (userId: string, newTokenData: any) =>
        await fs.writeFile(__dirname + '/../twitch/pubSubTokens.json', JSON.stringify(newTokenData, null, 4), 'utf-8')
    );

    await this.authProvider.addUser(this.channelId, tokenData, ['chat', 'channel:read:redemptions']);
    await this.pubSubProvider.addUser(this.channelId, pubSubTokenData, ['channel:read:redemptions']);
    const chatClient = new ChatClient({
      authProvider: this.authProvider,
      channels: [process.env.TWITCH_CHANNEL_NAME ?? ''],
    });
    const pubSubClient = new PubSubClient({ authProvider: this.pubSubProvider });

    TwitchBot.listener.onStreamOnline(this.channelId, (handler) => {
      DiscordBot.sendMessageToAnnounceChannel(
        `@everyone Le live de ${handler.broadcasterDisplayName} commence ! Rejoins-nous sur https://twitch.tv/${handler.broadcasterName} !`
      );
    });

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
}
