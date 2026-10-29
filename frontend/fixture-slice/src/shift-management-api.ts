import { inject, Injectable } from '@angular/core';
import { HttpClient, type HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from './environments/environment';
import { id, type IdentityResponseV1 } from './contract';
import {
  managementContext, managementIdentity, preparation, csvPreview, receipt, draft, command, canManage,
  type ShiftManagementContextV1, type ShiftDraftV1, type ShiftCommandV1,
  type CsvShiftCommandV1, type CsvShiftEncodingV1, type ReceiptBinding,
} from './shift-management-contract';

/** Transport only. Runtime guards never turn unknown data into an approved DTO. */
@Injectable({ providedIn: 'root' })
export class ShiftManagementApi {
  private readonly http = inject(HttpClient);
  private base(employeeId: string) {
    if (!id(employeeId)) throw Error('Invalid internal selection');
    return `${environment.apiBasePath}/v1/employees/${employeeId}/shift-management`;
  }
  private body(r: HttpResponse<unknown>): unknown {
    if (r.status !== 200 || !/^application\/json(?:;\s*charset=utf-8)?$/i.test(r.headers.get('Content-Type') ?? '') ||
      !r.headers.get('Cache-Control')?.split(',').some(v => v.trim().toLowerCase() === 'no-store') ||
      r.headers.get('X-Content-Type-Options')?.toLowerCase() !== 'nosniff' ||
      new TextEncoder().encode(JSON.stringify(r.body)).length > 2097152) throw Error('Invalid management response');
    return r.body;
  }
  context(p: IdentityResponseV1, employeeId: string, dayId: string | null) {
    if (!managementIdentity(p) || !canManage(p) || dayId !== null && !id(dayId, 10)) throw Error('Unavailable selection');
    return this.http.get<unknown>(this.base(employeeId) + (dayId ? `/shift-days/${dayId}` : '') + '/context',
      { observe: 'response', cache: 'no-store', timeout: 5000 }).pipe(map(r => {
        const v = this.body(r);
        if (!managementContext(v, employeeId, dayId, p)) throw Error('Invalid management context');
        return v;
      }));
  }
  prepare(c: ShiftManagementContextV1, d: ShiftDraftV1) {
    if (!draft(d)) throw Error('Invalid draft');
    return this.http.post<unknown>(this.base(c.employeeId) + '/preparations', { draft: d }, {
      observe: 'response', cache: 'no-store', timeout: 5000, headers: { 'Content-Type': 'application/json' },
    }).pipe(map(r => {
      const v = this.body(r);
      if (!preparation(v, c, d)) throw Error('Invalid preparation');
      return v;
    }));
  }
  preview(c: ShiftManagementContextV1, bytes: ArrayBuffer, encoding: CsvShiftEncodingV1) {
    if (!(bytes instanceof ArrayBuffer) || !bytes.byteLength || bytes.byteLength > 1048576 ||
      !['utf-8', 'windows-1255'].includes(encoding)) throw Error('Invalid CSV framing');
    return this.http.post<unknown>(this.base(c.employeeId) + '/csv-previews', bytes, {
      observe: 'response', cache: 'no-store', timeout: 5000, headers: { 'Content-Type': `text/csv; charset=${encoding}` },
    }).pipe(map(r => {
      const v = this.body(r);
      if (!csvPreview(v, c, encoding)) throw Error('Invalid CSV preview');
      return v;
    }));
  }
  command(c: ShiftManagementContextV1, body: ShiftCommandV1 | CsvShiftCommandV1, binding: ReceiptBinding) {
    const csv = binding.kind === 'csv-create';
    if (!command(body, csv) || body.commandId !== binding.commandId || c.employeeId !== binding.employeeId ||
      c.dataSource !== binding.dataSource) throw Error('Invalid command binding');
    return this.http.post<unknown>(this.base(c.employeeId) + (csv ? '/csv-commands' : '/commands'), body, {
      observe: 'response', cache: 'no-store', timeout: 5000, headers: { 'Content-Type': 'application/json' },
    }).pipe(map(r => {
      const v = this.body(r);
      if (!receipt(v, { ...binding, observedAt: c.serverTime.instant })) throw Error('Invalid receipt');
      return v;
    }));
  }
}
