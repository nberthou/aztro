import { Wallet } from './Wallet';
import { prismaClient } from '../utils';
import { User } from '@prisma/client';

export enum GuildName {
  FUSEE = 'Fusée',
  PLANETE = 'Planète',
  COMETE = 'Comète',
}

export enum GuildEmoji {
  FUSEE = '🚀',
  PLANETE = '🪐',
  COMETE = '☄️',
}

export class Guild {
  public name: string;
  public bank: Wallet;
  private userId?: string;
  public members: User[];
  public color: number;
  public guildId: string;

  constructor(userId?: string, name?: string) {
    this.name = name || '';
    this.bank = new Wallet('');
    this.userId = userId;
    this.members = [];
    this.color = 0;
    this.guildId = '';
  }

  public async init(): Promise<Guild | null> {
    const guild = await prismaClient.guild.findFirst({
      where: {
        OR: [
          {
            members: {
              some: {
                id: this.userId,
              },
            },
          },
          {
            name: this.name,
          },
        ],
      },
    });

    const guildMembers = await prismaClient.user.findMany({
      where: {
        guildId: guild?.id,
      },
    });

    if (guild) {
      this.name = guild.name;
      this.bank = await new Wallet(guild.id, 'GUILD').init();
      this.members = guildMembers;
      this.color = guild.color;
      this.guildId = guild.guildId;
      return this;
    }
    return null;
  }

  static async getGuilds() {
    const guilds = await prismaClient.guild.findMany();
    return guilds;
  }

  public async getLeader() {
    const leader = await prismaClient.user.findFirst({
      where: {
        guildId: this.guildId,
        isGuildLeader: true,
      },
    });
    return leader;
  }
}
