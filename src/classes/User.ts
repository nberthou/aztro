import { Wallet } from './Wallet';
import { prismaClient } from '../utils';
import { Guild, GuildName } from './Guild';

export class User {
  public twitchUsername?: string | null;
  public discordUsername?: string | null;
  public wallet: Wallet;
  public updatedAt: Date;
  public guild?: Guild | null;
  public id: string;
  public isGuildLeader: boolean;

  constructor(twitchUsername?: string | null, discordUsername?: string | null) {
    this.twitchUsername = twitchUsername;
    this.discordUsername = discordUsername;
    this.wallet = new Wallet('');
    this.updatedAt = new Date();
    this.id = '';
    this.isGuildLeader = false;
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
      this.guild = await new Guild(user!.id).init();
      this.id = user.id;
      this.isGuildLeader = user.isGuildLeader;
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
    this.id = user.id;
    this.isGuildLeader = user.isGuildLeader;
    return this;
  }

  public async isUsernameAlreadyLinked(): Promise<boolean> {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [
          { AND: [{ twitchUsername: this.twitchUsername }, { discordUsername: { isSet: true } }] },
          { AND: [{ discordUsername: this.discordUsername }, { twitchUsername: { isSet: true } }] },
        ],
      },
    });

    return !!user;
  }

  public async linkUsers(): Promise<void> {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ twitchUsername: this.twitchUsername }, { discordUsername: this.discordUsername }],
      },
    });

    if (!user) {
      await prismaClient.user.create({
        data: {
          twitchUsername: this.twitchUsername,
          discordUsername: this.discordUsername,
          stars: 0,
        },
      });
      return;
    }

    const otherUser = await prismaClient.user.findFirst({
      where: {
        AND: [
          {
            id: { not: user.id },
          },
          {
            OR: [
              { AND: [{ twitchUsername: this.twitchUsername }, { discordUsername: { isSet: false } }] },
              { AND: [{ discordUsername: this.discordUsername }, { twitchUsername: { isSet: false } }] },
            ],
          },
        ],
      },
    });

    if (!otherUser) {
      await prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          twitchUsername: user.twitchUsername || this.twitchUsername,
          discordUsername: user.discordUsername || this.discordUsername,
        },
      });
      return;
    }

    await prismaClient.user.upsert({
      where: {
        id: user.id,
      },
      create: {
        twitchUsername: user.twitchUsername || this.twitchUsername,
        discordUsername: user.discordUsername || this.discordUsername,
        stars: user.stars + otherUser.stars,
      },
      update: {
        twitchUsername: user.twitchUsername || otherUser.twitchUsername,
        discordUsername: user.discordUsername || otherUser.discordUsername,
        stars: user.stars + otherUser.stars,
      },
    });

    await prismaClient.user.delete({
      where: {
        id: otherUser.id,
      },
    });
  }

  public async getRank(count: number): Promise<User[]> {
    const dbUsers = await prismaClient.user.findMany({
      orderBy: { stars: 'desc' },
      take: 10,
      skip: count * 10,
    });
    const users = dbUsers.map((user) => {
      const newUser = new User(user.twitchUsername, user.discordUsername);
      newUser.wallet = new Wallet(user.id);
      newUser.wallet.stars = user.stars;
      newUser.updatedAt = user.updatedAt;
      return newUser;
    });
    return users;
  }

  public async joinGuild(guildName: GuildName): Promise<void> {
    const guilds = await prismaClient.guild.findMany();

    let guild = await prismaClient.guild.findFirst({
      where: {
        name: guildName,
      },
    });

    if (!guild) {
      guild = await prismaClient.guild.create({
        data: {
          name: guildName,
          members: {
            connect: {
              id: this.id,
            },
          },
          bank: 0,
          guildId: guildName.toLocaleLowerCase(),
          color: guildName === GuildName.FUSEE ? 15548997 : guildName === GuildName.PLANETE ? 5793266 : 5763719,
        },
      });
    }

    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ twitchUsername: this.twitchUsername }, { discordUsername: this.discordUsername }],
      },
    });
    if (!user) {
      return;
    }
    await prismaClient.guild.update({
      where: {
        id: guild.id,
      },
      data: {
        members: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }
}
