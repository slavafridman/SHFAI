import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { MessageReadStatus, PersonalMessage } from '../../../api/src/stub/message-contracts';
import { local, metadata, record, StubContractError, synthetic } from './stub-response';

export type { MessageReadStatus, PersonalMessage };

function message(value: unknown): value is PersonalMessage {
  return record(value) && typeof value['id'] === 'string' && /^[1-9]\d{0,37}$/.test(value['id'])
    && local(value['createdLocal']) && typeof value['subject'] === 'string' && typeof value['text'] === 'string'
    && (value['note'] === null || typeof value['note'] === 'string')
    && (value['isRead'] === null || typeof value['isRead'] === 'boolean')
    && (value['type'] === null || (typeof value['type'] === 'string'
      && ['OFFER_REPLACE', 'REJECT_OFFER', 'ACCEPT_OFFER', 'CANCEL_OFFER'].includes(value['type'])));
}

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private readonly http = inject(HttpClient);

  initialize() {
    return this.http.get<unknown>('/api/v1/me/capabilities').pipe(map(value => {
      if (!synthetic(value) || !record(value['personalMessages'])
        || !record(value['personalMessages']['read']) || value['personalMessages']['read']['enabled'] !== true) {
        throw new StubContractError();
      }
      return true;
    }));
  }

  list(status: MessageReadStatus) {
    return this.http.get<unknown>('/api/v1/me/messages', { params: { status, limit: '100' } }).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !Array.isArray(value['items'])
        || value['items'].length > 100 || !value['items'].every(message) || value['nextCursor'] !== null) {
        throw new StubContractError();
      }
      return { items: value['items'], fetchedAt: String(value['fetchedAt']) };
    }));
  }

  detail(id: string) {
    return this.http.get<unknown>(`/api/v1/me/messages/${encodeURIComponent(id)}`).pipe(map(value => {
      if (!synthetic(value) || !metadata(value) || !message(value['item']) || value['item'].id !== id) {
        throw new StubContractError();
      }
      return value['item'];
    }));
  }
}
