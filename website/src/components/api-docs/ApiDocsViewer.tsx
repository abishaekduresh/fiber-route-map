'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import styles from './ApiDocsViewer.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
}

interface ContentObject {
  schema?: SchemaObject;
  example?: any;
  examples?: Record<string, ExampleObject>;
}

interface OpenAPISpec {
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, ResponseObject>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  deprecated?: boolean;
}

interface ParameterObject {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  example?: any;
  $ref?: string;
}

interface RequestBodyObject {
  description?: string;
  required?: boolean;
  content?: Record<string, ContentObject>;
}

interface ResponseObject {
  description?: string;
  content?: Record<string, ContentObject>;
  $ref?: string;
}

interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: any[];
  $ref?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  example?: any;
  default?: any;
  nullable?: boolean;
}

interface ParsedEndpoint {
  method: string;
  path: string;
  operation: OpenAPIOperation;
  tag: string;
  key: string;
}

interface TryResponse {
  status: number;
  statusText: string;
  time: number;
  body: any;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<string, { bg: string; border: string; color: string; label: string }> = {
  get:    { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  color: '#10b981', label: 'GET'    },
  post:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  color: '#3b82f6', label: 'POST'   },
  put:    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b', label: 'PUT'    },
  delete: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   color: '#ef4444', label: 'DELETE' },
  patch:  { bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.3)',  color: '#a855f7', label: 'PATCH'  },
};

const STATUS_COLOR = (code: string | number) => {
  const n = typeof code === 'string' ? parseInt(code, 10) : code;
  if (n >= 200 && n < 300) return '#10b981';
  if (n >= 400 && n < 500) return '#f59e0b';
  if (n >= 500) return '#ef4444';
  return 'var(--color-text-muted)';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveRef(spec: OpenAPISpec, ref: string): any {
  if (!ref?.startsWith('#/')) return null;
  const parts = ref.replace('#/', '').split('/');
  let current: any = spec;
  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) return null;
  }
  return current;
}

function resolveSchema(spec: OpenAPISpec, schema?: SchemaObject): SchemaObject | null {
  if (!schema) return null;
  if (schema.$ref) return resolveRef(spec, schema.$ref) || schema;
  return schema;
}

function getSchemaType(schema: SchemaObject): string {
  if (schema.enum) return `enum(${schema.enum.map(v => JSON.stringify(v)).join(' | ')})`;
  if (schema.type === 'array') {
    const items = schema.items;
    if (items?.$ref) return `array<${items.$ref.split('/').pop()}>`;
    return `array<${items?.type || 'any'}>`;
  }
  return [schema.type, schema.format].filter(Boolean).join(':') || 'any';
}

function generateExample(spec: OpenAPISpec, schema: SchemaObject | null | undefined, depth = 0): any {
  if (!schema || depth > 4) return null;
  const resolved = resolveSchema(spec, schema);
  if (!resolved) return null;
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.type === 'object' && resolved.properties) {
    const obj: Record<string, any> = {};
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      obj[key] = generateExample(spec, resolveSchema(spec, propSchema) || propSchema, depth + 1);
    }
    return obj;
  }
  if (resolved.type === 'array' && resolved.items) {
    return [generateExample(spec, resolved.items, depth + 1)];
  }
  switch (resolved.type) {
    case 'string':
      if (resolved.format === 'uuid') return '019d1eb5-0000-7000-0000-000000000001';
      if (resolved.format === 'email') return 'user@example.com';
      if (resolved.format === 'password') return 'Password@1234';
      if (resolved.enum?.length) return resolved.enum[0];
      return 'string';
    case 'integer': return 1;
    case 'number': return 1.0;
    case 'boolean': return true;
    default: return null;
  }
}

function getRequestBodyExample(spec: OpenAPISpec, requestBody?: RequestBodyObject): any {
  if (!requestBody?.content) return null;
  const ct = Object.values(requestBody.content)[0];
  if (!ct) return null;
  if (ct.example !== undefined) return ct.example;
  if (ct.examples) {
    const first = Object.values(ct.examples)[0];
    if (first?.value !== undefined) return first.value;
  }
  if (ct.schema) return generateExample(spec, ct.schema);
  return null;
}

