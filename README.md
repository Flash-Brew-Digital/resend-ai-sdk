# Webflow - AI SDK Tools

![224 Industries OSS](https://img.shields.io/badge/224_Industries-OSS-111212?style=for-the-badge&labelColor=6AFFDC)
![MIT License](https://img.shields.io/badge/License-MIT-111212?style=for-the-badge&labelColor=6AFFDC)
[![Webflow Premium Partner](https://img.shields.io/badge/Premium_Partner-146EF5?style=for-the-badge&logo=webflow&logoColor=white)](https://webflow.com/@224-industries)
![Vercel AI SDK](https://img.shields.io/badge/Vercel-AI%20SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)

A collection of [AI SDK](https://ai-sdk.dev) tools that give your AI agents the ability to manage [Webflow](https://webflow.com) sites, pages, forms, and custom code.

## Installation

```bash
npm install @224industries/webflow-ai-sdk
```

## Setup

Set the following environment variables:

```bash
WEBFLOW_API_KEY="your_webflow_api_key"
WEBFLOW_SITE_ID="your_default_site_id"
```
Get your API key from the [Webflow Dashboard](https://webflow.com/dashboard).

## Usage

```ts
import { generateText, stepCountIs } from "ai";
import { listSites, listPages, publishSite } from "@224industries/webflow-ai-sdk";

const { text } = await generateText({
  model: 'openai/gpt-5.2',
  tools: { listSites, listPages, publishSite },
  prompt: "List all my sites and their pages",
  stopWhen: stepCountIs(5),
});
```

## Available Tools

| Tool | Description |
|------|-------------|
| `listSites` | List all Webflow sites accessible with the current API token |
| `publishSite` | Publish a site to custom domains or the Webflow subdomain |
| `listPages` | List all pages for a site with pagination |
| `listForms` | List all forms for a site with field definitions |
| `listFormSubmissions` | Retrieve submitted form data, optionally filtered by form |
| `listCustomCode` | List all custom code scripts applied to a site and its pages |
| `addCustomCode` | Register and apply an inline script to a site or page |

## AI SDK Library

Find other AI SDK agents and tools in the [AI SDK Library](https://aisdklibrary.com).

## Resources

- [Vercel AI SDK documentation](https://ai-sdk.dev/docs/introduction)
- [Webflow API documentation](https://developers.webflow.com)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

[MIT License](LICENSE)

## Creator

[Ben Sabic](https://bensabic.dev) (Fractional CTO) at [224 Industries](https://224industries.com.au)
