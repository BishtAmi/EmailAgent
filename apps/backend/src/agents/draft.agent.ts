import { openai } from '../config/openai';

export class DraftAgent {
  async run(input: {
    email: string;
    context: any;
  }) {
    const response =
      await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `
Generate a concise professional email reply.
`,
          },
          {
            role: 'user',
            content: `
EMAIL:
${input.email}

CONTEXT:
${JSON.stringify(input.context)}
`,
          },
        ],
      });

    return response.choices[0].message.content || "";
  }
}
