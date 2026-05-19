import { prisma } from '../config/db';

import { ClassifierAgent } from './classifier.agent';
import { ContextAgent } from './context.agent';
import { DraftAgent } from './draft.agent';
import { SafetyAgent } from './safety.agent';

export class OrchestratorAgent {
  classifier = new ClassifierAgent();

  context = new ContextAgent();

  draft = new DraftAgent();

  safety = new SafetyAgent();

  async process(email: any) {
    const classification =
      await this.classifier.run(
        `${email.subject}\n${email.body}`
      );

    const savedEmail =
      await prisma.email.create({
        data: {
          gmailId: email.gmailId,
          sender: email.sender,
          subject: email.subject,
          body: email.body,
          category: classification.category,
          confidence:
            classification.confidence || 0.9,
        },
      });

    if (
      classification.category !==
      'needs_response'
    ) {
      return;
    }

    const context =
      await this.context.run(email.sender);

    const draft =
      await this.draft.run({
        email: email.body,
        context,
      });

    const safety =
      await this.safety.run({
        email: email.body,
        draft,
      });

    if (!safety.safe) return;

    await prisma.draft.create({
      data: {
        emailId: savedEmail.id || '',
        content: draft || '',
      },
    });
  }
}
