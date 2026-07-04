import type OpenAI from 'openai';
import { prisma } from '../config/db';

/**
 * Exposed as a tool. The orchestrator only calls this when it decides it
 * actually needs sender history -- e.g. the email references a prior
 * conversation, or tone/continuity matters. Simple or self-contained
 * emails can skip it entirely, which the old fixed pipeline could not do.
 */
export const CONTEXT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_sender_context',
    description:
      'Fetch the last few emails exchanged with this sender, plus tone guidance. Call this only if the email needs history to answer well -- not reflexively on every email.',
    parameters: {
      type: 'object',
      properties: {
        sender: { type: 'string' },
      },
      required: ['sender'],
    },
  },
};

export class ContextAgent {
  async run(sender: string) {
    const previousEmails = await prisma.email.findMany({
      where: { sender },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      previousEmails,
      tone: 'professional',
    };
  }
}
