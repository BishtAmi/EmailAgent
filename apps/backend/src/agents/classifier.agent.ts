import { openai } from '../config/openai';

export class ClassifierAgent {
  async run(email: string) {
    const response =
      await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `
You are an email classification agent.

Categories:
- ignore
- complete
- needs_response

Return JSON only.
`,
          },
          {
            role: 'user',
            content: email,
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
