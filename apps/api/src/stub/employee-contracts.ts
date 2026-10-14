export interface DemoEmployee {
  readonly id: string;
  readonly displayName: string;
  readonly orgUnit: { readonly id: string; readonly name: string };
  readonly jobName: string | null;
}

export type EmployeeSection = 'skills' | 'events' | 'education';

export interface DemoEmployeeRecord {
  readonly id: string;
  readonly label: string;
  readonly detail: string | null;
  readonly dateLocal: string | null;
}