function getResponseExamples(spec: OpenAPISpec, response: ResponseObject): Array<{ name?: string; summary?: string; value: any }> | null {
  const resolved: ResponseObject = response.$ref ? (resolveRef(spec, response.$ref) || response) : response;
  if (!resolved.content) return null;
  const ct = Object.values(resolved.content)[0];
  if (!ct) return null;
  if (ct.examples) {
    const entries = Object.entries(ct.examples).map(([name, ex]) => ({ name, summary: ex.summary, value: ex.value }));
    return entries.length ? entries : null;
  }
  if (ct.example !== undefined) return [{ value: ct.example }];
  return null;
}

function parseEndpoints(spec: OpenAPISpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OpenAPIOperation | undefined;
      if (!operation) continue;
      const tag = operation.tags?.[0] || 'General';
      endpoints.push({ method, path, operation, tag, key: `${method.toUpperCase()} ${path}` });
    }
  }
  return endpoints;
}

function extractPathParams(path: string): string[] {
  return (path.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1));
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ value }: { value: any }) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className={styles.codeBlock}>
      <button className={styles.copyBtn} onClick={handleCopy} title="Copy to clipboard">
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      <pre className={styles.codePre}><code>{text}</code></pre>
    </div>
  );
}

// ─── MethodBadge ──────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const cfg = METHOD_CONFIG[method.toLowerCase()] || METHOD_CONFIG.get;
  return (
    <span className={styles.methodBadge} style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ─── SchemaTable ──────────────────────────────────────────────────────────────

function SchemaTable({ spec, schema, required = [] }: { spec: OpenAPISpec; schema: SchemaObject; required?: string[] }) {
  const resolved = resolveSchema(spec, schema);
  if (!resolved) return <span className={styles.emptyNote}>No schema</span>;

  if (resolved.properties) {
    const props = resolved.properties;
    const req = resolved.required || required;
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.schemaTable}>
          <thead>
            <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
          </thead>
          <tbody>
            {Object.entries(props).map(([name, propSchema]) => {
              const r2 = resolveSchema(spec, propSchema) || propSchema;
              return (
                <tr key={name}>
                  <td><code className={styles.fieldName}>{name}</code></td>
                  <td><span className={styles.typeTag}>{getSchemaType(r2)}</span></td>
                  <td>{req.includes(name) ? <span className={styles.requiredBadge}>required</span> : <span className={styles.optionalBadge}>optional</span>}</td>
                  <td className={styles.descCell}>{r2.description || (r2.example !== undefined ? `e.g. ${JSON.stringify(r2.example)}` : '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (resolved.type === 'array' && resolved.items) {
    const items = resolveSchema(spec, resolved.items);
    if (items?.properties) return <SchemaTable spec={spec} schema={items} />;
  }

  if (resolved.$ref) return <span className={styles.refTag}>{resolved.$ref.split('/').pop()}</span>;

  return <span className={styles.typeTag}>{getSchemaType(resolved)}</span>;
}

// ─── ParametersSection ────────────────────────────────────────────────────────

function ParametersSection({ spec, parameters }: { spec: OpenAPISpec; parameters: ParameterObject[] }) {
  const grouped = { path: [] as ParameterObject[], query: [] as ParameterObject[], header: [] as ParameterObject[] };
  for (const p of parameters) {
    const resolved: ParameterObject = p.$ref ? (resolveRef(spec, p.$ref) || p) : p;
    if (resolved.in === 'path') grouped.path.push(resolved);
    else if (resolved.in === 'query') grouped.query.push(resolved);
    else if (resolved.in === 'header' && resolved.name !== 'X-Api-Version') grouped.header.push(resolved);
  }

  const all = [...grouped.path, ...grouped.query, ...grouped.header];
  if (all.length === 0) return <p className={styles.emptyNote}>No parameters</p>;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.schemaTable}>
        <thead>
          <tr><th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          {all.map(p => (
            <tr key={`${p.in}-${p.name}`}>
              <td><code className={styles.fieldName}>{p.name}</code></td>
              <td><span className={styles.inBadge} data-in={p.in}>{p.in}</span></td>
              <td><span className={styles.typeTag}>{p.schema ? getSchemaType(resolveSchema(spec, p.schema) || p.schema) : 'string'}</span></td>
              <td>{p.required ? <span className={styles.requiredBadge}>required</span> : <span className={styles.optionalBadge}>optional</span>}</td>
              <td className={styles.descCell}>{p.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ResponsesSection ─────────────────────────────────────────────────────────

function ResponsesSection({ spec, responses }: { spec: OpenAPISpec; responses: Record<string, ResponseObject> }) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  return (
    <div className={styles.responsesList}>
      {Object.entries(responses).map(([code, resp]) => {
        const resolvedResp: ResponseObject = resp.$ref ? (resolveRef(spec, resp.$ref) || resp) : resp;
        const color = STATUS_COLOR(code);
        const examples = getResponseExamples(spec, resolvedResp);
        const isOpen = openCode === code;
        const hasExamples = examples !== null;

        return (
          <div key={code} className={styles.responseItem}>
            <button
              className={`${styles.responseHeader} ${hasExamples ? styles.responseHeaderClickable : ''}`}
              onClick={() => hasExamples && setOpenCode(isOpen ? null : code)}
            >
              <span className={styles.statusCode} style={{ background: `${color}18`, borderColor: `${color}40`, color }}>
                {code}
              </span>
              <span className={styles.responseDesc}>{resolvedResp.description || '—'}</span>
              {hasExamples && (
                <svg className={`${styles.chevronSmall} ${isOpen ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>
            {isOpen && examples && (
              <div className={styles.responseExample}>
                {examples.map((ex, i) => (
                  <div key={i} className={styles.namedExample}>
                    {ex.summary && <div className={styles.exampleName}>{ex.summary}</div>}
                    <CodeBlock value={ex.value} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SecurityBadges ───────────────────────────────────────────────────────────

function SecurityBadges({ spec, security }: { spec: OpenAPISpec; security: Array<Record<string, string[]>> }) {
  if (!security || security.length === 0) return <span className={styles.noAuthBadge}>No authentication required</span>;
  const schemes = security.flatMap(s => Object.keys(s));
  return (
    <div className={styles.securityBadges}>
      {schemes.map(name => (
        <span key={name} className={styles.securityBadge}>
          {name === 'bearerAuth' ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              JWT Bearer
            </>
          ) : name === 'mgmtAuth' ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              X-Mgmt-Token
            </>
          ) : (
            <>{spec.components?.securitySchemes?.[name]?.type || name}</>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── TryItOut ─────────────────────────────────────────────────────────────────

function TryItOut({ spec, endpoint }: { spec: OpenAPISpec; endpoint: ParsedEndpoint }) {
  const { method, path, operation } = endpoint;
  const serverUrl = spec.servers?.[0]?.url || '/api';
  const pathParams = extractPathParams(path);
  const queryParams = (operation.parameters || [])
    .map(p => (p.$ref ? resolveRef(spec, p.$ref) : p) as ParameterObject)
    .filter(p => p?.in === 'query');

  const defaultBody = getRequestBodyExample(spec, operation.requestBody);
  const defaultBodyStr = defaultBody !== null ? JSON.stringify(defaultBody, null, 2) : '';

  const [token, setToken] = useState('');
  const [apiVersion, setApiVersion] = useState(spec.info.version || '1.0.0');
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(defaultBodyStr);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TryResponse | null>(null);
  const [bodyError, setBodyError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('fiber_auth_token') || '');
    }
  }, []);

  const buildUrl = useCallback(() => {
    let url = `${API_BASE}${serverUrl}${path}`;
    for (const [k, v] of Object.entries(pathValues)) {
      url = url.replace(`{${k}}`, encodeURIComponent(v) || `{${k}}`);
    }
    const qs = Object.entries(queryValues)
      .filter(([, v]) => v.trim() !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
    return url;
  }, [serverUrl, path, pathValues, queryValues]);

  const execute = async () => {
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      try { JSON.parse(body); setBodyError(''); } catch { setBodyError('Invalid JSON — check syntax'); return; }
    }
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'X-API-Version': apiVersion.trim()
      };
      if (token.trim()) headers['Authorization'] = `Bearer ${token.trim()}`;
      const fetchOptions: RequestInit = { method: method.toUpperCase(), headers };
      if (body.trim() && !['GET', 'HEAD'].includes(method.toUpperCase())) {
        fetchOptions.body = body;
      }
      const res = await fetch(buildUrl(), fetchOptions);
      const time = Date.now() - start;
      let resBody: any;
      try { resBody = await res.json(); } catch { resBody = await res.text(); }
      setResponse({ status: res.status, statusText: res.statusText, time, body: resBody });
    } catch (err: any) {
      const time = Date.now() - start;
      setResponse({ status: 0, statusText: 'Network Error', time, body: null, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const hasBody = !!operation.requestBody && !['GET', 'HEAD'].includes(method.toUpperCase());
  const cfg = METHOD_CONFIG[method.toLowerCase()] || METHOD_CONFIG.get;

  return (
    <div className={styles.tryItOut}>
      {/* Auth Token */}
      <div className={styles.trySection}>
        <label className={styles.tryLabel}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Bearer Token
        </label>
        <input
          className={styles.tryInput}
          type="text"
          placeholder="Auto-populated from session — paste a different token to override"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
      </div>

      {/* API Version */}
      <div className={styles.trySection}>
        <label className={styles.tryLabel}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          API Version (X-API-Version)
        </label>
        <input
          className={styles.tryInput}
          type="text"
          placeholder="e.g. 1.0.0"
          value={apiVersion}
          onChange={e => setApiVersion(e.target.value)}
        />
      </div>

      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <div className={styles.trySection}>
          <label className={styles.tryLabel}>Path Parameters</label>
          <div className={styles.tryParams}>
            {pathParams.map(param => (
              <div key={param} className={styles.tryParamRow}>
                <span className={styles.tryParamName}>{param}</span>
                <input
                  className={styles.tryInput}
                  type="text"
                  placeholder={`{${param}}`}
                  value={pathValues[param] || ''}
                  onChange={e => setPathValues(prev => ({ ...prev, [param]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Parameters */}
      {queryParams.length > 0 && (
        <div className={styles.trySection}>
          <label className={styles.tryLabel}>Query Parameters</label>
          <div className={styles.tryParams}>
            {queryParams.map(p => (
              <div key={p.name} className={styles.tryParamRow}>
                <div className={styles.tryParamNameWrap}>
                  <span className={styles.tryParamName}>{p.name}</span>
                  {p.required && <span className={styles.requiredBadge}>req</span>}
                </div>
                <input
                  className={styles.tryInput}
                  type="text"
                  placeholder={p.schema?.example !== undefined ? String(p.schema.example) : (p.description || '')}
                  value={queryValues[p.name] || ''}
                  onChange={e => setQueryValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Body */}
      {hasBody && (
        <div className={styles.trySection}>
          <div className={styles.tryLabelRow}>
            <label className={styles.tryLabel}>Request Body</label>
            {bodyError && <span className={styles.tryBodyError}>{bodyError}</span>}
          </div>
          <textarea
            className={`${styles.tryTextarea} ${bodyError ? styles.tryTextareaError : ''}`}
            value={body}
            onChange={e => { setBody(e.target.value); setBodyError(''); }}
            rows={10}
            spellCheck={false}
            placeholder='{ "key": "value" }'
          />
        </div>
      )}

      {/* URL Preview */}
      <div className={styles.tryUrlRow}>
        <span className={styles.methodBadge} style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
          {method.toUpperCase()}
        </span>
        <code className={styles.tryUrl}>{buildUrl()}</code>
      </div>

      {/* Execute Button */}
      <button className={styles.executeBtn} onClick={execute} disabled={loading}>
        {loading ? (
          <><div className={styles.spinnerSm} />Executing…</>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Execute
          </>
        )}
      </button>

      {/* Response */}
      {response && (
        <div className={styles.tryResponse}>
          <div className={styles.tryResponseMeta}>
            <span
              className={styles.statusCode}
              style={(() => { const c = STATUS_COLOR(response.status); return { background: `${c}18`, borderColor: `${c}40`, color: c }; })()}
            >
              {response.status || 'ERR'}
            </span>
            <span className={styles.responseDesc}>{response.statusText}</span>
            <span className={styles.tryTiming}>{response.time}ms</span>
          </div>
          {response.error ? (
            <div className={styles.tryNetworkError}>{response.error}</div>
          ) : (
            <CodeBlock value={response.body} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── EndpointCard ─────────────────────────────────────────────────────────────

function EndpointCard({ spec, endpoint, expanded, onToggle }: {
  spec: OpenAPISpec;
  endpoint: ParsedEndpoint;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'docs' | 'try'>('docs');
  const { method, path, operation } = endpoint;
  const cfg = METHOD_CONFIG[method.toLowerCase()] || METHOD_CONFIG.get;

  const hasBody = !!operation.requestBody;
  const hasResponses = Object.keys(operation.responses || {}).length > 0;
  const bodyExample = hasBody ? getRequestBodyExample(spec, operation.requestBody) : null;

  return (
    <div className={`${styles.endpointCard} ${expanded ? styles.expanded : ''}`} style={{ borderLeftColor: cfg.color }}>
      <button className={styles.endpointHeader} onClick={onToggle}>
        <MethodBadge method={method} />
        <code className={styles.endpointPath}>{path}</code>
        {operation.deprecated && <span className={styles.deprecatedBadge}>deprecated</span>}
        <span className={styles.endpointSummary}>{operation.summary || ''}</span>
        <svg className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className={styles.endpointBody}>
          {/* Tab Bar */}
          <div className={styles.endpointTabs}>
            <button
              className={`${styles.endpointTab} ${activeTab === 'docs' ? styles.endpointTabActive : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Documentation
            </button>
            <button
              className={`${styles.endpointTab} ${activeTab === 'try' ? styles.endpointTabActive : ''}`}
              onClick={() => setActiveTab('try')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Try it out
            </button>
          </div>

          {activeTab === 'docs' ? (
            <div className={styles.docsTab}>
              {operation.description && (
                <p className={styles.endpointDescription}>{operation.description}</p>
              )}

              {/* Authentication */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Authentication
                </div>
                <SecurityBadges spec={spec} security={operation.security || []} />
              </div>

              {/* Parameters */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Parameters
                </div>
                <ParametersSection spec={spec} parameters={operation.parameters || []} />
              </div>

              {/* Request Body */}
              {hasBody && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Request Body
                    {operation.requestBody?.required && (
                      <span className={styles.requiredBadge} style={{ marginLeft: '0.5rem' }}>required</span>
                    )}
                  </div>
                  {operation.requestBody?.description && (
                    <p className={styles.sectionNote}>{operation.requestBody.description}</p>
                  )}
                  {operation.requestBody?.content && (() => {
                    const ct = Object.values(operation.requestBody.content!)[0];
                    return ct?.schema ? <SchemaTable spec={spec} schema={ct.schema} /> : null;
                  })()}
                  {bodyExample !== null && (
                    <div className={styles.exampleBlock}>
                      <div className={styles.exampleBlockLabel}>Example Request</div>
                      <CodeBlock value={bodyExample} />
                    </div>
                  )}
                </div>
              )}

              {/* Responses */}
              {hasResponses && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Responses
                    <span className={styles.clickHint}>click status code to see example</span>
                  </div>
                  <ResponsesSection spec={spec} responses={operation.responses!} />
                </div>
              )}
            </div>
          ) : (
            <TryItOut spec={spec} endpoint={endpoint} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApiDocsViewer() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>('');
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/docs/spec`);
        if (!res.ok) throw new Error(`HTTP ${res.status} — Failed to fetch API spec`);
        const data: OpenAPISpec = await res.json();
        setSpec(data);
        const endpoints = parseEndpoints(data);
        setActiveTag(endpoints[0]?.tag || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load API documentation');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpec();
  }, []);

  const { endpoints, tags } = useMemo(() => {
    if (!spec) return { endpoints: [], tags: [] };
    const all = parseEndpoints(spec);
    const tagSet = new Set<string>();
    for (const e of all) tagSet.add(e.tag);
    return { endpoints: all, tags: Array.from(tagSet) };
  }, [spec]);

  const visibleEndpoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return endpoints.filter(e => {
      const matchesTag = !activeTag || e.tag === activeTag;
      const matchesSearch = !q
        || e.path.toLowerCase().includes(q)
        || (e.operation.summary || '').toLowerCase().includes(q)
        || e.method.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });
  }, [endpoints, activeTag, search]);

  const selectTag = useCallback((tag: string) => {
    setActiveTag(tag);
    setSearch('');
    setMobileMenuOpen(false);
    setExpandedKey(null);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Fetching API specification…</p>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className={styles.errorState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Unable to load API documentation</h3>
        <p>{error || 'Unknown error'}</p>
        <p className={styles.errorHint}>Make sure the backend is running at <code>{API_BASE}</code></p>
      </div>
    );
  }

  const serverUrl = spec.servers?.[0]?.url || '/api';

  return (
    <div className={styles.viewer}>
      {/* Info Bar */}
      <div className={styles.infoBar}>
        <div className={styles.infoLeft}>
          <div className={styles.apiTitle}>
            <span className={styles.apiTitleText}>{spec.info.title}</span>
            <span className={styles.apiVersion}>v{spec.info.version}</span>
            <span className={styles.oasBadge}>OAS 3.0</span>
          </div>
          {spec.info.description && <p className={styles.apiDescription}>{spec.info.description}</p>}
        </div>
        <div className={styles.infoRight}>
          <div className={styles.serverBlock}>
            <span className={styles.serverLabel}>Base URL</span>
            <code className={styles.serverUrl}>{API_BASE}{serverUrl}</code>
          </div>
          <div className={styles.authSchemes}>
            {Object.entries(spec.components?.securitySchemes || {}).map(([name, scheme]) => (
              <div key={name} className={styles.authScheme}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>{name === 'bearerAuth' ? 'JWT Bearer' : name === 'mgmtAuth' ? 'X-Mgmt-Token' : name}</span>
                <span className={styles.schemeType}>{scheme.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(true)} title="Browse resources">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by path, method, or summary…"
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <span className={styles.endpointCount}>{visibleEndpoints.length} endpoints</span>
      </div>

      {/* Mobile Tag Pills */}
      <div className={styles.mobilePills}>
        {tags.map(tag => (
          <button
            key={tag}
            className={`${styles.mobilePill} ${activeTag === tag ? styles.mobilePillActive : ''}`}
            onClick={() => selectTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={styles.drawerOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Resources</span>
              <button className={styles.drawerClose} onClick={() => setMobileMenuOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.drawerBody}>
              {tags.map(tag => {
                const count = endpoints.filter(e => e.tag === tag).length;
                return (
                  <button
                    key={tag}
                    className={`${styles.tagBtn} ${activeTag === tag ? styles.tagBtnActive : ''}`}
                    onClick={() => selectTag(tag)}
                  >
                    <span className={styles.tagName}>{tag}</span>
                    <span className={styles.tagCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Two-Panel Body */}
      <div className={styles.body}>
        {/* Desktop Tag Sidebar */}
        <nav className={styles.tagSidebar}>
          <div className={styles.tagSidebarTitle}>Resources</div>
          {tags.map(tag => {
            const count = endpoints.filter(e => e.tag === tag).length;
            return (
              <button
                key={tag}
                className={`${styles.tagBtn} ${activeTag === tag ? styles.tagBtnActive : ''}`}
                onClick={() => selectTag(tag)}
              >
                <span className={styles.tagName}>{tag}</span>
                <span className={styles.tagCount}>{count}</span>
              </button>
            );
          })}
          <div className={styles.methodLegend}>
            <div className={styles.tagSidebarTitle} style={{ marginTop: '1.5rem' }}>Methods</div>
            {Object.entries(METHOD_CONFIG).map(([method, cfg]) => (
              <div key={method} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: cfg.color }} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Endpoint List */}
        <div className={styles.endpointList}>
          {activeTag && !search && (
            <div className={styles.tagHeader}>
              <h2 className={styles.tagTitle}>{activeTag}</h2>
              <span className={styles.tagSubtitle}>{visibleEndpoints.length} endpoint{visibleEndpoints.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {search && (
            <div className={styles.tagHeader}>
              <h2 className={styles.tagTitle}>Search results</h2>
              <span className={styles.tagSubtitle}>{visibleEndpoints.length} match{visibleEndpoints.length !== 1 ? 'es' : ''} for &ldquo;{search}&rdquo;</span>
            </div>
          )}
          {visibleEndpoints.length === 0 ? (
            <div className={styles.emptyEndpoints}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No endpoints found{search ? ` for "${search}"` : ''}.</p>
            </div>
          ) : (
            visibleEndpoints.map(ep => (
              <EndpointCard
                key={ep.key}
                spec={spec}
                endpoint={ep}
                expanded={expandedKey === ep.key}
                onToggle={() => setExpandedKey(k => k === ep.key ? null : ep.key)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
