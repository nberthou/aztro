import { Wallet } from './Wallet';
import { prismaClient } from '../utils';
import type { User as UserType } from '@prisma/client';

// Define a class for a User, who can have a twitch username, a discord username, and a wallet
export class User {
  // Define the properties of a User
  public twitchUsername?: string | null;
  public discordUsername?: string | null;
  // Define the constructor of a User
  constructor(twitchUsername?: string | null, discordUsername?: string | null) {
    this.twitchUsername = twitchUsername;
    this.discordUsername = discordUsername;
  }

  // Define the methods of a User

  public async getUser(): Promise<UserType | null> {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ twitchUsername: this.twitchUsername }, { discordUsername: this.discordUsername }],
      },
    });

    return user;
  }

  public async createUser({ initialStars }: { initialStars: number }): Promise<void> {
    await prismaClient.user.create({
      data: {
        twitchUsername: this.twitchUsername,
        discordUsername: this.discordUsername,
        stars: initialStars,
      },
    });
  }

  public async getWallet(): Promise<Wallet> {
    const user = await this.getUser();
    if (user) {
      return new Wallet(user!.id);
    }
    throw new Error('User not found');
  }
}
