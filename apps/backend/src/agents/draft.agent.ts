import type OpenAI from 'openai';
import { openai } from '../config/openai';

/**
 * Exposed as a tool. The orchestrator calls this when (and only when) it
 * has decided a reply is warranted, passing along whatever context it
 * gathered -- which may be nothing, if it judged the email self-contained.
 */
export const DRAFT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'draft_reply',
    description:
      'Generate a draft reply to an email. Pass any relevant context (sender history, tone) you gathered; pass an empty object if none is needed.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        context: {
          type: 'object',
          description: 'Any context gathered, e.g. from get_sender_context. Can be empty.',
        },
        instructions: {
          type: 'string',
          description:
            'Optional guidance for this specific draft, e.g. "keep it under 3 sentences" or "this is a revision, avoid promising a specific date this time".',
        },
      },
      required: ['email'],
    },
  },
};

export class DraftAgent {
  async run(input: { email: string; context?: any; instructions?: string }) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `
Generate a concise professional email reply.
${input.instructions ? `Additional instructions: ${input.instructions}` : ''}
`,
        },
        {
          role: 'user',
          content: `
EMAIL:
${input.email}

CONTEXT:
${JSON.stringify(input.context || {})}
`,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }
}
