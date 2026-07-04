import type OpenAI from 'openai';
import { openai } from '../config/openai';

/**
 * Exposed to the orchestrator agent as a tool. The orchestrator decides
 * *whether* and *when* to call this -- it is no longer a hardcoded first
 * step that runs on every email regardless of whether it's needed.
 */
export const CLASSIFIER_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'classify_email',
    description:
      'Get a structured category + confidence for an email: "ignore", "complete", or "needs_response". Useful when you want a second opinion or a confidence score to log, but you can also just decide the category yourself from reading the email.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
      required: ['email'],
    },
  },
};

export class ClassifierAgent {
  async run(email: string) {
    const response = await openai.chat.completions.create({
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

Return JSON only, with keys "category" and "confidence".
`,
        },
        { role: 'user', content: email },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content!);
  }
}
