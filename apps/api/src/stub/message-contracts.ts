export interface PersonalMessage {
  readonly id: string;
  readonly createdLocal: string;
  readonly subject: string;
  readonly text: string;
  readonly note: string | null;
  readonly isRead: boolean | null;
  readonly type: 'OFFER_REPLACE' | 'REJECT_OFFER' | 'ACCEPT_OFFER' | 'CANCEL_OFFER' | null;
}

export type MessageReadStatus = 'all' | 'unread' | 'read' | 'unknown';
