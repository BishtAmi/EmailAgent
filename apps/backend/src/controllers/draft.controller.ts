import { Request, Response } from 'express';

import { prisma } from '../config/db';

import { sendEmail } from '../services/gmail.services';

export async function approveDraft(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const draft =
    await prisma.draft.findUnique({
      where: {
        id: id as string,
      },
      include: {
        email: true,
      },
    });

  if (!draft) {
    return res.status(404).json({
      error: 'Draft not found',
    });
  }

  const sender = draft.email.sender;

  const emailMatch =
    sender.match(/<(.+)>/);

  const to =
    emailMatch?.[1] || sender;

  await sendEmail(
    to,
    `Re: ${draft.email.subject}`,
    draft.content
  );

  await prisma.draft.update({
    where: {
      id: id as string,
    },
    data: {
      approved: true,
      sent: true,
    },
  });

  res.json({
    success: true,
  });
}
