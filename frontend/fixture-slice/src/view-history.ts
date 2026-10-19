import { Injectable, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ListNavigation } from './list-navigation';

type Slots = Pick<ListNavigation, 'origin' | 'searchOrigin' | 'schedule' | 'scheduleDetail' |
  'detailOrigin' | 'scheduleUpstream'>;
interface Entry {
  itemsJourney: boolean;
  path: string;
  parent: string | null;
  slots: Slots;
  view: { scroll: number; horizontal: number; opener: string; disclosures: Array<{ key: string; open: boolean }> } | null;
  local: unknown;
}
/** Volatile history metadata, never an authorization/result cache. Only opaque
 * random tokens enter history.state; all context stays in this service. */
@Injectable({ providedIn: 'root' })
export class ViewHistory {
  private readonly router = inject(Router);
  private readonly nav = inject(ListNavigation);
  private readonly entries = new Map<string, Entry>();
  private current: string | null = null;
  private target: string | null = null;
  private popping = false;
  private restoration: string | null = null;
  private host: HTMLElement | null = null;
  private local: (() => unknown) | null = null;
  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.save();
        this.popping = event.navigationTrigger === 'popstate';
        const token: unknown = event.restoredState?.['shfView'];
        this.target = typeof token === 'string' && this.entries.get(token)?.path === event.url ? token : null;
        if (this.target) {
          Object.assign(this.nav, structuredClone(this.entries.get(this.target)!.slots));
          this.nav.returning = true;
        }
      }
      if (event instanceof NavigationEnd) {
        const token = this.target ?? crypto.randomUUID();
        if (!this.entries.has(token)) this.entries.set(token, {
          itemsJourney: /\/(breaks-and-exceptions|operational-card)$/.test(event.urlAfterRedirects) ||
            !!(this.current && this.entries.get(this.current)?.itemsJourney),
          path: event.urlAfterRedirects, parent: this.popping ? null : this.current,
          slots: this.slots(), view: null, local: null,
        });
        this.current = token; this.target = null;
        if (/\/(breaks-and-exceptions|operational-card)$/.test(event.urlAfterRedirects)) {
          let ancestor: string | null = token;
          while (ancestor) {
            const e: Entry | undefined = this.entries.get(ancestor);
            if (!e) break;
            e.itemsJourney = true; ancestor = e.parent;
          }
        }
        this.restoration = this.popping ? token : null;
        // Do not serialize route context, form values, employee names or IDs.
        const origin: unknown = history.state?.origin;
        const provenance = typeof origin === 'string' &&
          ['current-shifts', 'shift-search', 'my-shifts', 'shift-day-diagnostic'].includes(origin) ? { origin } : {};
        history.replaceState({ ...provenance, navigationId: event.id, shfView: token }, '');
      }
    });
  }
  private slots(): Slots {
    const { origin, searchOrigin, schedule, scheduleDetail, detailOrigin, scheduleUpstream } = this.nav;
    return structuredClone({ origin, searchOrigin, schedule, scheduleDetail, detailOrigin, scheduleUpstream });
  }
  private save() {
    const entry = this.current && this.entries.get(this.current);
    if (!entry) return;
    if (this.local) entry.local = structuredClone(this.local());
    entry.slots = this.slots();
    if (this.host) entry.view = {
      scroll: window.scrollY,
      horizontal: this.host.querySelector<HTMLElement>('.table-wrap')?.scrollLeft ?? 0,
      opener: this.host.contains(document.activeElement) ? document.activeElement?.id ?? '' : '',
      disclosures: [...this.host.querySelectorAll('details')].map((d, i) => ({ key: d.id || `index:${i}`, open: d.open })),
    };
  }
  attach(host: HTMLElement, local?: () => unknown) { this.host = host; this.local = local ?? null; }
  saved<T>(): T | null {
    const key = this.target;
    const entry = key ? this.entries.get(key) : undefined;
    return entry?.local as T ?? null;
  }
  restore(host: HTMLElement): boolean {
    if (this.restoration !== this.current) return false;
    const entry = this.current && this.entries.get(this.current), view = entry && entry.view;
    if (!view || !entry || !entry.itemsJourney) return false;
    this.restoration = null;
    [...host.querySelectorAll('details')].forEach((d, i) => {
      d.open = view.disclosures.find(v => v.key === (d.id || `index:${i}`))?.open ?? false;
    });
    const table = host.querySelector<HTMLElement>('.table-wrap');
    if (table) table.scrollLeft = view.horizontal;
    const opener = view.opener ? document.getElementById(view.opener) : null;
    (opener && host.contains(opener) && opener.getClientRects().length ? opener : host.querySelector<HTMLElement>('h1'))
      ?.focus({ preventScroll: true });
    window.scrollTo(0, view.scroll);
    return true;
  }
  parentPath(): string | null {
    const parent = this.current && this.entries.get(this.current)?.parent;
    return parent ? this.entries.get(parent)?.path ?? null : null;
  }
  back(fallback = '/current-shifts') {
    if (this.parentPath()) history.back();
    else void this.router.navigateByUrl(fallback);
  }
  backIf(path: string): boolean {
    if (!this.current || !this.entries.get(this.current)?.itemsJourney) return false;
    if (this.parentPath() !== path) return false;
    history.back(); return true;
  }
}
