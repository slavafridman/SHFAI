import { Injectable, inject } from '@angular/core';
import { NativeCommandSession } from './native-command-session';
import type { ArrivalSelection } from './stage-arrival-contract';
import { uuid } from './stage-arrival-contract';

/** No grant, retry, reset or persisted preparation. Native attempts retain the
 * existing all-kind UNKNOWN marker, including after proven completion/rollback.
 * The backend fence remains authoritative. Fixture attempts stay volatile. */
@Injectable({ providedIn: 'root' })
export class StationExitCancellationSession {
  private readonly global = inject(NativeCommandSession);
  selection: ArrivalSelection | null = null;
  private readonly fixtureAttempts = new Set<string>();
  blocked(s: ArrivalSelection | null) {
    if (!s) return false;
    return this.global.affectsEmployee(s.employeeId) ||
      (s.dataSource === 'oracle-test' ? this.global.cancellationUnavailable(s.employeeId) :
        this.fixtureAttempts.has(s.employeeId));
  }
  begin(s: ArrivalSelection, commandId: string) {
    if (!uuid(commandId) || this.blocked(s)) return false;
    if (s.dataSource === 'oracle-test') return this.global.begin(s.employeeId, commandId);
    this.fixtureAttempts.add(s.employeeId); return true;
  }
}
