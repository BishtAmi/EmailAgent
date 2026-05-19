import { Request, Response } from 'express';

import { prisma } from '../config/db';

import { fetchUnreadEmails } from '../services/gmail.services';

import { OrchestratorAgent } from '../agents/orchestrator.agent';

const orchestrator = new OrchestratorAgent();

export async function syncEmails(
  req: Request,
  res: Response
) {
  const emails = await fetchUnreadEmails();

  for (const email of emails) {
    const exists =
      await prisma.email.findUnique({
        where: {
          gmailId: email.gmailId || '',
        },
      });

    if (exists) continue;

    await orchestrator.process(email);
  }

  res.json({
    success: true,
  });
}

export async function getEmails(
  req: Request,
  res: Response
) {
  const emails = await prisma.email.findMany({
    include: {
      draft: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(emails);
}
