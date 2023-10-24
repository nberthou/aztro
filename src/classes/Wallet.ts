import type { User } from '@prisma/client';
import { prismaClient } from '../utils';

export class Wallet {
  private userId: any;

  constructor(userId: string) {
    this.userId = userId;
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

  public async getStars(): Promise<number> {
    const user = await this.getUser();
    return user.stars;
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
      return true;
    } else {
      throw new Error('Not enough stars');
    }
  }
}
