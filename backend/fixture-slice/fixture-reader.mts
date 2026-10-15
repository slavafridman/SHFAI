import type { EmployeeShiftDayReader, RawShiftDay, ShiftDayReadResult } from "./contracts.mts";

// Isolated test double: source-column-shaped joined rows only, never a live adapter.
export class FixtureReader implements EmployeeShiftDayReader {
  readonly dataSource = "isolated-fixture" as const;
  private readonly rows: RawShiftDay[];
  constructor(rows: RawShiftDay[]) {
    this.rows = structuredClone(rows);
    // Emulate Oracle empty VARCHAR2 -> null at the adapter boundary ONLY.
    // No whitespace trimming, numeric/date repair, or normalization of bad source IDs.
    for (const row of this.rows) {
      if (row.baselineActivityData === "") row.baselineActivityData = null;
      if (row.changedActivityData === "") row.changedActivityData = null;
    }
  }
  async readByDayId(shiftDayId: string): Promise<ShiftDayReadResult> {
    const matches: RawShiftDay[] = [];
    for (const row of this.rows) {
      if (row.shiftDayId === shiftDayId) matches.push(row);
      if (matches.length === 2) return { kind: "ambiguous" };
    }
    return matches.length === 0 ? { kind: "not-found" }
      : { kind: "one", row: structuredClone(matches[0]) };
  }
}
