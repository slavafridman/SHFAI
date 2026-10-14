export interface DemoEmployee {
  readonly id: string;
  readonly displayName: string;
  readonly orgUnit: { readonly id: string; readonly name: string };
  readonly jobName: string | null;
}
