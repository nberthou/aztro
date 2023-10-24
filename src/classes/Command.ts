import { Command as CommandType } from '@prisma/client';
import { prismaClient } from '../utils';

export class CommandList {
  constructor() {}

  public async getCommands(): Promise<CommandType[]> {
    return await prismaClient.command.findMany();
  }

  public async addCommand(name: string, content: string) {
    await prismaClient.command.create({
      data: {
        name: name,
        content: content,
      },
    });
  }

  public async removeCommand(name: string) {
    await prismaClient.command.delete({
      where: {
        name: name,
      },
    });
  }

  public async getCommand(name: string): Promise<CommandType | null> {
    return await prismaClient.command.findUnique({
      where: {
        name: name,
      },
    });
  }

  public async editCommand(name: string, content: string) {
    await prismaClient.command.update({
      where: {
        name: name,
      },
      data: {
        content: content,
      },
    });
  }
}
