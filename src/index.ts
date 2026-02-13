import { tool } from "ai";
import { z } from "zod";

const BASE_URL = "https://api.webflow.com/v2";

const getApiKey = () => {
  const apiKey = process.env.WEBFLOW_API_KEY;
  if (!apiKey) {
    throw new Error("WEBFLOW_API_KEY environment variable is required");
  }
  return apiKey;
};

const callApi = async (
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT";
    body?: Record<string, unknown>;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<Record<string, unknown>> => {
  const { method = "GET", body, params } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webflow API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};

const getDefaultSiteId = () => process.env.WEBFLOW_SITE_ID ?? "";

const resolveSiteId = (siteId?: string): string => {
  const resolved = siteId || getDefaultSiteId();
  if (!resolved) {
    throw new Error(
      "A site ID is required. Either pass a siteId or set the WEBFLOW_SITE_ID environment variable."
    );
  }
  return resolved;
};

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

const parseFormFields = (
  rawFields: Record<string, Record<string, unknown>> | undefined
): Record<string, { displayName?: string; type?: string }> | undefined => {
  if (!rawFields) {
    return undefined;
  }
  const fields: Record<string, { displayName?: string; type?: string }> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    fields[key] = {
      displayName: value.displayName ? String(value.displayName) : undefined,
      type: value.type ? String(value.type) : undefined,
    };
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
};

// ── Output Schemas ──────────────────────────────────────────────────────────

const SiteInfoSchema = z.object({
  id: z.string().describe("Unique identifier for the Site"),
  displayName: z.string().describe("Name given to the Site"),
  shortName: z.string().describe("Slugified version of the name"),
  lastPublished: z
    .string()
    .optional()
    .describe("ISO timestamp when the site was last published"),
  lastUpdated: z
    .string()
    .optional()
    .describe("ISO timestamp when the site was last updated"),
  previewUrl: z.string().optional().describe("URL of the site preview image"),
  timeZone: z.string().optional().describe("Site timezone"),
  customDomains: z
    .array(
      z.object({
        id: z.string().describe("Domain ID"),
        url: z.string().describe("Registered domain name"),
      })
    )
    .optional()
    .describe("Custom domains attached to the site"),
});

const ListSitesResultSchema = z.object({
  sites: z.array(SiteInfoSchema).describe("Array of site metadata"),
  count: z.number().describe("Number of sites returned"),
  error: z.string().optional().describe("Error message if failed"),
});

const PublishSiteResultSchema = z.object({
  success: z.boolean().describe("Whether the publish was queued successfully"),
  publishedDomains: z
    .array(
      z.object({
        id: z.string().describe("Domain ID"),
        url: z.string().describe("Domain URL"),
      })
    )
    .optional()
    .describe("Domains that were published to"),
  error: z.string().optional().describe("Error message if failed"),
});

const PageInfoSchema = z.object({
  id: z.string().describe("Unique identifier for the Page"),
  title: z.string().describe("Title of the Page"),
  slug: z.string().describe("URL slug of the Page"),
  archived: z.boolean().optional().describe("Whether the Page is archived"),
  draft: z.boolean().optional().describe("Whether the Page is a draft"),
  createdOn: z
    .string()
    .optional()
    .describe("ISO timestamp when the page was created"),
  lastUpdated: z
    .string()
    .optional()
    .describe("ISO timestamp when the page was last updated"),
  publishedPath: z
    .string()
    .optional()
    .describe("Relative path of the published page URL"),
  seo: z
    .object({
      title: z.string().optional().describe("SEO title"),
      description: z.string().optional().describe("SEO description"),
    })
    .optional()
    .describe("SEO metadata for the page"),
});

const ListPagesResultSchema = z.object({
  pages: z.array(PageInfoSchema).describe("Array of page metadata"),
  count: z.number().describe("Number of pages returned"),
  pagination: z
    .object({
      limit: z.number().describe("Limit used for pagination"),
      offset: z.number().describe("Offset used for pagination"),
      total: z.number().describe("Total number of records"),
    })
    .optional()
    .describe("Pagination info"),
  error: z.string().optional().describe("Error message if failed"),
});

const FormInfoSchema = z.object({
  id: z.string().describe("Unique ID for the Form"),
  displayName: z.string().describe("Form name displayed on the site"),
  pageId: z.string().optional().describe("ID of the Page the form is on"),
  pageName: z.string().optional().describe("Name of the Page the form is on"),
  formElementId: z
    .string()
    .optional()
    .describe(
      "Unique element ID for the form, used to filter submissions across component instances"
    ),
  fields: z
    .record(
      z.string(),
      z.object({
        displayName: z.string().optional().describe("Field display name"),
        type: z.string().optional().describe("Field type"),
      })
    )
    .optional()
    .describe("Form field definitions"),
  createdOn: z
    .string()
    .optional()
    .describe("ISO timestamp when the form was created"),
  lastUpdated: z
    .string()
    .optional()
    .describe("ISO timestamp when the form was last updated"),
});

const ListFormsResultSchema = z.object({
  forms: z.array(FormInfoSchema).describe("Array of form metadata"),
  count: z.number().describe("Number of forms returned"),
  pagination: z
    .object({
      limit: z.number().describe("Limit used for pagination"),
      offset: z.number().describe("Offset used for pagination"),
      total: z.number().describe("Total number of records"),
    })
    .optional()
    .describe("Pagination info"),
  error: z.string().optional().describe("Error message if failed"),
});

const FormSubmissionSchema = z.object({
  id: z.string().describe("Unique ID of the form submission"),
  displayName: z.string().optional().describe("Form name"),
  dateSubmitted: z
    .string()
    .optional()
    .describe("ISO timestamp when the form was submitted"),
  formResponse: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Key/value pairs of submitted form data"),
});

const ListFormSubmissionsResultSchema = z.object({
  formSubmissions: z
    .array(FormSubmissionSchema)
    .describe("Array of form submissions"),
  count: z.number().describe("Number of submissions returned"),
  pagination: z
    .object({
      limit: z.number().describe("Limit used for pagination"),
      offset: z.number().describe("Offset used for pagination"),
      total: z.number().describe("Total number of records"),
    })
    .optional()
    .describe("Pagination info"),
  error: z.string().optional().describe("Error message if failed"),
});

const CustomCodeBlockSchema = z.object({
  siteId: z.string().describe("Site ID where the code is applied"),
  pageId: z.string().optional().describe("Page ID if applied at page level"),
  type: z.string().optional().describe("Whether applied at site or page level"),
  scripts: z
    .array(
      z.object({
        id: z.string().describe("Script ID"),
        location: z.string().describe("header or footer"),
        version: z.string().describe("SemVer version string"),
      })
    )
    .describe("Scripts applied in this block"),
  createdOn: z.string().optional().describe("ISO timestamp when created"),
  lastUpdated: z
    .string()
    .optional()
    .describe("ISO timestamp when last updated"),
});

const ListCustomCodeResultSchema = z.object({
  blocks: z
    .array(CustomCodeBlockSchema)
    .describe("Array of custom code blocks applied to the site and its pages"),
  count: z.number().describe("Number of blocks returned"),
  pagination: z
    .object({
      limit: z.number().describe("Limit used for pagination"),
      offset: z.number().describe("Offset used for pagination"),
      total: z.number().describe("Total number of records"),
    })
    .optional()
    .describe("Pagination info"),
  error: z.string().optional().describe("Error message if failed"),
});

const AddCustomCodeResultSchema = z.object({
  success: z
    .boolean()
    .describe("Whether the script was registered and applied"),
  scriptId: z.string().describe("ID of the registered script"),
  appliedTo: z
    .string()
    .optional()
    .describe("Whether the script was applied to a site or page"),
  error: z.string().optional().describe("Error message if failed"),
});

// ── Tools ───────────────────────────────────────────────────────────────────

const siteIdDescription = getDefaultSiteId()
  ? ` If not provided, defaults to the configured site: ${getDefaultSiteId()}.`
  : "";

export const listSites = tool({
  description:
    "List all Webflow sites that the user currently has access to. " +
    "Use this tool to discover available sites, find site IDs, check custom domains, or see when a site was last published.",
  inputSchema: z.object({}),
  inputExamples: [{ input: {} }],
  outputSchema: ListSitesResultSchema,
  strict: true,
  execute: async () => {
    try {
      const response = await callApi("/sites");

      const rawSites = (response.sites as Record<string, unknown>[]) ?? [];

      const sites = rawSites.map((raw) => {
        const domains = raw.customDomains as
          | Record<string, unknown>[]
          | undefined;

        return {
          id: String(raw.id ?? ""),
          displayName: String(raw.displayName ?? ""),
          shortName: String(raw.shortName ?? ""),
          lastPublished: getStringField(raw, "last_published", "lastPublished"),
          lastUpdated: getStringField(raw, "last_updated", "lastUpdated"),
          previewUrl: raw.previewUrl ? String(raw.previewUrl) : undefined,
          timeZone: raw.timeZone ? String(raw.timeZone) : undefined,
          designerUrl: `https://${raw.shortName}.design.webflow.com`,
          settingsUrl: `https://webflow.com/dashboard/sites/${raw.shortName}/general`,
          customDomains: domains?.map((d) => ({
            id: String(d.id ?? ""),
            url: String(d.url ?? ""),
          })),
        };
      });

      return { sites, count: sites.length };
    } catch (error) {
      console.error("Error listing sites:", error);
      return {
        sites: [],
        count: 0,
        error: error instanceof Error ? error.message : "Failed to list sites",
      };
    }
  },
});

export const publishSite = tool({
  description:
    "Publish a Webflow site to one or more domains. " +
    "Use this tool when the user wants to deploy or publish their site. " +
    "You must set publishToWebflowSubdomain to true, pass specific custom domain IDs from listSites, or both. " +
    "Do NOT pass customDomains unless you have retrieved actual domain IDs from listSites — not all sites have custom domains. " +
    "Rate limited to 1 publish per minute." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site to publish.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    customDomains: z
      .array(z.string())
      .optional()
      .describe(
        "Array of custom domain IDs to publish to. Only provide this if you have retrieved actual domain IDs from the listSites tool. Do NOT guess or fabricate domain IDs. Omit this field entirely if the site has no custom domains."
      ),
    publishToWebflowSubdomain: z
      .boolean()
      .optional()
      .describe(
        "Whether to publish to the default Webflow subdomain (yoursite.webflow.io). Set to true if no custom domains are being used."
      ),
  }),
  inputExamples: [
    {
      input: {
        siteId: "580e63e98c9a982ac9b8b741",
        publishToWebflowSubdomain: true,
      },
    },
    {
      input: {
        siteId: "580e63e98c9a982ac9b8b741",
        customDomains: ["660c6449dd97ebc7346ac629"],
      },
    },
  ],
  outputSchema: PublishSiteResultSchema,
  strict: true,
  needsApproval: true,
  execute: async ({ siteId, customDomains, publishToWebflowSubdomain }) => {
    try {
      const resolvedSiteId = resolveSiteId(siteId);

      const body: Record<string, unknown> = {
        publishToWebflowSubdomain: publishToWebflowSubdomain ?? false,
      };
      if (customDomains && customDomains.length > 0) {
        body.customDomains = customDomains;
      }

      const response = await callApi(`/sites/${resolvedSiteId}/publish`, {
        method: "POST",
        body,
      });

      const domains = response.customDomains as
        | Record<string, unknown>[]
        | undefined;

      return {
        success: true,
        publishedDomains: domains?.map((d) => ({
          id: String(d.id ?? ""),
          url: String(d.url ?? ""),
        })),
      };
    } catch (error) {
      console.error("Error publishing site:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to publish site",
      };
    }
  },
});

