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
import { Bot } from '@twurple/easy-bot';

export class TwitchBot {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly channelId: string;
  private chatClient: ChatClient;
  private authProvider: RefreshingAuthProvider;
  private pubSubProvider: RefreshingAuthProvider;
  static apiClient: ApiClient;
  static listener: EventSubWsListener;
  static bot: Bot;
  private intervalRandomMessage: NodeJS.Timeout | null;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID ?? '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET ?? '';
    this.channelId = process.env.TWITCH_CHANNEL_ID ?? '';
    this.intervalRandomMessage = null;
    this.authProvider = new RefreshingAuthProvider({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    this.pubSubProvider = new RefreshingAuthProvider({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    this.chatClient = new ChatClient({
      authProvider: this.authProvider,
      channels: [process.env.TWITCH_CHANNEL_NAME ?? ''],
    });
    TwitchBot.apiClient = new ApiClient({ authProvider: this.authProvider });
    TwitchBot.listener = new EventSubWsListener({
      apiClient: TwitchBot.apiClient,
    });
    TwitchBot.listener.start();
    TwitchBot.bot = new Bot({
      channels: [process.env.TWITCH_CHANNEL_NAME ?? ''],
      authProvider: this.authProvider,
    });

    return this;
  }

  private async getRandomMessage(channel: string) {
    const messages = JSON.parse(await fs.readFile(__dirname + '/../twitch/randomMessages.json', 'utf-8'));
    const interval = 1000 * 60 * 15;
    let lastSentMessageIndex: number | null = null;
    this.intervalRandomMessage = setInterval(() => {
      let randomIndex = Math.floor(Math.random() * messages.length);
      while (lastSentMessageIndex === randomIndex) {
        randomIndex = Math.floor(Math.random() * messages.length);
      }
      lastSentMessageIndex = randomIndex;
      const randomMessage = messages[randomIndex];
      this.chatClient.say(channel, randomMessage);
    }, interval);
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

    await this.authProvider.addUser(this.channelId, tokenData, [
      'chat',
      'channel:read:redemptions',
      'moderator:manage:banned_users',
    ]);
    await this.authProvider.addUser(process.env.TWITCH_BOT_ID!, tokenData, [
      'chat',
      'channel:read:redemptions',
      'moderator:manage:banned_users',
    ]);
    await this.pubSubProvider.addUser(this.channelId, pubSubTokenData, ['channel:read:redemptions']);

    const pubSubClient = new PubSubClient({ authProvider: this.pubSubProvider });

    TwitchBot.listener.onStreamOnline(this.channelId, (handler) => {
      console.log('Le stream démarre !');
      DiscordBot.sendMessageToAnnounceChannel(
        `@everyone Le live de ${handler.broadcasterDisplayName} commence ! Rejoins-nous sur https://twitch.tv/${handler.broadcasterName} !`
      );
      this.getRandomMessage(process.env.TWITCH_CHANNEL_NAME ?? '');
    });

    TwitchBot.listener.onStreamOffline(this.channelId, (handler) => {
      console.log('Le stream est arrêté !');
      if (this.intervalRandomMessage) {
        clearInterval(this.intervalRandomMessage);
      }
    });

    this.chatClient.onAuthenticationSuccess(() => {
      console.debug('--------------------------------------------');
      console.debug('TwitchBot.ts this. l.114', this.intervalRandomMessage);
      console.debug('--------------------------------------------');

      console.log(`Je suis maintenant connecté sur Twitch !`);
    });
    this.chatClient.onAuthenticationFailure((error) => console.error(`Impossible de se connecter sur Twitch : ${error}`));

    pubSubClient.onListenError((handler, error, userInitiated) => {
      console.debug('--------------------------------------------');
      console.debug('main.ts handler l.34', handler.topic);
      console.debug('error', error);
      console.debug('userInitiated', userInitiated);
      console.debug('--------------------------------------------');
    });

    await handleMessages(this.chatClient);
    await handleRaid(this.chatClient);
    await handleCommunitySubs(this.chatClient);
    await handleSubs(this.chatClient);
    await handleResubs(this.chatClient);
    await handleSubGifts(this.chatClient);
    await handleRedemptions(pubSubClient, this.chatClient);

    this.chatClient.connect();
  }
}
