import dotenv from 'dotenv';
import { Aztrobot } from './classes/Aztrobot';

dotenv.config();
const aztrobot = new Aztrobot();

async function main() {
  await aztrobot.start();
}

main()
  .then(async () => {
    await aztrobot.connectToDb();
  })
  .catch(async (e) => {
    console.error(e);
    await aztrobot.disconnectFromDb();
  });
