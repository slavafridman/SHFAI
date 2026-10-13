import type { PersonalMessage } from './message-contracts.js';

export function syntheticPersonalMessages(employeeId: string): readonly PersonalMessage[] {
  const fixtures = [
    {
      employeeId: '00000001', deleted: false,
      message: {
        id: '8007199254740993', createdLocal: '2026-10-17T09:00:00',
        subject: 'הצעת החלפה — הדגמה בלבד', text: 'זו הצעה סינתטית. אין אפשרות לאשר או לדחות אותה.',
        note: null, isRead: false, type: 'OFFER_REPLACE',
      },
    },
    {
      employeeId: '00000001', deleted: false,
      message: {
        id: '8007199254740994', createdLocal: '2026-10-16T08:00:00',
        subject: 'הודעת קבלה היסטורית לדוגמה', text: 'טקסט סינתטי בלבד; אין אישור לפעולה או לתוצאת שותף אמיתית.',
        note: 'מצב הקריאה קבוע בנתוני ההדגמה.', isRead: true, type: 'ACCEPT_OFFER',
      },
    },
    {
      employeeId: '00000001', deleted: false,
      message: {
        id: '8007199254740995', createdLocal: '2026-10-15T07:00:00',
        subject: 'תוכן טקסט ומצב לא ידוע', text: '<img src="synthetic-invalid" onerror="alert(1)"> — זה טקסט, לא HTML.',
        note: null, isRead: null, type: null,
      },
    },
    {
      employeeId: '00000002', deleted: false,
      message: {
        id: '8007199254740996', createdLocal: '2026-10-18T09:00:00',
        subject: 'synthetic-other-recipient', text: 'synthetic-hidden-recipient-text',
        note: null, isRead: false, type: null,
      },
    },
    {
      employeeId: '00000001', deleted: true,
      message: {
        id: '8007199254740997', createdLocal: '2026-10-19T09:00:00',
        subject: 'synthetic-deleted-message', text: 'synthetic-hidden-deleted-text',
        note: null, isRead: false, type: null,
      },
    },
  ] satisfies readonly { employeeId: string; deleted: boolean; message: PersonalMessage }[];
  return fixtures.filter(fixture => fixture.employeeId === employeeId && !fixture.deleted)
    .map(fixture => fixture.message).sort((left, right) => right.createdLocal.localeCompare(left.createdLocal));
}
