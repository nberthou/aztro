import { prismaClient } from '../utils';

export class DeathCounter {
  public name: string;
  public deathCount: number;
  public active: boolean;

  constructor() {
    this.name = '';
    this.deathCount = 0;
    this.active = true;
  }

  public async init(): Promise<DeathCounter> {
    const activeGame = await prismaClient.deathCounter.findFirst({
      where: {
        active: true,
      },
    });
    this.name = activeGame?.name || '';
    this.deathCount = activeGame?.count || 0;
    this.active = true;
    return this;
  }

  public async setActiveGame(newGameName: string): Promise<void> {
    const doesGameExist = await prismaClient.deathCounter.findFirst({
      where: {
        name: newGameName,
      },
    });
    if (this.name) {
      await prismaClient.deathCounter.update({
        where: {
          name: this.name,
        },
        data: {
          active: false,
        },
      });
    }
    await prismaClient.deathCounter.upsert({
      where: {
        name: newGameName,
      },
      create: {
        name: newGameName,
        count: 0,
        active: true,
      },
      update: {
        active: true,
      },
    });
  }

  public async addDeaths(amount: number = 1) {
    await prismaClient.deathCounter.update({
      where: {
        name: this.name,
      },
      data: {
        count: { increment: amount },
      },
    });
    this.deathCount += amount;
  }
}
