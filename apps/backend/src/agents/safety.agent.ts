import type OpenAI from 'openai';
import { openai } from '../config/openai';

/**
 * Exposed as a tool. Unlike the old pipeline -- where `if (!safety.safe)
 * return` silently dropped the email -- the orchestrator gets the actual
 * issues back and can decide: revise the draft itself and re-check, or
 * flag for human review. The failure path is a decision, not a dead end.
 */
export const SAFETY_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'validate_draft',
    description:
      'Check a drafted reply for hallucinations, fake/unverifiable commitments, or unsafe content. Call this before saving any draft. Returns { safe: boolean, issues: string[] }.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        draft: { type: 'string' },
      },
      required: ['email', 'draft'],
    },
  },
};

export class SafetyAgent {
  async run(input: { email: string; draft: string }) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `
Validate this email reply.

Check:
- hallucinations
- fake commitments
- unsafe content

Return JSON only, with keys "safe" (boolean) and "issues" (string array, empty if none).
`,
        },
        {
          role: 'user',
          content: `
EMAIL:
${input.email}

DRAFT:
${input.draft}
`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content!);
  }
}
