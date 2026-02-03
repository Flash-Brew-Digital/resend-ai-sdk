import { tool } from "ai";
import { Resend } from "resend";
import { z } from "zod";

const getClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
};

const getEmailDomain = () => process.env.RESEND_EMAIL_DOMAIN ?? "";

const getStringField = (
  obj: Record<string, unknown>,
  snakeCase: string,
  camelCase: string
): string | undefined => {
  if (obj[snakeCase]) {
    return String(obj[snakeCase]);
  }
  if (obj[camelCase]) {
    return String(obj[camelCase]);
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

const SendResultSchema = z.object({
  success: z.boolean().describe("Whether the email was sent successfully"),
  id: z.string().describe("ID of the sent email"),
  error: z.string().optional().describe("Error message if failed"),
});

const BatchSendResultSchema = z.object({
  success: z.boolean().describe("Whether all emails were sent successfully"),
  ids: z.array(z.string()).describe("IDs of the sent emails"),
  count: z.number().describe("Number of emails sent"),
  error: z.string().optional().describe("Error message if failed"),
});

const EmailInfoSchema = z.object({
  id: z.string().describe("Email ID"),
  from: z.string().describe("Sender email address"),
  to: z.array(z.string()).describe("Recipient email addresses"),
  subject: z.string().describe("Email subject"),
  lastEvent: z
    .string()
    .optional()
    .describe(
      "Last delivery event (e.g., 'sent', 'delivered', 'bounced', 'complained')"
    ),
  createdAt: z
    .string()
    .optional()
    .describe("ISO timestamp when the email was created"),
});

const GetEmailResultSchema = z.object({
  success: z.boolean().describe("Whether the retrieval succeeded"),
  id: z.string().describe("Email ID"),
  from: z.string().optional().describe("Sender email address"),
  to: z.array(z.string()).optional().describe("Recipient email addresses"),
  subject: z.string().optional().describe("Email subject"),
  lastEvent: z.string().optional().describe("Last delivery event if available"),
  createdAt: z
    .string()
    .optional()
    .describe("ISO timestamp when the email was created"),
  error: z.string().optional().describe("Error message if failed"),
});

const ListEmailsResultSchema = z.object({
  emails: z.array(EmailInfoSchema).describe("Array of sent email metadata"),
  count: z.number().describe("Number of emails returned"),
  error: z.string().optional().describe("Error message if failed"),
});

const CreateContactResultSchema = z.object({
  success: z.boolean().describe("Whether the contact was created"),
  id: z.string().describe("ID of the created contact"),
  error: z.string().optional().describe("Error message if failed"),
});

const ContactInfoSchema = z.object({
  id: z.string().describe("Contact ID"),
  email: z.string().describe("Contact email address"),
  firstName: z.string().optional().describe("Contact first name"),
  lastName: z.string().optional().describe("Contact last name"),
  unsubscribed: z.boolean().describe("Whether the contact is unsubscribed"),
});

const ListContactsResultSchema = z.object({
  contacts: z.array(ContactInfoSchema).describe("Array of contacts"),
  count: z.number().describe("Number of contacts returned"),
  error: z.string().optional().describe("Error message if failed"),
});

const RemoveContactResultSchema = z.object({
  success: z.boolean().describe("Whether the contact was removed"),
  deleted: z.boolean().describe("Confirms the contact was deleted"),
  id: z.string().describe("ID of the removed contact"),
  error: z.string().optional().describe("Error message if failed"),
});

const TemplateVariableSchema = z.object({
  id: z.string().describe("Variable ID"),
  key: z.string().describe("Variable key used in the template"),
  type: z.string().describe("Variable type (e.g., string)"),
  fallbackValue: z
    .string()
    .optional()
    .describe("Default value if the variable is not provided"),
});

const TemplateInfoSchema = z.object({
  id: z.string().describe("Template ID"),
  name: z.string().describe("Template name"),
  alias: z.string().optional().describe("Template alias for easy reference"),
  status: z.string().describe("Template status (e.g., draft, published)"),
  createdAt: z
    .string()
    .optional()
    .describe("ISO timestamp when the template was created"),
  updatedAt: z
    .string()
    .optional()
    .describe("ISO timestamp when the template was last updated"),
  publishedAt: z
    .string()
    .optional()
    .describe("ISO timestamp when the template was published"),
});

const GetTemplateResultSchema = z.object({
  success: z.boolean().describe("Whether the retrieval succeeded"),
  id: z.string().describe("Template ID"),
  name: z.string().optional().describe("Template name"),
  alias: z.string().optional().describe("Template alias"),
  status: z.string().optional().describe("Template status"),
  from: z
    .string()
    .optional()
    .describe("Default sender email address set in the template"),
  subject: z
    .string()
    .optional()
    .describe("Default subject line set in the template"),
  replyTo: z
    .string()
    .optional()
    .describe("Default reply-to address set in the template"),
  variables: z
    .array(TemplateVariableSchema)
    .optional()
    .describe("Template variables that can be filled when sending"),
  createdAt: z.string().optional().describe("ISO timestamp when created"),
  updatedAt: z.string().optional().describe("ISO timestamp when last updated"),
  publishedAt: z.string().optional().describe("ISO timestamp when published"),
  error: z.string().optional().describe("Error message if failed"),
});

const ListTemplatesResultSchema = z.object({
  templates: z.array(TemplateInfoSchema).describe("Array of template metadata"),
  count: z.number().describe("Number of templates returned"),
  hasMore: z
    .boolean()
    .optional()
    .describe("Whether more templates are available for pagination"),
  error: z.string().optional().describe("Error message if failed"),
});

export const sendEmail = tool({
  description:
    "Send an email to one or more recipients using Resend. " +
    "Use this tool when the user wants to send a transactional email, notification, welcome message, or any email. " +
    "Supports HTML content, plain text, templates, attachments, tags, CC, BCC, reply-to, topic-based sending, and scheduled delivery. " +
    "Returns the email ID which can be used to track delivery status." +
    (getEmailDomain()
      ? ` The verified sending domain is ${getEmailDomain()}.`
      : ""),
  inputSchema: z.object({
    from: z
      .string()
      .describe(
        `Sender email address.${getEmailDomain() ? ` Must use the domain: ${getEmailDomain()}.` : ""} To include a friendly name, use the format "Your Name <sender@domain.com>"`
      ),
    to: z
      .array(z.string())
      .min(1)
      .max(50)
      .describe(
        "Recipient email address(es). Provide as an array of strings. Max 50."
      ),
    subject: z.string().describe("Email subject line"),
    html: z
      .string()
      .optional()
      .describe(
        "HTML version of the message. Cannot be used together with template."
      ),
    text: z
      .string()
      .optional()
      .describe(
        "Plain text version of the message. If not provided, a plain text version is generated from the HTML."
      ),
    replyTo: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe(
        "Reply-to email address. For multiple addresses, send as an array of strings."
      ),
    cc: z
      .array(z.string())
      .optional()
      .describe("CC recipient email address(es)"),
    bcc: z
      .array(z.string())
      .optional()
      .describe("BCC recipient email address(es)"),
    scheduledAt: z
      .string()
      .optional()
      .describe(
        'Schedule email for later delivery. Use natural language (e.g., "in 1 min") or ISO 8601 format (e.g., "2024-08-05T11:52:01.858Z").'
      ),
    tags: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              "Tag name. Only ASCII letters, numbers, underscores, or dashes. Max 256 characters."
            ),
          value: z
            .string()
            .describe(
              "Tag value. Only ASCII letters, numbers, underscores, or dashes. Max 256 characters."
            ),
        })
      )
      .optional()
      .describe("Custom data passed in key/value pairs for tracking"),
    attachments: z
      .array(
        z.object({
          filename: z.string().optional().describe("Name of the attached file"),
          content: z
            .string()
            .optional()
            .describe("Content of the attached file as a Base64 string"),
          path: z
            .string()
            .optional()
            .describe("URL path where the attachment file is hosted"),
          contentType: z
            .string()
            .optional()
            .describe(
              "Content type for the attachment. If not set, derived from filename."
            ),
        })
      )
      .optional()
      .describe(
        "File attachments. Provide either content (Base64) or path (URL) for each. Max 40MB per email after encoding."
      ),
    template: z
      .object({
        id: z
          .string()
          .describe("The ID or alias of the published email template"),
        variables: z
          .record(z.string(), z.union([z.string(), z.number()]))
          .optional()
          .describe("Template variables as key/value pairs"),
      })
      .optional()
      .describe(
        "Send using a published template instead of html/text. Cannot be used together with html, text, or react."
      ),
    topicId: z
      .string()
      .optional()
      .describe(
        "Topic ID for topic-based sending. Contacts who opted out of this topic will not receive the email."
      ),
  }),
  inputExamples: [
    {
      input: {
        from: "Acme <hello@acme.com>",
        to: ["user@example.com"],
        subject: "Welcome!",
        html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
      },
    },
    {
      input: {
        from: "noreply@acme.com",
        to: ["user@example.com"],
        subject: "Your receipt",
        text: "Thank you for your purchase.",
        replyTo: "support@acme.com",
        tags: [{ name: "category", value: "receipt" }],
      },
    },
  ],
  outputSchema: SendResultSchema,
  strict: true,
  execute: async ({
    from,
    to,
    subject,
    html,
    text,
    replyTo,
    cc,
    bcc,
    scheduledAt,
    tags,
    attachments,
    template,
    topicId,
  }) => {
    try {
      const resend = getClient();

      const params: Record<string, unknown> = { from, to, subject };
      if (html !== undefined) {
        params.html = html;
      }
      if (text !== undefined) {
        params.text = text;
      }
      if (replyTo !== undefined) {
        params.replyTo = replyTo;
      }
      if (cc !== undefined) {
        params.cc = cc;
      }
      if (bcc !== undefined) {
        params.bcc = bcc;
      }
      if (scheduledAt !== undefined) {
        params.scheduledAt = scheduledAt;
      }
      if (tags !== undefined) {
        params.tags = tags;
      }
      if (attachments !== undefined) {
        params.attachments = attachments;
      }
      if (template !== undefined) {
        params.template = template;
      }
      if (topicId !== undefined) {
        params.topicId = topicId;
      }

      const { data, error } = await resend.emails.send(
        params as unknown as Parameters<typeof resend.emails.send>[0]
      );

      if (error) {
        return {
          success: false,
          id: "",
          error: error.message,
        };
      }

      return {
        success: true,
        id: data?.id ?? "",
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        id: "",
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  },
});

