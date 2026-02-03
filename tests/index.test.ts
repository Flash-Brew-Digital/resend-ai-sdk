import type { ToolExecutionOptions } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createContact,
  getEmail,
  getTemplate,
  listContacts,
  listEmails,
  listTemplates,
  removeContact,
  sendBatchEmails,
  sendEmail,
} from "../src/index.js";

const mockEmailsSend = vi.fn();
const mockEmailsGet = vi.fn();
const mockEmailsList = vi.fn();
const mockBatchSend = vi.fn();
const mockContactsCreate = vi.fn();
const mockContactsList = vi.fn();
const mockContactsRemove = vi.fn();
const mockTemplatesList = vi.fn();
const mockTemplatesGet = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = {
      send: mockEmailsSend,
      get: mockEmailsGet,
      list: mockEmailsList,
    };
    batch = {
      send: mockBatchSend,
    };
    contacts = {
      create: mockContactsCreate,
      list: mockContactsList,
      remove: mockContactsRemove,
    };
    templates = {
      list: mockTemplatesList,
      get: mockTemplatesGet,
    };
  },
}));

const toolOptions: ToolExecutionOptions = {
  toolCallId: "test",
  messages: [],
};

// Helper to safely call tool execute
async function execute<TInput, TOutput>(
  tool: { execute?: (input: TInput, options: ToolExecutionOptions) => TOutput },
  input: TInput
): Promise<Awaited<TOutput>> {
  if (!tool.execute) {
    throw new Error("Tool execute function is undefined");
  }
  return await tool.execute(input, toolOptions);
}

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("sends an email successfully", async () => {
    mockEmailsSend.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
    });

    const result = await execute(sendEmail, {
      from: "hello@example.com",
      to: ["user@example.com"],
      subject: "Test Email",
      html: "<p>Hello!</p>",
    });

    expect(result).toMatchObject({
      success: true,
      id: "email-123",
    });
  });

  it("handles send errors gracefully", async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key" },
    });

    const result = await execute(sendEmail, {
      from: "hello@example.com",
      to: ["user@example.com"],
      subject: "Test Email",
      html: "<p>Hello!</p>",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Invalid API key",
    });
  });

  it("handles exceptions gracefully", async () => {
    mockEmailsSend.mockRejectedValue(new Error("Network error"));

    const result = await execute(sendEmail, {
      from: "hello@example.com",
      to: ["user@example.com"],
      subject: "Test Email",
      html: "<p>Hello!</p>",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Network error",
    });
  });
});

describe("sendBatchEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("sends batch emails successfully", async () => {
    mockBatchSend.mockResolvedValue({
      data: { data: [{ id: "email-1" }, { id: "email-2" }] },
      error: null,
    });

    const result = await execute(sendBatchEmails, {
      emails: [
        {
          from: "hello@example.com",
          to: ["alice@example.com"],
          subject: "Hello Alice",
          html: "<p>Hi Alice!</p>",
        },
        {
          from: "hello@example.com",
          to: ["bob@example.com"],
          subject: "Hello Bob",
          html: "<p>Hi Bob!</p>",
        },
      ],
    });

    expect(result).toMatchObject({
      success: true,
      count: 2,
      ids: ["email-1", "email-2"],
    });
  });

  it("handles batch errors gracefully", async () => {
    mockBatchSend.mockResolvedValue({
      data: null,
      error: { message: "Batch limit exceeded" },
    });

    const result = await execute(sendBatchEmails, {
      emails: [
        {
          from: "hello@example.com",
          to: ["user@example.com"],
          subject: "Test",
          html: "<p>Test</p>",
        },
      ],
    });

    expect(result).toMatchObject({
      success: false,
      error: "Batch limit exceeded",
    });
  });
});

describe("getEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("retrieves email info successfully", async () => {
    mockEmailsGet.mockResolvedValue({
      data: {
        id: "email-123",
        from: "hello@example.com",
        to: ["user@example.com"],
        subject: "Test Email",
        last_event: "delivered",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const result = await execute(getEmail, {
      emailId: "email-123",
    });

    expect(result).toMatchObject({
      success: true,
      id: "email-123",
      from: "hello@example.com",
      subject: "Test Email",
      lastEvent: "delivered",
    });
  });

  it("handles get errors gracefully", async () => {
    mockEmailsGet.mockResolvedValue({
      data: null,
      error: { message: "Email not found" },
    });

    const result = await execute(getEmail, {
      emailId: "nonexistent",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Email not found",
    });
  });
});

describe("listEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("lists emails successfully", async () => {
    mockEmailsList.mockResolvedValue({
      data: {
        data: [
          {
            id: "email-1",
            from: "hello@example.com",
            to: ["user1@example.com"],
            subject: "Email 1",
            created_at: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "email-2",
            from: "hello@example.com",
            to: ["user2@example.com"],
            subject: "Email 2",
            created_at: "2024-01-02T00:00:00.000Z",
          },
        ],
      },
      error: null,
    });

    const result = await execute(listEmails, {});

    expect(result).toMatchObject({
      count: 2,
    });
    expect(result).toHaveProperty("emails");
    const emails = (result as { emails: unknown[] }).emails;
    expect(emails[0]).toMatchObject({
      id: "email-1",
      subject: "Email 1",
    });
  });

  it("handles list errors gracefully", async () => {
    mockEmailsList.mockResolvedValue({
      data: null,
      error: { message: "Unauthorized" },
    });

    const result = await execute(listEmails, {});

    expect(result).toMatchObject({
      count: 0,
      emails: [],
      error: "Unauthorized",
    });
  });
});

