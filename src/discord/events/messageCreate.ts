import { Events, Message } from 'discord.js';
import { User } from '../../classes/User';

module.exports = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    const currentUser = await new User(message.author.username).init({ initialStars: 1 });
    if (currentUser.updatedAt < new Date(Date.now() - 5000)) {
      await currentUser.wallet.earnStars(1);
    }
  },
};