export const sendBatchEmails = tool({
  description:
    "Send multiple emails at once using a single API call. " +
    "Use this tool for bulk sending such as notifications to multiple users, batch alerts, or sending different emails to different recipients simultaneously. " +
    "Each email supports the same options as sendEmail. Maximum 100 emails per batch." +
    (getEmailDomain()
      ? ` The verified sending domain is ${getEmailDomain()}.`
      : ""),
  inputSchema: z.object({
    emails: z
      .array(
        z.object({
          from: z
            .string()
            .describe(
              `Sender email address.${getEmailDomain() ? ` Must use the domain: ${getEmailDomain()}.` : ""} Format: "Your Name <sender@domain.com>"`
            ),
          to: z
            .array(z.string())
            .min(1)
            .max(50)
            .describe("Recipient email address(es)"),
          subject: z.string().describe("Email subject line"),
          html: z.string().optional().describe("HTML version of the message"),
          text: z
            .string()
            .optional()
            .describe("Plain text version of the message"),
          replyTo: z
            .array(z.string())
            .optional()
            .describe("Reply-to email address(es)"),
          cc: z
            .array(z.string())
            .optional()
            .describe("CC recipient email address(es)"),
          bcc: z
            .array(z.string())
            .optional()
            .describe("BCC recipient email address(es)"),
          scheduledAt: z
            .string()
            .optional()
            .describe("Schedule delivery using natural language or ISO 8601"),
          tags: z
            .array(
              z.object({
                name: z.string().describe("Tag name"),
                value: z.string().describe("Tag value"),
              })
            )
            .optional()
            .describe("Custom data for tracking"),
          attachments: z
            .array(
              z.object({
                filename: z.string().optional().describe("File name"),
                content: z.string().optional().describe("Base64 file content"),
                path: z.string().optional().describe("URL to the hosted file"),
              })
            )
            .optional()
            .describe("File attachments"),
        })
      )
      .min(1)
      .max(100)
      .describe("Array of email objects to send. Maximum 100 per call."),
  }),
  inputExamples: [
    {
      input: {
        emails: [
          {
            from: "Acme <hello@acme.com>",
            to: ["alice@example.com"],
            subject: "Welcome Alice!",
            html: "<p>Welcome to Acme!</p>",
          },
          {
            from: "Acme <hello@acme.com>",
            to: ["bob@example.com"],
            subject: "Welcome Bob!",
            html: "<p>Welcome to Acme!</p>",
          },
        ],
      },
    },
  ],
  outputSchema: BatchSendResultSchema,
  strict: true,
  execute: async ({ emails }) => {
    try {
      const resend = getClient();
      const { data, error } = await resend.batch.send(
        emails as Parameters<typeof resend.batch.send>[0]
      );

      if (error) {
        return {
          success: false,
          ids: [],
          count: 0,
          error: error.message,
        };
      }

      const results = (data as { data: { id: string }[] })?.data ?? [];
      const ids = results.map((r) => r.id);

      return {
        success: true,
        ids,
        count: ids.length,
      };
    } catch (error) {
      console.error("Error sending batch emails:", error);
      return {
        success: false,
        ids: [],
        count: 0,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send batch emails",
      };
    }
  },
});