export const listPages = tool({
  description:
    "List all pages for a Webflow site. " +
    "Use this tool to browse site pages, find page IDs for custom code injection, or check page SEO metadata. " +
    "Supports pagination via limit and offset parameters." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of pages to return. Default 100, max 100."),
    offset: z
      .number()
      .optional()
      .describe("Offset for pagination if results exceed the limit."),
  }),
  inputExamples: [
    { input: { siteId: "580e63e98c9a982ac9b8b741" } },
    { input: { siteId: "580e63e98c9a982ac9b8b741", limit: 10, offset: 0 } },
  ],
  outputSchema: ListPagesResultSchema,
  strict: true,
  execute: async ({ siteId, limit, offset }) => {
    try {
      const resolvedSiteId = resolveSiteId(siteId);

      const response = await callApi(`/sites/${resolvedSiteId}/pages`, {
        params: { limit, offset },
      });

      const rawPages = (response.pages as Record<string, unknown>[]) ?? [];

      const pages = rawPages.map((page) => {
        const seo = page.seo as Record<string, unknown> | undefined;
        return {
          id: String(page.id ?? ""),
          title: String(page.title ?? ""),
          slug: String(page.slug ?? ""),
          archived: page.archived ? Boolean(page.archived) : undefined,
          draft: page.draft ? Boolean(page.draft) : undefined,
          createdOn: getStringField(page, "created_on", "createdOn"),
          lastUpdated: getStringField(page, "last_updated", "lastUpdated"),
          publishedPath: page.publishedPath
            ? String(page.publishedPath)
            : undefined,
          seo: seo
            ? {
                title: seo.title ? String(seo.title) : undefined,
                description: seo.description
                  ? String(seo.description)
                  : undefined,
              }
            : undefined,
        };
      });

      const pagination = response.pagination as
        | Record<string, unknown>
        | undefined;

      return {
        pages,
        count: pages.length,
        pagination: pagination
          ? {
              limit: Number(pagination.limit ?? 0),
              offset: Number(pagination.offset ?? 0),
              total: Number(pagination.total ?? 0),
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error listing pages:", error);
      return {
        pages: [],
        count: 0,
        error: error instanceof Error ? error.message : "Failed to list pages",
      };
    }
  },
});

