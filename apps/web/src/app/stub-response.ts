export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function synthetic(value: unknown): value is Record<string, unknown> {
  return record(value) && value['mode'] === 'stub' && value['synthetic'] === true && value['authenticated'] === false;
}

export function local(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
}

export function metadata(value: Record<string, unknown>): boolean {
  return typeof value['fetchedAt'] === 'string' && Number.isFinite(Date.parse(value['fetchedAt']))
    && value['businessTimeZone'] === 'Asia/Jerusalem';
}

export class StubContractError extends Error {
  constructor() {
    super('תגובת ההדגמה אינה תקינה או אינה מסומנת כנתונים סינתטיים.');
  }
}
