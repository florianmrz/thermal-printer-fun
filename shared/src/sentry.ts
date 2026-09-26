type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type SentryWebhookPayload = DeepPartial<SentryEvent>;
export type SentryLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export interface SentryBreadcrumb {
  category: string;
  data?: { [key: string]: any };
  level: string;
  message?: string;
  timestamp: number;
  type: string;
}

export interface SentryStackFrame {
  abs_path: string | null;
  addr_mode: string | null;
  colno: number | null;
  context_line: string | null;
  data: { [key: string]: any } | null;
  errors: any | null;
  filename: string | null;
  function: string | null;
  image_addr: string | null;
  in_app: boolean;
  instruction_addr: string | null;
  lineno: number | null;
  lock: string | null;
  module: string | null;
  package: string | null;
  parent_index: number | null;
  platform: string | null;
  post_context: string[];
  pre_context: string[];
  raw_function: string | null;
  sample_count: number | null;
  source_link: string | null;
  symbol: string | null;
  symbol_addr: string | null;
  trust: string | null;
  vars: { [key: string]: any };
}

export interface SentryExceptionValue {
  stacktrace: {
    frames: SentryStackFrame[];
  };
  type: string;
  value: string;
}

export interface SentryRequest {
  api_target: string | null;
  cookies: [string, string][];
  data: { [key: string]: any };
  env: { [key: string]: string };
  fragment: string | null;
  headers: [string, string][];
  inferred_content_type: string;
  method: string;
  query_string: [string, string][];
  url: string;
}

export interface SentryContext {
  type: string;
  [key: string]: any;
}

export interface SentryEvent {
  event_id: string;
  project: number;
  release: string | null;
  dist: string | null;
  platform: string;
  message: string;
  datetime: string;
  tags: [string, string][];
  _meta: { [key: string]: any };
  _metrics: { [key: string]: number };
  _ref: number;
  _ref_version: number;
  breadcrumbs: {
    values: SentryBreadcrumb[];
  };
  contexts: { [key: string]: SentryContext };
  culprit: string;
  exception: {
    values: SentryExceptionValue[];
  };
  extra: { [key: string]: any };
  fingerprint: string[];
  grouping_config: {
    enhancements: string;
    id: string;
  };
  hashes: string[];
  level: SentryLevel;
  location: string | null;
  logentry: {
    formatted: string;
    message: string | null;
    params: any[] | null;
  };
  logger: string;
  metadata: {
    filename?: string;
    function?: string;
    in_app_frame_mix?: string;
    type?: string;
    value?: string;
    title?: string;
    [key: string]: any;
  };
  modules: { [key: string]: string };
  nodestore_insert: number;
  received: number;
  request: SentryRequest;
  timestamp: number;
  title: string;
  type: string;
  user: {
    email: string;
    id: string;
    ip_address: string;
    sentry_user: string;
    username?: string;
    name?: string;
  };
  version: string;
  url: string;
  web_url: string;
  issue_url: string;
  issue_id: string;
}