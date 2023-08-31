import twitchServer from './twitch/main';
import discordServer from './discord/main';
import dotenv from 'dotenv';
import { prismaClient } from './utils';

dotenv.config();

async function main() {
  await twitchServer();
  await discordServer();
}

main()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaClient.$disconnect();
    process.exit(1);
  });
