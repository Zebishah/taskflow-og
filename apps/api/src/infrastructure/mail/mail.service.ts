import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type {
  SendMailInput,
  WorkspaceInvitationMailInput,
  TaskDueReminderMailInput,
} from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly resend: Resend;

  private readonly fromAddress: string;

  public constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');

    this.fromAddress = this.configService.getOrThrow<string>('MAIL_FROM');

    this.resend = new Resend(apiKey);
  }

  public async sendMail(input: SendMailInput): Promise<string> {
    const { data, error } = await this.resend.emails.send(
      {
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    if (error) {
      this.logger.error(
        `Failed to send email to ${input.to}`,
        JSON.stringify(error),
      );

      throw new InternalServerErrorException('The email could not be sent');
    }

    if (!data?.id) {
      this.logger.error(`Resend returned no email ID for ${input.to}`);

      throw new InternalServerErrorException(
        'The email provider returned an invalid response',
      );
    }

    this.logger.log(`Email accepted by Resend: ${data.id}`);

    return data.id;
  }
  public async sendTaskDueReminder(
    input: TaskDueReminderMailInput,
  ): Promise<string> {
    const dueText = input.dueAt.toUTCString();

    const recipientName = this.escapeHtml(input.recipientFirstName);

    const workspaceName = this.escapeHtml(input.workspaceName);

    const projectName = this.escapeHtml(input.projectName);

    const taskIdentifier = this.escapeHtml(input.taskIdentifier);

    const taskTitle = this.escapeHtml(input.taskTitle);

    const taskUrl = this.escapeHtml(input.taskUrl);

    return this.sendMail({
      to: input.recipientEmail,

      subject: `${input.taskIdentifier} is due soon — ` + input.taskTitle,

      text: [
        `Hi ${input.recipientFirstName},`,
        '',
        `Your assigned task ${input.taskIdentifier} is due soon.`,
        `Task: ${input.taskTitle}`,
        `Project: ${input.projectName}`,
        `Workspace: ${input.workspaceName}`,
        `Due: ${dueText}`,
        '',
        `Open task: ${input.taskUrl}`,
      ].join('\n'),

      html: `
      <!doctype html>
      <html lang="en">
        <body
          style="
            margin:0;
            padding:32px 16px;
            background:#f8fafc;
            font-family:Arial,sans-serif;
            color:#0f172a;
          "
        >
          <div
            style="
              max-width:600px;
              margin:0 auto;
              border:1px solid #e2e8f0;
              border-radius:24px;
              background:#ffffff;
              overflow:hidden;
            "
          >
            <div
              style="
                padding:24px 30px;
                background:#0a0c20;
                color:#ffffff;
                font-size:20px;
                font-weight:700;
              "
            >
              Task<span style="color:#6ee7b7">Flow</span>
            </div>

            <div style="padding:32px 30px">
              <p style="color:#64748b">
                Hi ${recipientName},
              </p>

              <h1 style="font-size:26px">
                Your task is due soon
              </h1>

              <div
                style="
                  margin:24px 0;
                  padding:20px;
                  border-radius:16px;
                  background:#f5f3ff;
                "
              >
                <strong style="color:#7c3aed">
                  ${taskIdentifier}
                </strong>

                <h2 style="margin:10px 0">
                  ${taskTitle}
                </h2>

                <p style="margin:6px 0;color:#64748b">
                  ${projectName} · ${workspaceName}
                </p>

                <p style="margin:6px 0;color:#be123c">
                  Due ${dueText}
                </p>
              </div>

              <a
                href="${taskUrl}"
                style="
                  display:inline-block;
                  padding:13px 20px;
                  border-radius:12px;
                  background:#7c3aed;
                  color:#ffffff;
                  text-decoration:none;
                  font-weight:700;
                "
              >
                Open task board
              </a>
            </div>
          </div>
        </body>
      </html>
    `,

      idempotencyKey: input.idempotencyKey,
    });
  }
  public async sendWorkspaceInvitation(
    input: WorkspaceInvitationMailInput,
  ): Promise<string> {
    const expirationText = input.expiresAt.toUTCString();

    const escapedWorkspaceName = this.escapeHtml(input.workspaceName);

    const escapedInviterName = this.escapeHtml(input.inviterName);

    const escapedRole = this.escapeHtml(input.role);

    const escapedInvitationUrl = this.escapeHtml(input.invitationUrl);

    return this.sendMail({
      to: input.recipientEmail,

      subject: `${input.inviterName} invited you to ` + input.workspaceName,

      text: [
        `${input.inviterName} invited you to join`,
        `${input.workspaceName} as ${input.role}.`,
        '',
        `View invitation: ${input.invitationUrl}`,
        '',
        `This invitation expires on ${expirationText}.`,
        '',
        'If you were not expecting this invitation, you can ignore this email.',
      ].join('\n'),

      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>TaskFlow workspace invitation</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background: #f5f7fb;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
            "
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tr>
                <td
                  align="center"
                  style="padding: 40px 16px"
                >
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      max-width: 600px;
                      background: #ffffff;
                      border-radius: 24px;
                      overflow: hidden;
                      border: 1px solid #e2e8f0;
                    "
                  >
                    <tr>
                      <td
                        style="
                          padding: 28px 32px;
                          background: #090b1d;
                          color: #ffffff;
                        "
                      >
                        <div
                          style="
                            font-size: 20px;
                            font-weight: 700;
                          "
                        >
                          Task<span style="color:#6ee7b7">
                            Flow
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 40px 32px">
                        <div
                          style="
                            display: inline-block;
                            padding: 7px 12px;
                            border-radius: 999px;
                            background: #f3e8ff;
                            color: #7c3aed;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                          "
                        >
                          Workspace invitation
                        </div>

                        <h1
                          style="
                            margin: 24px 0 12px;
                            font-size: 30px;
                            line-height: 1.2;
                          "
                        >
                          Join ${escapedWorkspaceName}
                        </h1>

                        <p
                          style="
                            margin: 0;
                            color: #64748b;
                            font-size: 16px;
                            line-height: 1.7;
                          "
                        >
                          <strong style="color:#0f172a">
                            ${escapedInviterName}
                          </strong>

                          invited you to collaborate as

                          <strong style="color:#0f172a">
                            ${escapedRole}
                          </strong>.
                        </p>

                        <a
                          href="${escapedInvitationUrl}"
                          style="
                            display: inline-block;
                            margin-top: 28px;
                            padding: 14px 22px;
                            border-radius: 12px;
                            background: #6d28d9;
                            color: #ffffff;
                            text-decoration: none;
                            font-weight: 700;
                          "
                        >
                          View invitation
                        </a>

                        <p
                          style="
                            margin: 28px 0 0;
                            color: #94a3b8;
                            font-size: 13px;
                            line-height: 1.6;
                          "
                        >
                          This invitation expires on
                          ${expirationText}.

                          If you were not expecting it, you
                          may safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      idempotencyKey: input.idempotencyKey,
    });
  }

  private escapeHtml(value: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return value.replace(
      /[&<>"']/g,
      (character) => htmlEntities[character] ?? character,
    );
  }
}
