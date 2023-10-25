import type { User } from '@prisma/client';
import { prismaClient } from '../utils';

export class Wallet {
  private userId: any;
  public stars: number;

  constructor(userId: string) {
    this.userId = userId;
    this.stars = 0;
  }

  public async init(): Promise<Wallet> {
    const user = await this.getUser();
    this.stars = user.stars;
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