export const getEmail = tool({
  description:
    "Retrieve the status and metadata of a previously sent email by its ID. " +
    "Use this tool to check if an email was delivered, bounced, or is still pending. " +
    "Returns delivery status, recipient info, and timestamps.",
  inputSchema: z.object({
    emailId: z
      .string()
      .describe("The ID of the email to retrieve (returned by sendEmail)"),
  }),
  inputExamples: [
    { input: { emailId: "4ef9a417-02e9-4d39-ad75-9611e0bf7a83" } },
  ],
  outputSchema: GetEmailResultSchema,
  strict: true,
  execute: async ({ emailId }) => {
    try {
      const resend = getClient();
      const { data, error } = await resend.emails.get(emailId);

      if (error) {
        return {
          success: false,
          id: emailId,
          error: error.message,
        };
      }

      const email = data as unknown as Record<string, unknown>;

      return {
        success: true,
        id: String(email.id ?? emailId),
        from: String(email.from ?? ""),
        to: toStringArray(email.to),
        subject: String(email.subject ?? ""),
        lastEvent: getStringField(email, "last_event", "lastEvent") ?? "",
        createdAt: getStringField(email, "created_at", "createdAt") ?? "",
      };
    } catch (error) {
      console.error("Error retrieving email:", error);
      return {
        success: false,
        id: emailId,
        error:
          error instanceof Error ? error.message : "Failed to retrieve email",
      };
    }
  },
});

