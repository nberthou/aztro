// import { Wallet } from './Wallet';
// import { prismaClient } from '../utils';

// export enum GuildName {
//   FUSEES = 'Fusées',
//   PLANETES = 'Planètes',
//   COMETES = 'Comètes',
// }

// export class Guild {
//   public name: string;
//   public bank: Wallet;
//   private userId?: string;

//   constructor(userId?: string) {
//     this.name = '';
//     this.bank = new Wallet('');
//     this.userId = userId;
//   }

//   public async init(): Promise<Guild | void> {
//     const guild = await prismaClient.guild.findFirst({
//       where: {
//         members: {
//           some: {
//             id: this.userId,
//           },
//         },
//       },
//     });
//     if (guild) {
//       this.name = guild.name;
//       this.bank = await new Wallet(guild.id, 'GUILD').init();
//       return this;
//     }
//   }

//   public async getGuilds() {
//     const guilds = await prismaClient.guild.findMany();
//     return guilds;
//   }
// }
