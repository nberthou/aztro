import { Wallet } from './Wallet';
import { prismaClient } from '../utils';

export class User {
  public twitchUsername?: string | null;
  public discordUsername?: string | null;
  public wallet: Wallet;
  public updatedAt: Date;

  constructor(twitchUsername?: string | null, discordUsername?: string | null) {
    this.twitchUsername = twitchUsername;
    this.discordUsername = discordUsername;
    this.wallet = new Wallet('');
    this.updatedAt = new Date();
  }

  async init({ initialStars }: { initialStars: number }): Promise<User> {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ twitchUsername: this.twitchUsername }, { discordUsername: this.discordUsername }],
      },
    });

    if (user) {
      this.wallet = await new Wallet(user!.id).init();
      this.updatedAt = user?.updatedAt;
      return this;
    } else {
      return await this.createUser({ initialStars });
    }
  }

  public async createUser({ initialStars }: { initialStars: number }): Promise<User> {
    const user = await prismaClient.user.create({
      data: {
        twitchUsername: this.twitchUsername,
        discordUsername: this.discordUsername,
        stars: initialStars,
      },
    });
    this.twitchUsername = user.twitchUsername;
    this.discordUsername = user.discordUsername;
    this.wallet = await new Wallet(user.id).init();
    this.updatedAt = new Date();
    return this;
  }
}
