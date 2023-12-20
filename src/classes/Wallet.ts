import type { User, Guild } from '@prisma/client';
import { prismaClient } from '../utils';

export class Wallet {
  private userId: string;
  public stars: number;
  private walletType: 'USER' | 'GUILD';

  constructor(userId: string, walletType: 'USER' | 'GUILD' = 'USER') {
    this.userId = userId;
    this.stars = 0;
    this.walletType = walletType;
  }

  public async init(): Promise<Wallet> {
    if (this.walletType === 'USER') {
      const user = await this.getUser();
      this.stars = user.stars;
    } else {
      const guild = await this.getGuild();
      this.stars = guild.bank;
    }
    return this;
  }

  private async getUser(): Promise<User> {
    const user = await prismaClient.user.findUnique({
      where: {
        id: this.userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async getGuild(): Promise<Guild> {
    const guild = await prismaClient.guild.findUnique({
      where: {
        id: this.userId,
      },
    });

    if (!guild) {
      throw new Error('Guild not found');
    }

    return guild;
  }

  public async earnStars(amount: number): Promise<void> {
    await prismaClient.user.update({
      where: {
        id: this.userId,
      },
      data: {
        stars: {
          increment: amount,
        },
        updatedAt: new Date(),
      },
    });
    this.stars += amount;
  }

  public async spendStars(amount: number): Promise<boolean> {
    const user = await this.getUser();
    if (user.stars >= amount) {
      await prismaClient.user.update({
        where: {
          id: this.userId,
        },
        data: {
          stars: {
            decrement: amount,
          },
          updatedAt: new Date(),
        },
      });
      this.stars -= amount;
      return true;
    } else {
      throw new Error('Not enough stars');
    }
  }
}
