import { prismaClient } from '../utils';
import { TwitchBot } from './TwitchBot';
import { DiscordBot } from './DiscordBot';

export class Aztrobot {
  private twitchBot: TwitchBot;
  private discordBot: DiscordBot;
  constructor() {
    this.twitchBot = new TwitchBot();
    this.discordBot = new DiscordBot();
    console.log("Aztrobot en cours d'initialisation.");
  }

  public async start() {
    await this.startDiscordBot();
    await this.startTwitchBot();
  }
  private async startTwitchBot() {
    await this.twitchBot.init();
  }

  private async startDiscordBot() {
    await this.discordBot.init();
  }

  public async connectToDb() {
    await prismaClient.$disconnect();
  }

  public async disconnectFromDb() {
    await prismaClient.$disconnect();
    process.exit(1);
  }
}
