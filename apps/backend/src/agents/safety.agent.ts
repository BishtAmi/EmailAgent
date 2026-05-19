import { openai } from '../config/openai';

export class SafetyAgent {
  async run(input: {
    email: string;
    draft: string;
  }) {
    const response =
      await openai.chat.completions.create({
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

Return JSON only.
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
        response_format: {
          type: 'json_object',
        },
      });

    return JSON.parse(
      response.choices[0].message.content!
    );
  }
}