export const listEmails = tool({
  description:
    "List recently sent emails from your Resend account. " +
    "Use this tool to browse sent email history, review delivery statuses, or find a specific email. " +
    "Returns email IDs, subjects, recipients, and delivery events.",
  inputSchema: z.object({}),
  inputExamples: [{ input: {} }],
  outputSchema: ListEmailsResultSchema,
  strict: true,
  execute: async () => {
    try {
      const resend = getClient();
      const { data, error } = await resend.emails.list();

      if (error) {
        return {
          emails: [],
          count: 0,
          error: error.message,
        };
      }

      const rawEmails =
        (data as unknown as { data: Record<string, unknown>[] })?.data ?? [];

      const emails = rawEmails.map((email) => ({
        id: String(email.id ?? ""),
        from: String(email.from ?? ""),
        to: toStringArray(email.to),
        subject: String(email.subject ?? ""),
        lastEvent: getStringField(email, "last_event", "lastEvent") ?? "",
        createdAt: getStringField(email, "created_at", "createdAt") ?? "",
      }));

      return {
        emails,
        count: emails.length,
      };
    } catch (error) {
      console.error("Error listing emails:", error);
      return {
        emails: [],
        count: 0,
        error: error instanceof Error ? error.message : "Failed to list emails",
      };
    }
  },
});