export const listForms = tool({
  description:
    "List all forms for a Webflow site. " +
    "Use this tool to browse available forms, find form IDs and element IDs, or inspect form field definitions. " +
    "The formElementId can be used to filter submissions across component instances. " +
    "Supports pagination via limit and offset parameters." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of forms to return. Default 100, max 100."),
    offset: z
      .number()
      .optional()
      .describe("Offset for pagination if results exceed the limit."),
  }),
  inputExamples: [
    { input: { siteId: "580e63e98c9a982ac9b8b741" } },
    { input: { siteId: "580e63e98c9a982ac9b8b741", limit: 10 } },
  ],
  outputSchema: ListFormsResultSchema,
  strict: true,
  execute: async ({ siteId, limit, offset }) => {
    try {
      const resolvedSiteId = resolveSiteId(siteId);

      const response = await callApi(`/sites/${resolvedSiteId}/forms`, {
        params: { limit, offset },
      });

      const rawForms = (response.forms as Record<string, unknown>[]) ?? [];

      const forms = rawForms.map((form) => ({
        id: String(form.id ?? ""),
        displayName: String(form.displayName ?? ""),
        pageId: form.pageId ? String(form.pageId) : undefined,
        pageName: form.pageName ? String(form.pageName) : undefined,
        formElementId: getStringField(form, "form_element_id", "formElementId"),
        fields: parseFormFields(
          form.fields as Record<string, Record<string, unknown>> | undefined
        ),
        createdOn: getStringField(form, "created_on", "createdOn"),
        lastUpdated: getStringField(form, "last_updated", "lastUpdated"),
      }));

      const pagination = response.pagination as
        | Record<string, unknown>
        | undefined;

      return {
        forms,
        count: forms.length,
        pagination: pagination
          ? {
              limit: Number(pagination.limit ?? 0),
              offset: Number(pagination.offset ?? 0),
              total: Number(pagination.total ?? 0),
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error listing forms:", error);
      return {
        forms: [],
        count: 0,
        error: error instanceof Error ? error.message : "Failed to list forms",
      };
    }
  },
});

