import { gmail } from '../config/gmail';
import { extractEmailBody } from '../utils/parser';

export async function fetchUnreadEmails() {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 10,
  });

  const messages = response.data.messages || [];

  const emails = [];

  for (const message of messages) {
    const details = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
    });

    const payload = details.data.payload;

    const headers = payload?.headers || [];

    const subject =
      headers.find((h) => h.name === 'Subject')?.value || '';

    const sender =
      headers.find((h) => h.name === 'From')?.value || '';

    const body = extractEmailBody(payload);

    emails.push({
      gmailId: message.id,
      sender,
      subject,
      body,
    });
  }

  return emails;
}

export async function sendEmail(
  to: string,
  subject: string,
  content: string
) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    content,
  ].join('\\n');

const encodedMessage = Buffer.from(message)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}