export const createContact = tool({
  description:
    "Create a new contact in your Resend account. " +
    "Use this tool when the user wants to add a subscriber, save a contact, or build a mailing list. " +
    "Contacts are global entities identified by email and can be organized into segments for broadcast emails.",
  inputSchema: z.object({
    email: z.string().describe("Email address of the contact"),
    firstName: z.string().optional().describe("First name of the contact"),
    lastName: z.string().optional().describe("Last name of the contact"),
    unsubscribed: z
      .boolean()
      .optional()
      .describe(
        "The contact's global subscription status. If true, the contact will be unsubscribed from all Broadcasts. Defaults to false."
      ),
    properties: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        'A map of custom property keys and values to set on the contact (e.g., { "plan": "pro", "company": "Acme" })'
      ),
    segments: z
      .array(z.string())
      .optional()
      .describe("Array of segment IDs to add the contact to"),
    topics: z
      .array(
        z.object({
          id: z.string().describe("The topic ID"),
          subscription: z
            .enum(["opt_in", "opt_out"])
            .describe("The subscription status for this topic"),
        })
      )
      .optional()
      .describe("Array of topic subscriptions for the contact"),
  }),
  inputExamples: [
    {
      input: {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      },
    },
    {
      input: {
        email: "jane@example.com",
        firstName: "Jane",
        segments: ["seg_123"],
        topics: [{ id: "top_456", subscription: "opt_in" }],
      },
    },
  ],
  outputSchema: CreateContactResultSchema,
  strict: true,
  execute: async ({
    email,
    firstName,
    lastName,
    unsubscribed,
    properties,
    segments,
    topics,
  }) => {
    try {
      const resend = getClient();

      const params: Record<string, unknown> = { email };
      if (firstName !== undefined) {
        params.firstName = firstName;
      }
      if (lastName !== undefined) {
        params.lastName = lastName;
      }
      if (unsubscribed !== undefined) {
        params.unsubscribed = unsubscribed;
      }
      if (properties !== undefined) {
        params.properties = properties;
      }
      if (segments !== undefined) {
        params.segments = segments.map((id) => ({ id }));
      }
      if (topics !== undefined) {
        params.topics = topics;
      }

      const { data, error } = await resend.contacts.create(
        params as unknown as Parameters<typeof resend.contacts.create>[0]
      );

      if (error) {
        return {
          success: false,
          id: "",
          error: error.message,
        };
      }

      const result = data as unknown as Record<string, unknown>;
      return {
        success: true,
        id: String(result.id ?? ""),
      };
    } catch (error) {
      console.error("Error creating contact:", error);
      return {
        success: false,
        id: "",
        error:
          error instanceof Error ? error.message : "Failed to create contact",
      };
    }
  },
});

export const listContacts = tool({
  description:
    "List contacts in your Resend account. " +
    "Use this tool to browse your contact list, check subscriber counts, or find specific contacts.",
  inputSchema: z.object({}),
  inputExamples: [{ input: {} }],
  outputSchema: ListContactsResultSchema,
  strict: true,
  execute: async () => {
    try {
      const resend = getClient();
      const { data, error } = await (
        resend.contacts.list as () => ReturnType<typeof resend.contacts.list>
      )();

      if (error) {
        return {
          contacts: [],
          count: 0,
          error: error.message,
        };
      }

      const rawContacts =
        (data as unknown as { data: Record<string, unknown>[] })?.data ?? [];

      const contacts = rawContacts.map((contact) => ({
        id: String(contact.id ?? ""),
        email: String(contact.email ?? ""),
        firstName: getStringField(contact, "first_name", "firstName"),
        lastName: getStringField(contact, "last_name", "lastName"),
        unsubscribed: Boolean(contact.unsubscribed ?? false),
      }));

      return {
        contacts,
        count: contacts.length,
      };
    } catch (error) {
      console.error("Error listing contacts:", error);
      return {
        contacts: [],
        count: 0,
        error:
          error instanceof Error ? error.message : "Failed to list contacts",
      };
    }
  },
});

export const removeContact = tool({
  description:
    "Permanently remove a contact from your Resend account by their ID or email address. " +
    "Use when the user explicitly wants to delete a subscriber or remove someone from the contact list. " +
    "WARNING: This action is irreversible.",
  inputSchema: z.object({
    id: z.string().describe("The ID or email address of the contact to remove"),
  }),
  inputExamples: [
    { input: { id: "4ef9a417-02e9-4d39-ad75-9611e0bf7a83" } },
    { input: { id: "user@example.com" } },
  ],
  outputSchema: RemoveContactResultSchema,
  strict: true,
  needsApproval: true,
  execute: async ({ id }) => {
    try {
      const resend = getClient();

      const { data, error } = await resend.contacts.remove({
        id,
      } as Parameters<typeof resend.contacts.remove>[0]);

      if (error) {
        return {
          success: false,
          deleted: false,
          id,
          error: error.message,
        };
      }

      const result = data as unknown as Record<string, unknown>;
      return {
        success: true,
        deleted: Boolean(result.deleted ?? true),
        id: String(result.id ?? id),
      };
    } catch (error) {
      console.error("Error removing contact:", error);
      return {
        success: false,
        deleted: false,
        id,
        error:
          error instanceof Error ? error.message : "Failed to remove contact",
      };
    }
  },
});

