import type OpenAI from 'openai';
import { openai } from '../config/openai';
import { prisma } from '../config/db';

import { ClassifierAgent, CLASSIFIER_TOOL } from './classifier.agent';
import { ContextAgent, CONTEXT_TOOL } from './context.agent';
import { DraftAgent, DRAFT_TOOL } from './draft.agent';
import { SafetyAgent, SAFETY_TOOL } from './safety.agent';

/**
 * The old orchestrator hardcoded the sequence:
 *   classify -> context -> draft -> safety -> save
 * with `if` statements deciding branches. This one hardcodes nothing --
 * it gives an LLM the four agents above as tools, plus save/flag/finish,
 * and lets it decide the path per email: which tools to call, in what
 * order, how many times (e.g. redraft after a failed safety check), and
 * when it's actually done.
 */

const CONTROL_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'save_draft',
      description:
        'Persist a drafted reply for a human to review/send. Only call this after validate_draft has returned safe: true.',
      parameters: {
        type: 'object',
        properties: { content: { type: 'string' } },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_for_human_review',
      description:
        'Escalate to a human instead of saving a draft. Use when the email is ambiguous, sensitive, or a draft keeps failing validation.',
      parameters: {
        type: 'object',
        properties: { reason: { type: 'string' } },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish',
      description:
        'Call exactly once, as your last action, once the email has been fully handled.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['ignore', 'complete', 'needs_response'],
          },
          confidence: { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['category', 'summary'],
      },
    },
  },
];

const SYSTEM_PROMPT = `
You are an email processing agent with access to specialist tools:
classify_email, get_sender_context, draft_reply, validate_draft, save_draft,
flag_for_human_review, and finish.

You decide the path -- there is no fixed order. For example:
- An obvious newsletter doesn't need classify_email, context, or a draft; just finish it as "ignore".
- A reply that needs history should call get_sender_context before draft_reply; one that doesn't shouldn't bother.
- If validate_draft comes back unsafe, you can call draft_reply again with instructions to fix the specific issue, then validate again -- you're not stuck once something fails.
- Only save_draft after a draft has passed validate_draft. If it fails twice, flag_for_human_review instead of guessing.
- Always call finish last, exactly once.
`;

type ToolCall = { id: string; function: { name: string; arguments: string } };

export class OrchestratorAgent {
  classifier = new ClassifierAgent();
  context = new ContextAgent();
  draft = new DraftAgent();
  safety = new SafetyAgent();

  private emailId: string | null = null;

  async process(email: {
    gmailId: string;
    sender: string;
    subject: string;
    body: string;
  }) {
    const savedEmail = await prisma.email.create({
      data: {
        gmailId: email.gmailId,
        sender: email.sender,
        subject: email.subject,
        body: email.body,
        category: 'pending',
        confidence: 0,
      },
    });
    this.emailId = savedEmail.id;

    const tools = [
      CLASSIFIER_TOOL,
      CONTEXT_TOOL,
      DRAFT_TOOL,
      SAFETY_TOOL,
      ...CONTROL_TOOLS,
    ];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `FROM: ${email.sender}\nSUBJECT: ${email.subject}\n\n${email.body}`,
      },
    ];

    const MAX_STEPS = 8; // guardrail against a stuck loop, not a fixed path

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages,
        tools,
        tool_choice: 'auto',
      });

      const choice = response.choices[0].message;
      messages.push(choice);

      const toolCalls = (choice.tool_calls || []) as ToolCall[];

      if (toolCalls.length === 0) {
        messages.push({
          role: 'user',
          content: 'Call a tool to act, or finish if you are done.',
        });
        continue;
      }

      let didFinish = false;

      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments || '{}');
        const result = await this.executeTool(call.function.name, args, email);
        if (call.function.name === 'finish') didFinish = true;

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      if (didFinish) return;
    }

    // Didn't converge -- escalate rather than leave it half-handled.
    await this.executeTool(
      'flag_for_human_review',
      { reason: 'Agent did not converge within step limit.' },
      email
    );
  }

  private async executeTool(
    name: string,
    args: any,
    email: { sender: string; body: string }
  ) {
    switch (name) {
      case 'classify_email':
        return this.classifier.run(args.email || email.body);

      case 'get_sender_context':
        return this.context.run(args.sender || email.sender);

      case 'draft_reply':
        return {
          draft: await this.draft.run({
            email: args.email || email.body,
            context: args.context,
            instructions: args.instructions,
          }),
        };

      case 'validate_draft':
        return this.safety.run({ email: args.email, draft: args.draft });

      case 'save_draft':
        await prisma.draft.create({
          data: { emailId: this.emailId || '', content: args.content || '' },
        });
        return { saved: true };

      case 'flag_for_human_review':
        await prisma.email.update({
          where: { id: this.emailId! },
          data: { category: 'needs_human_review' },
        });
        return { flagged: true, reason: args.reason };

      case 'finish':
        await prisma.email.update({
          where: { id: this.emailId! },
          data: {
            category: args.category,
            confidence: args.confidence ?? 0.9,
          },
        });
        return { done: true };

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }
}
