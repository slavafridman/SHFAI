# SHF Web Synthetic Personal Shifts

Standalone Angular 22.2.2 with Angular Material/CDK and Material 3. This is a
local Hebrew/RTL demonstration backed by the explicitly synthetic API, not a
connected Oracle workforce application. Real authentication, business data and
production API/UI approval remain pending.

Run these commands from the repository root:

```powershell
npm run dev:api:stub
```

In a separate terminal:

```powershell
npm run dev:web
npm test --workspace=shf-web
npm run typecheck --workspace=shf-web
npm run build --workspace=shf-web
```

The development server binds to `http://127.0.0.1:4200`; its
[local proxy](proxy.conf.json) forwards `/api/**` to the stub API on port 3000.
When 4200 is occupied, use `npm start --workspace=shf-web -- --port 4201` rather
than terminating an existing user process. If changing the API port, update the
local proxy explicitly. No broad CORS policy was added.

Tests use Angular's
Vitest builder and jsdom; they do not prove real-browser accessibility or live
integration behavior. No end-to-end runner is installed.

The shell uses Hebrew document language, RTL layout, isolated Latin labels,
semantic landmarks, a keyboard skip link, logical CSS properties and a locally
rendered Material theme. It does not download fonts. The
[API client](src/app/shifts-api.ts) consumes existing shared DTO types through
type-only imports and validates explicit synthetic/unauthenticated response
markers. It never falls back to hard-coded UI data or enables real data access.

The [personal-shifts screen](src/app/personal-shifts.ts) supports inclusive date
filters (one through 31 days), loading, empty/error/retry states, bounded read-only
results, split/home-work detail and baseline redaction. Fixed demonstration dates
are October 14-17, 2026. It preserves local wall-time strings without converting
them through the browser time zone; the read timestamp is displayed explicitly
as a UTC technical value. No identity or permission authority is stored in browser
storage. Prior list/detail subscriptions are cancelled on filter replacement.

The responsive table may scroll horizontally within its labelled keyboard-
focusable region; surrounding content reflows at narrow widths. Detail is an
inline semantic region, with heading focus on opening and invoking-row focus
restored on closing. All actions are reads; sign-in, writes and partners remain
unavailable.

Executed checks on 2026-10-13: 11 Angular tests passed, plus full workspace lint,
types, 53 backend tests and both production builds. Browser verification against
the actual local stub passed three-row load, date filtering, empty/invalid states,
synthetically injected dependency failure and retry, skip-link/detail focus,
320/768/1280 CSS pixel reflow and 200% text resizing. Manual Hebrew screen-reader
and full WCAG assessment remain not run.

## Expanded Edge Fixtures

The default range now returns five permitted synthetic shifts:

| ID | Demonstration |
| --- | --- |
| `9007199254740993` | Original October 14 daytime shift. |
| `9007199254740994` | October 15 split/home-work override. |
| `9007199254740995` | October 16 incoming reassignment with redacted baseline. |
| `9007199254740998` | October 16 23:00 through October 17 06:00, local wall times. |
| `9007199254740999` | October 17 unknown/null site, activity, home-work and split fields; no baseline. |

Foreign-owner, excluded and outgoing-reassignment fixtures are not listed.
The table marks an end on a different date, and detail displays complete local
start/end values without calculating an instant/duration. Nulls display
`לא ידוע`, not false or a literal null. A missing baseline is distinguished from
one redacted by demo scope. The client rejects contradictory responses that claim
a hidden baseline while still supplying its values.

Same-date detail actions include the start time in their Hebrew accessible name.
Single-result announcements use singular Hebrew. Read-only and synthetic labels
remain visible; no real authorization or business rules have been enabled.

Latest checks: 14 Angular tests and 56 backend tests passed (70 total), full
lint/types/builds passed. Browser verification covered overnight and null detail,
redaction, opening/closing focus, start-date inclusion, 320/768/1280 reflow and
200% text resizing on updated isolated local servers. A transient browser click
timeout and an unavailable page interrupted initial attempts; fresh-page
self-contained checks passed. No accessibility certification is claimed.

Accessibility acceptance includes keyboard access to the skip link, focus on the
main landmark, no horizontal overflow at 320 CSS pixels or 200% text resizing,
visible focus, readable contrast and Hebrew screen-reader assessment. Automated
checks do not constitute WCAG 2.2 AA certification.

See the [root README](../../readme.md) for scope, versions and approval boundaries.
