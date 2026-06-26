interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * CVR — Det Centrale Virksomhedsregister (Danish Central Business Register) MCP.
 * Keyless lookups via cvrapi.dk. No API key required.
 *
 * CVR = the Danish 8-digit company number (e.g. Novo Nordisk A/S = 24256790).
 * cvrapi.dk returns a SINGLE best-match company object (not a list), with fields:
 *   name, vat (the CVR number), address, zipcode, city, phone, email,
 *   employees, industrycode/industrydesc, companycode/companydesc (company form,
 *   e.g. "Aktieselskab"/A/S), startdate, enddate, status, productionunits (P-units),
 *   owners. A miss is returned as HTTP 200 with an {error, message} body
 *   (e.g. error="NEXISTS" / "NOTFOUND") — surfaced as a clear no-match result.
 *
 * cvrapi.dk requires a descriptive User-Agent identifying the calling app or it
 * rejects the request ({error:"INVALID_UA_LENGTH"}).
 */


const BASE = 'https://cvrapi.dk/api';
const UA = 'pipeworx-mcp-cvr-dk/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'lookup_company',
    description:
      'Look up a Danish company in the official CVR register (Det Centrale Virksomhedsregister) by name, 8-digit CVR number, phone number, or P-number (production-unit number). Returns the SINGLE best-match company record: name, vat (CVR number), address, zipcode, city, phone, email, employees, industrycode/industrydesc, companycode/companydesc (company form, e.g. A/S = Aktieselskab), startdate, status, productionunits, owners. Country defaults to "dk". e.g. {query:"novo nordisk"} or {query:"24256790"}.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name, 8-digit CVR number, phone number, or P-number. e.g. "novo nordisk" or "24256790".',
        },
        country: { type: 'string', description: 'Country code (default "dk"). cvrapi also supports "no" and "ee".' },
      },
      required: ['query'],
    },
  },
  {
    name: 'lookup_by_vat',
    description:
      'Look up a Danish company by its explicit 8-digit CVR/VAT number. Returns the single best-match record (same fields as lookup_company). Use this when you already have the CVR number. e.g. {vat:"24256790"} (Novo Nordisk A/S).',
    inputSchema: {
      type: 'object',
      properties: {
        vat: { type: 'string', description: '8-digit Danish CVR number, e.g. "24256790".' },
        country: { type: 'string', description: 'Country code (default "dk").' },
      },
      required: ['vat'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'lookup_company':
      return cvrLookup(reqStr(args, 'query', '"novo nordisk" or "24256790"'), args.country);
    case 'lookup_by_vat':
      return cvrLookup(reqStr(args, 'vat', '"24256790"'), args.country);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function cvrLookup(search: string, country: unknown): Promise<unknown> {
  const p = new URLSearchParams({
    search: search.trim(),
    country: typeof country === 'string' && country.trim() ? country.trim() : 'dk',
    format: 'json',
  });
  const res = await fetch(`${BASE}?${p.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`CVR: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const data = (await res.json()) as Record<string, unknown>;
  // cvrapi.dk returns errors (including not-found) as HTTP 200 with an {error, message} body.
  // Surface a clear no-match result instead of throwing.
  if (data && typeof data === 'object' && 'error' in data) {
    return { found: false, error: data.error, message: data.message ?? null, query: search.trim() };
  }
  return data;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim())
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
