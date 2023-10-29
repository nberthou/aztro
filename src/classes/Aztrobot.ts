import twitchServer from '../twitch/main';
import discordServer from '../discord/main';
import { prismaClient } from '../utils';

export class Aztrobot {
  constructor() {
    console.log("Aztrobot en cours d'initialisation.");
  }

  public async start() {
    await this.startDiscordBot();
    await this.startTwitchBot();
  }
  private async startTwitchBot() {
    await twitchServer();
  }

  private async startDiscordBot() {
    await discordServer();
  }

  public async connectToDb() {
    await prismaClient.$disconnect();
  }

  public async disconnectFromDb() {
    await prismaClient.$disconnect();
    process.exit(1);
  }
}
