# Resend - AI SDK Tools

![Flash Brew Digital OSS](https://img.shields.io/badge/Flash_Brew_Digital-OSS-6F4E37?style=for-the-badge&labelColor=E9E3DD)
![MIT License](https://img.shields.io/badge/License-MIT-6F4E37?style=for-the-badge&labelColor=E9E3DD)
![Vercel AI SDK](https://img.shields.io/badge/Vercel-AI%20SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)

A collection of [AI SDK](https://ai-sdk.dev) tools that give your AI agents the ability to send and manage emails using [Resend](https://resend.com).

## Installation

```bash
npm install resend-ai-sdk
```

## Setup

Set the following environment variables:

```bashbash
RESEND_API_KEY="your_resend_api_key"
RESEND_EMAIL_DOMAIN="your_verified_domain.com"
```
Get your API key from the [Resend Dashboard](https://resend.com/api-keys).

You'll also need to [verify your domain](https://resend.com/domains) to send emails.

## Usage

```ts
import { generateText, stepCountIs } from "ai";
import { sendEmail, listTemplates, getTemplate } from "resend-ai-sdk";

const { text } = await generateText({
  model: 'openai/gpt-5.2',
  tools: { sendEmail, listTemplates, getTemplate },
  prompt: "Find my welcome template and send it to user@example.com from hello@acme.com",
  stopWhen: stepCountIs(5),
});
```

## Available Tools

| Tool | Description |
|------|-------------|
| `sendEmail` | Send an email with HTML, plain text, or a template |
| `sendBatchEmails` | Send multiple emails at once (up to 100) |
| `getEmail` | Retrieve the status and metadata of a sent email |
| `listEmails` | List recently sent emails |
| `listTemplates` | List available email templates with pagination |
| `getTemplate` | Retrieve a template's content, variables, and metadata |
| `createContact` | Add a new contact to your Resend account |
| `listContacts` | List contacts in your account |
| `removeContact` | Remove a contact permanently (requires approval) |

## AI SDK Library

Find other AI SDK agents and tools in the [AI SDK Library](https://aisdklibrary.com).

## Resources

- [Vercel AI SDK documentation](https://ai-sdk.dev/docs/introduction)
- [Resend API documentation](https://resend.com/docs/introduction)
- [Resend Node.js SDK](https://github.com/resend/resend-node)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

[MIT License](LICENSE.md)

## Author

[Ben Sabic](https://bensabic.ca) at [Flash Brew Digital](https://flashbrew.digital)