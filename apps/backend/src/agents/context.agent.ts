import { prisma } from '../config/db';

export class ContextAgent {
  async run(sender: string) {
    const previousEmails =
      await prisma.email.findMany({
        where: {
          sender,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

    return {
      previousEmails,
      tone: 'professional',
    };
  }
}
