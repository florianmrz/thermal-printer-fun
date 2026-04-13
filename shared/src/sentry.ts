type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type SentryWebhookPayload = Payload;

/**
 * The below types were auto-generated based on an example payload and may not be accurate.
 */

interface Payload {
  id: string;
  project: string;
  project_name: string;
  project_slug: string;
  level: string;
  culprit: string;
  message: string;
  url: string;
  triggering_rules: string[];
  // We intentionally make all properties optional, as Sentry's webhook payload can vary based on the event and configuration.
  event: DeepPartial<Event>;
}

interface Event {
  event_id: string;
  level: string;
  version: string;
  type: string;
  fingerprint: string[];
  culprit: string;
  logger: string;
  platform: string;
  timestamp: number;
  received: number;
  environment: string;
  request: Request;
  contexts: Contexts;
  exception: Exception;
  tags: string[][];
  sdk: Sdk;
  key_id: string;
  project: number;
  grouping_config: Groupingconfig;
  scraping_attempts: Scrapingattempt[];
  _metrics: Metrics;
  _dsc: Dsc;
  _ref: number;
  _ref_version: number;
  hashes: string[];
  location: string;
  metadata: Metadata;
  nodestore_insert: number;
  symbolicated_in_app: boolean;
  title: string;
  id: string;
}

interface Metadata {
  filename: string;
  function: string;
  in_app_frame_mix: string;
  type: string;
  value: string;
}

interface Dsc {
  environment: string;
  public_key: string;
  release: null;
  replay_id: null;
  trace_id: string;
  transaction: null;
}

interface Metrics {
  'bytes.ingested.event': number;
  'bytes.stored.event': number;
}

interface Scrapingattempt {
  status: string;
  url: string;
}

interface Groupingconfig {
  enhancements: string;
  id: string;
}

interface Sdk {
  name: string;
  version: string;
  integrations: string[];
  packages: Package[];
}

interface Package {
  name: string;
  version: string;
}

interface Exception {
  values: Value[];
}

interface Value {
  type: string;
  value: string;
  stacktrace: Stacktrace;
  raw_stacktrace: Rawstacktrace;
  mechanism: Mechanism;
}

interface Mechanism {
  type: string;
  handled: boolean;
}

interface Rawstacktrace {
  frames: Frame2[];
}

interface Frame2 {
  function: string;
  filename: string;
  abs_path: string;
  lineno: number;
  colno: number;
  context_line: string;
  in_app: boolean;
  data: Data2;
}

interface Data2 {
  client_in_app: boolean;
}

interface Stacktrace {
  frames: Frame[];
}

interface Frame {
  function: string;
  module: string;
  filename: string;
  abs_path: string;
  lineno: number;
  colno: number;
  context_line: string;
  in_app: boolean;
  data: Data;
}

interface Data {
  client_in_app: boolean;
  symbolicated: boolean;
}

interface Contexts {
  browser: Browser;
  os: Os;
  trace: Trace;
}

interface Trace {
  trace_id: string;
  span_id: string;
  status: string;
  type: string;
}

interface Os {
  os: string;
  name: string;
  version: string;
  type: string;
}

interface Browser {
  browser: string;
  name: string;
  version: string;
  type: string;
}

interface Request {
  url: string;
  query_string: string[][];
  headers: string[][];
}