describe("createContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("creates a contact successfully", async () => {
    mockContactsCreate.mockResolvedValue({
      data: { id: "contact-123" },
      error: null,
    });

    const result = await execute(createContact, {
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
    });

    expect(result).toMatchObject({
      success: true,
      id: "contact-123",
    });
  });

  it("handles create errors gracefully", async () => {
    mockContactsCreate.mockResolvedValue({
      data: null,
      error: { message: "Contact already exists" },
    });

    const result = await execute(createContact, {
      email: "user@example.com",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Contact already exists",
    });
  });
});

describe("listContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("lists contacts successfully", async () => {
    mockContactsList.mockResolvedValue({
      data: {
        data: [
          {
            id: "contact-1",
            email: "user1@example.com",
            first_name: "John",
            last_name: "Doe",
            unsubscribed: false,
          },
          {
            id: "contact-2",
            email: "user2@example.com",
            first_name: "Jane",
            last_name: "Smith",
            unsubscribed: true,
          },
        ],
      },
      error: null,
    });

    const result = await execute(listContacts, {});

    expect(result).toMatchObject({
      count: 2,
    });
    expect(result).toHaveProperty("contacts");
    const contacts = (result as { contacts: unknown[] }).contacts;
    expect(contacts[0]).toMatchObject({
      id: "contact-1",
      email: "user1@example.com",
      firstName: "John",
    });
  });

  it("handles list errors gracefully", async () => {
    mockContactsList.mockResolvedValue({
      data: null,
      error: { message: "Unauthorized" },
    });

    const result = await execute(listContacts, {});

    expect(result).toMatchObject({
      count: 0,
      contacts: [],
      error: "Unauthorized",
    });
  });
});

describe("removeContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("removes a contact successfully", async () => {
    mockContactsRemove.mockResolvedValue({
      data: { id: "contact-123", deleted: true },
      error: null,
    });

    const result = await execute(removeContact, {
      id: "contact-123",
    });

    expect(result).toMatchObject({
      success: true,
      deleted: true,
      id: "contact-123",
    });
  });

  it("handles remove errors gracefully", async () => {
    mockContactsRemove.mockResolvedValue({
      data: null,
      error: { message: "Contact not found" },
    });

    const result = await execute(removeContact, {
      id: "nonexistent",
    });

    expect(result).toMatchObject({
      success: false,
      deleted: false,
      error: "Contact not found",
    });
  });
});

describe("listTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("lists templates successfully", async () => {
    mockTemplatesList.mockResolvedValue({
      data: {
        data: [
          {
            id: "template-1",
            name: "Welcome Email",
            alias: "welcome",
            status: "published",
            created_at: "2024-01-01T00:00:00.000Z",
          },
          {
            id: "template-2",
            name: "Password Reset",
            alias: "reset-password",
            status: "draft",
            created_at: "2024-01-02T00:00:00.000Z",
          },
        ],
        has_more: false,
      },
      error: null,
    });

    const result = await execute(listTemplates, {});

    expect(result).toMatchObject({
      count: 2,
      hasMore: false,
    });
    expect(result).toHaveProperty("templates");
    const templates = (result as { templates: unknown[] }).templates;
    expect(templates[0]).toMatchObject({
      id: "template-1",
      name: "Welcome Email",
      alias: "welcome",
    });
  });

  it("handles list errors gracefully", async () => {
    mockTemplatesList.mockResolvedValue({
      data: null,
      error: { message: "Unauthorized" },
    });

    const result = await execute(listTemplates, {});

    expect(result).toMatchObject({
      count: 0,
      templates: [],
      error: "Unauthorized",
    });
  });
});

describe("getTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
  });

  it("retrieves template info successfully", async () => {
    mockTemplatesGet.mockResolvedValue({
      data: {
        id: "template-123",
        name: "Welcome Email",
        alias: "welcome",
        status: "published",
        from: "hello@example.com",
        subject: "Welcome!",
        variables: [
          { key: "name", type: "string" },
          { key: "company", type: "string", fallback_value: "Acme" },
        ],
        created_at: "2024-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const result = await execute(getTemplate, {
      id: "template-123",
    });

    expect(result).toMatchObject({
      success: true,
      id: "template-123",
      name: "Welcome Email",
      alias: "welcome",
      status: "published",
    });
    expect(result).toHaveProperty("variables");
  });

  it("handles get errors gracefully", async () => {
    mockTemplatesGet.mockResolvedValue({
      data: null,
      error: { message: "Template not found" },
    });

    const result = await execute(getTemplate, {
      id: "nonexistent",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Template not found",
    });
  });
});

describe("tool configurations", () => {
  it("sendEmail has correct configuration", () => {
    expect(sendEmail.description).toContain("Send");
    expect(sendEmail.inputSchema).toBeDefined();
  });

  it("removeContact requires approval", () => {
    expect(removeContact.needsApproval).toBe(true);
  });

  it("non-destructive tools do not require approval", () => {
    expect(sendEmail.needsApproval).toBeUndefined();
    expect(sendBatchEmails.needsApproval).toBeUndefined();
    expect(getEmail.needsApproval).toBeUndefined();
    expect(listEmails.needsApproval).toBeUndefined();
    expect(createContact.needsApproval).toBeUndefined();
    expect(listContacts.needsApproval).toBeUndefined();
    expect(listTemplates.needsApproval).toBeUndefined();
    expect(getTemplate.needsApproval).toBeUndefined();
  });
});