export const listTemplates = tool({
  description:
    "List email templates in your Resend account. " +
    "Use this tool to browse available templates, find a template by name, or check template statuses. " +
    "Returns template metadata including ID, name, alias, and status. " +
    "Supports pagination via limit, after, and before parameters.",
  inputSchema: z.object({
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of templates to retrieve. Default 20, max 100."),
    after: z
      .string()
      .optional()
      .describe(
        "Template ID after which to retrieve more templates (for forward pagination). Cannot be used with before."
      ),
    before: z
      .string()
      .optional()
      .describe(
        "Template ID before which to retrieve more templates (for backward pagination). Cannot be used with after."
      ),
  }),
  inputExamples: [
    { input: {} },
    { input: { limit: 10 } },
    {
      input: {
        limit: 5,
        after: "34a080c9-b17d-4187-ad80-5af20266e535",
      },
    },
  ],
  outputSchema: ListTemplatesResultSchema,
  strict: true,
  execute: async ({ limit, after, before }) => {
    try {
      const resend = getClient();

      const params: Record<string, unknown> = {};
      if (limit !== undefined) {
        params.limit = limit;
      }
      if (after !== undefined) {
        params.after = after;
      }
      if (before !== undefined) {
        params.before = before;
      }

      const { data, error } = await resend.templates.list(
        params as Parameters<typeof resend.templates.list>[0]
      );

      if (error) {
        return {
          templates: [],
          count: 0,
          error: error.message,
        };
      }

      const result = data as unknown as Record<string, unknown>;
      const rawTemplates =
        (result.data as Record<string, unknown>[] | undefined) ?? [];

      const templates = rawTemplates.map((tmpl) => ({
        id: String(tmpl.id ?? ""),
        name: String(tmpl.name ?? ""),
        alias: tmpl.alias ? String(tmpl.alias) : undefined,
        status: String(tmpl.status ?? ""),
        createdAt: getStringField(tmpl, "created_at", "createdAt"),
        updatedAt: getStringField(tmpl, "updated_at", "updatedAt"),
        publishedAt: getStringField(tmpl, "published_at", "publishedAt"),
      }));

      return {
        templates,
        count: templates.length,
        hasMore: Boolean(result.has_more ?? false),
      };
    } catch (error) {
      console.error("Error listing templates:", error);
      return {
        templates: [],
        count: 0,
        error:
          error instanceof Error ? error.message : "Failed to list templates",
      };
    }
  },
});

export const getTemplate = tool({
  description:
    "Retrieve a specific email template by its ID or alias. " +
    "Use this tool to inspect a template's variables, check its default from/subject/replyTo, or verify its status before sending. " +
    "Returns the template metadata, defaults, and variables.",
  inputSchema: z.object({
    id: z.string().describe("The ID or alias of the template to retrieve"),
  }),
  inputExamples: [
    { input: { id: "34a080c9-b17d-4187-ad80-5af20266e535" } },
    { input: { id: "reset-password" } },
  ],
  outputSchema: GetTemplateResultSchema,
  strict: true,
  execute: async ({ id }) => {
    try {
      const resend = getClient();
      const { data, error } = await resend.templates.get(id);

      if (error) {
        return {
          success: false,
          id,
          error: error.message,
        };
      }

      const result = data as unknown as Record<string, unknown>;

      const rawVariables = result.variables as
        | Record<string, unknown>[]
        | undefined;
      const variables = rawVariables?.map((v) => ({
        id: String(v.id ?? ""),
        key: String(v.key ?? ""),
        type: String(v.type ?? "string"),
        fallbackValue: getStringField(v, "fallback_value", "fallbackValue"),
      }));

      return {
        success: true,
        id: String(result.id ?? id),
        name: result.name ? String(result.name) : undefined,
        alias: result.alias ? String(result.alias) : undefined,
        status: result.status ? String(result.status) : undefined,
        from: result.from ? String(result.from) : undefined,
        subject: result.subject ? String(result.subject) : undefined,
        replyTo: getStringField(result, "reply_to", "replyTo"),
        variables,
        createdAt: getStringField(result, "created_at", "createdAt"),
        updatedAt: getStringField(result, "updated_at", "updatedAt"),
        publishedAt: getStringField(result, "published_at", "publishedAt"),
      };
    } catch (error) {
      console.error("Error getting template:", error);
      return {
        success: false,
        id,
        error:
          error instanceof Error ? error.message : "Failed to get template",
      };
    }
  },
});
