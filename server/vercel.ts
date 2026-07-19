import type { IncomingMessage, ServerResponse } from 'node:http';

export interface VercelRequest extends IncomingMessage {
  body: any;
  query: Record<string, string | string[] | undefined>;
}

export interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}