export const listFormSubmissions = tool({
  description:
    "List form submissions for a Webflow site. " +
    "Use this tool to retrieve submitted form data such as leads, contact requests, or signups. " +
    "Optionally filter by elementId to get submissions for a specific form across all component instances. " +
    "Get the elementId from the listForms tool (returned as formElementId). " +
    "Supports pagination via limit and offset parameters." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    elementId: z
      .string()
      .optional()
      .describe(
        "Filter submissions to a specific form by its element ID. Get this from listForms (formElementId field)."
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe(
        "Maximum number of submissions to return. Default 100, max 100."
      ),
    offset: z
      .number()
      .optional()
      .describe("Offset for pagination if results exceed the limit."),
  }),
  inputExamples: [
    { input: { siteId: "580e63e98c9a982ac9b8b741" } },
    {
      input: {
        siteId: "580e63e98c9a982ac9b8b741",
        elementId: "18259716-3e5a-646a-5f41-5dc4b9405aa0",
        limit: 25,
      },
    },
  ],
  outputSchema: ListFormSubmissionsResultSchema,
  strict: true,
  execute: async ({ siteId, elementId, limit, offset }) => {
    try {
      const resolvedSiteId = resolveSiteId(siteId);

      const response = await callApi(
        `/sites/${resolvedSiteId}/form_submissions`,
        { params: { elementId, limit, offset } }
      );

      const rawSubmissions =
        (response.formSubmissions as Record<string, unknown>[]) ?? [];

      const formSubmissions = rawSubmissions.map((submission) => ({
        id: String(submission.id ?? ""),
        displayName: submission.displayName
          ? String(submission.displayName)
          : undefined,
        dateSubmitted: getStringField(
          submission,
          "date_submitted",
          "dateSubmitted"
        ),
        formResponse:
          (submission.formResponse as Record<string, unknown>) ?? {},
      }));

      const pagination = response.pagination as
        | Record<string, unknown>
        | undefined;

      return {
        formSubmissions,
        count: formSubmissions.length,
        pagination: pagination
          ? {
              limit: Number(pagination.limit ?? 0),
              offset: Number(pagination.offset ?? 0),
              total: Number(pagination.total ?? 0),
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error listing form submissions:", error);
      return {
        formSubmissions: [],
        count: 0,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list form submissions",
      };
    }
  },
});

export const listCustomCode = tool({
  description:
    "List all custom code scripts applied to a Webflow site and its pages. " +
    "Use this tool to audit what scripts are currently active, check script versions, or see where scripts are applied (site-level vs page-level). " +
    "Supports pagination via limit and offset parameters." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe(
        "Maximum number of code blocks to return. Default 100, max 100."
      ),
    offset: z
      .number()
      .optional()
      .describe("Offset for pagination if results exceed the limit."),
  }),
  inputExamples: [
    { input: { siteId: "580e63e98c9a982ac9b8b741" } },
    { input: { siteId: "580e63e98c9a982ac9b8b741", limit: 10 } },
  ],
  outputSchema: ListCustomCodeResultSchema,
  strict: true,
  execute: async ({ siteId, limit, offset }) => {
    try {
      const resolvedSiteId = resolveSiteId(siteId);

      const response = await callApi(
        `/sites/${resolvedSiteId}/custom_code/blocks`,
        { params: { limit, offset } }
      );

      const rawBlocks = (response.blocks as Record<string, unknown>[]) ?? [];

      const blocks = rawBlocks.map((block) => {
        const rawScripts = (block.scripts as Record<string, unknown>[]) ?? [];

        return {
          siteId: String(block.siteId ?? ""),
          pageId: block.pageId ? String(block.pageId) : undefined,
          type: block.type ? String(block.type) : undefined,
          scripts: rawScripts.map((script) => ({
            id: String(script.id ?? ""),
            location: String(script.location ?? ""),
            version: String(script.version ?? ""),
          })),
          createdOn: getStringField(block, "created_on", "createdOn"),
          lastUpdated: getStringField(block, "last_updated", "lastUpdated"),
        };
      });

      const pagination = response.pagination as
        | Record<string, unknown>
        | undefined;

      return {
        blocks,
        count: blocks.length,
        pagination: pagination
          ? {
              limit: Number(pagination.limit ?? 0),
              offset: Number(pagination.offset ?? 0),
              total: Number(pagination.total ?? 0),
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error listing custom code:", error);
      return {
        blocks: [],
        count: 0,
        error:
          error instanceof Error ? error.message : "Failed to list custom code",
      };
    }
  },
});

export const addCustomCode = tool({
  description:
    "Register and apply an inline script to a Webflow site or a specific page. " +
    "Use this tool when the user wants to add tracking scripts (e.g. Google Analytics, Meta Pixel), " +
    "custom JavaScript, chat widgets, or any inline script. " +
    "This tool handles both registering the script and applying it in a single step. " +
    "Inline scripts are limited to 2000 characters. " +
    "The site must be published after adding custom code for changes to take effect." +
    siteIdDescription,
  inputSchema: z.object({
    siteId: z
      .string()
      .optional()
      .describe(
        `The ID of the site to register the script on.${siteIdDescription || " Use listSites to find available site IDs."}`
      ),
    target: z
      .enum(["site", "page"])
      .describe(
        'Where to apply the script. Use "site" for site-wide scripts or "page" for a specific page.'
      ),
    pageId: z
      .string()
      .optional()
      .describe(
        'The ID of the page to apply the script to. Required when target is "page". Use listPages to find page IDs.'
      ),
    sourceCode: z
      .string()
      .describe("The JavaScript source code to add. Maximum 2000 characters."),
    displayName: z
      .string()
      .describe(
        "A user-facing name for the script. Must be between 1 and 50 alphanumeric characters (e.g. 'Google Analytics', 'Chat Widget')."
      ),
    version: z
      .string()
      .describe(
        'A Semantic Version string for the script (e.g. "1.0.0", "0.0.1").'
      ),
    location: z
      .enum(["header", "footer"])
      .describe(
        'Where to place the script on the page. Use "header" for scripts that need to load early (e.g. analytics) or "footer" for scripts that can load after content.'
      ),
  }),
  inputExamples: [
    {
      input: {
        siteId: "580e63e98c9a982ac9b8b741",
        target: "site",
        sourceCode: "console.log('Hello from Webflow!');",
        displayName: "Hello Script",
        version: "1.0.0",
        location: "footer",
      },
    },
    {
      input: {
        siteId: "580e63e98c9a982ac9b8b741",
        target: "page",
        pageId: "63c720f9347c2139b248e552",
        sourceCode:
          "!function(f,b,e,v,n,t,s){/* Meta Pixel */}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
        displayName: "Meta Pixel",
        version: "1.0.0",
        location: "header",
      },
    },
  ],
  outputSchema: AddCustomCodeResultSchema,
  strict: true,
  needsApproval: true,
  execute: async ({
    siteId,
    target,
    pageId,
    sourceCode,
    displayName,
    version,
    location,
  }) => {
    try {
      if (target === "page" && !pageId) {
        return {
          success: false,
          scriptId: "",
          error:
            'A pageId is required when target is "page". Use listPages to find page IDs.',
        };
      }

      if (sourceCode.length > 2000) {
        return {
          success: false,
          scriptId: "",
          error: `Script exceeds the 2000 character limit (${sourceCode.length} characters). Consider hosting the script externally.`,
        };
      }

      const resolvedSiteId = resolveSiteId(siteId);

      // Step 1: Register the inline script
      // POST /sites/{site_id}/registered_scripts/inline
      const registered = await callApi(
        `/sites/${resolvedSiteId}/registered_scripts/inline`,
        {
          method: "POST",
          body: { sourceCode, version, displayName },
        }
      );

      const scriptId = String(registered.id ?? "");

      if (!scriptId) {
        return {
          success: false,
          scriptId: "",
          error: "Failed to register script: no script ID returned",
        };
      }

      // Step 2: Apply the script to site or page
      // PUT /sites/{site_id}/custom_code  OR  PUT /pages/{page_id}/custom_code
      const scriptPayload = {
        scripts: [{ id: scriptId, location, version }],
      };

      if (target === "page" && pageId) {
        await callApi(`/pages/${pageId}/custom_code`, {
          method: "PUT",
          body: scriptPayload,
        });
      } else {
        await callApi(`/sites/${resolvedSiteId}/custom_code`, {
          method: "PUT",
          body: scriptPayload,
        });
      }

      return {
        success: true,
        scriptId,
        appliedTo:
          target === "page" ? `page:${pageId}` : `site:${resolvedSiteId}`,
      };
    } catch (error) {
      console.error("Error adding custom code:", error);
      return {
        success: false,
        scriptId: "",
        error:
          error instanceof Error ? error.message : "Failed to add custom code",
      };
    }
  },
});
