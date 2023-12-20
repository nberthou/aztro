import { CommandProps } from '../handlers/message';

export const handleCooldownCommand = async ({ chatClient, message, channel, isUserMod, user }: CommandProps) => {
  // Countdown from 5 to 0 every second
  let count = 5;
  const interval = setInterval(() => {
    if (count > 0) {
      chatClient.say(channel, `${count}...`);
      count--;
    } else {
      chatClient.say(channel, `GO !`);
      clearInterval(interval);
    }
  }, 1000);
};
