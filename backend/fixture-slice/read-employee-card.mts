import type { PrincipalV1 } from "./contracts.mts";
import type { EmployeeOperationalCardAccessPolicy, EmployeeOperationalCardReadPort,
  EmployeeOperationalCardRequestV1, EmployeeOperationalCardV1 } from "./employee-card-contracts.mts";
import { decimalId, record, text, validatePrincipal } from "./contract-validation.mts";
import { mokedOption, plainLabel, unitCode } from "./current-shifts-validation.mts";
import { EmployeeCardError } from "./employee-card-errors.mts";
import type { CatalogValueV1 } from "./current-shifts-contracts.mts";

export function invalidCard(name: "employeeId" | "query" | "body",
  reason: "required" | "invalid-format" | "unsupported" = "invalid-format"): never {
  throw new EmployeeCardError("INVALID_REQUEST", [{ name, reason }]);
}
export function validateCardRequest(v: unknown): asserts v is EmployeeOperationalCardRequestV1 {
  if (!record(v)) invalidCard("employeeId", "required");
  if (Object.keys(v).some(k => k !== "employeeId")) invalidCard("query", "unsupported");
  if (!decimalId(v.employeeId)) invalidCard("employeeId",
    v.employeeId === "" || v.employeeId === undefined || v.employeeId === null ? "required" : "invalid-format");
}
export function cardSourceFailure(): never { throw new EmployeeCardError("INVALID_SOURCE_DATA"); }
export function numericCardCode(v: unknown): string | null {
  if (v === null || v === "0" || v === 0) return null;
  if (typeof v !== "string" || !/^-?[1-9][0-9]{0,37}$/.test(v)) cardSourceFailure();
  return v;
}
export function cardLabel(v: unknown): string | null {
  if (v === null || v === "") return null;
  if (typeof v !== "string") cardSourceFailure();
  const label = v.trim();
  if (label === "") return null;
  if (!plainLabel(label, 1)) cardSourceFailure();
  return label;
}
function catalog(v: unknown): CatalogValueV1 | null {
  if (v === null) return null;
  if (!record(v)) cardSourceFailure();
  const code = numericCardCode(v.code);
  if (code === null) cardSourceFailure();
  return { code, label: cardLabel(v.label) };
}
export function projectEmployeeCardRow(v: unknown, employeeId: string, scope: readonly string[]) {
  if (!record(v) || v.employeeId !== employeeId || !decimalId(v.employeeId) ||
      !record(v.employee) || !record(v.employee.unit)) cardSourceFailure();
  const e = v.employee, u = v.employee.unit;
  if (!unitCode(u.code)) cardSourceFailure();
  if (!scope.includes(u.code)) throw new EmployeeCardError("EMPLOYEE_NOT_FOUND");
  if (!text(e.firstName, 40, 1) || /\p{Cc}/u.test(e.firstName) ||
      !text(e.lastName, 40, 1) || /\p{Cc}/u.test(e.lastName) ||
      !plainLabel(u.label, 1) || !mokedOption(u.moked) || u.code === u.moked.code) cardSourceFailure();
  return { employeeId: v.employeeId, employee: {
    firstName: e.firstName, lastName: e.lastName,
    unit: { code: u.code, label: u.label,
      moked: { code: u.moked.code, label: u.moked.label, unitType: "G01" as const } },
    job: catalog(e.job), innerJob: catalog(e.innerJob),
  } };
}
export class GetEmployeeOperationalCard {
  private readonly reader: EmployeeOperationalCardReadPort;
  private readonly policy: EmployeeOperationalCardAccessPolicy;
  private readonly zone: string;
  private readonly source: EmployeeOperationalCardReadPort["dataSource"];
  constructor(reader: EmployeeOperationalCardReadPort, policy: EmployeeOperationalCardAccessPolicy, zone: string) {
    this.reader = reader; this.policy = policy; this.zone = zone; this.source = reader.dataSource;
    if (!["isolated-fixture", "oracle-read-only"].includes(this.source)) throw new Error("Card source required");
  }
  async execute(p: PrincipalV1, request: EmployeeOperationalCardRequestV1,
    signal?: AbortSignal): Promise<EmployeeOperationalCardV1> {
    validatePrincipal(p); validateCardRequest(request);
    this.policy.requireEmployeeRead(p);
    if (!this.policy.canReadSelectedEmployee(p, request.employeeId)) throw new EmployeeCardError("FORBIDDEN");
    const exactTeamIds = Object.freeze([...this.policy.authorizedEmployeeTeamIds(p)]);
    if (exactTeamIds.length > 100 || new Set(exactTeamIds).size !== exactTeamIds.length ||
        !exactTeamIds.every(unitCode)) cardSourceFailure();
    signal?.throwIfAborted();
    if (!exactTeamIds.length) throw new EmployeeCardError("EMPLOYEE_NOT_FOUND");
    const result: unknown = await this.reader.read({ employeeId: request.employeeId, exactTeamIds },
      signal ?? new AbortController().signal);
    signal?.throwIfAborted();
    if (this.reader.dataSource !== this.source || !record(result)) cardSourceFailure();
    if (result.kind === "not-found") throw new EmployeeCardError("EMPLOYEE_NOT_FOUND");
    if (result.kind === "ambiguous-employee") throw new EmployeeCardError("AMBIGUOUS_EMPLOYEE");
    if (result.kind !== "one") cardSourceFailure();
    const row = projectEmployeeCardRow(result.row, request.employeeId, exactTeamIds);
    return { employeeId: row.employeeId, employee: row.employee, businessTimeZone: this.zone, dataSource: this.source };
  }
}
