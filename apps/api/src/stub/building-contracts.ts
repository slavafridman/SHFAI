export interface DemoBuilding {
  readonly id: string;
  readonly name: string;
  readonly orgUnit: { readonly id: string; readonly name: string };
  readonly address: string | null;
  readonly seatCapacity: number | null;
}
