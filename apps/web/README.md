# SHF Web Synthetic Personal Workspace

The existing staffing card now supports pure candidate eligibility/capacity
calculations. Open a request, load its candidates and select “חישוב התאמה וקיבולת
בלבד.” Suitable demo results show hypothetical one-slot counts; full/deadline/
duplicate blockers or stale/unknown facts show no future capacity.

All previews are explicitly unsaved, unassigned and unapproved. They never
reserve capacity or update request/candidate rows. The UI validates before
snapshot and exact conditional arithmetic and rejects saved or wrong-context
responses. Pending calculations cancel on candidate refresh, card close or filter
change, and result close returns focus to the candidate action. A false/missing
preview capability leaves read views available but disables the calculation.

Six requests include new populated reduction `93000007` while preserving empty
`93000003`. Time-change `93000005` shows last-slot remaining 1 → hypothetical 0
for candidate 1 and duplicate participation for candidate 5. Fixed 120-minute
lead, frozen clock and resolved compatibility flags are synthetic policy, not
real source/eligibility/atomic-capacity evidence.

Current checks: 79 Angular + 84 API tests (163 total), lint/types/builds passed;
initial bundle remains 431.23 kB. Local browser checks passed positive/full/
unknown/stale/duplicate calculations, exact last slot, unchanged counters,
failure retention, focus, 320/768/1280 reflow and 200% resizing. No Oracle,
assignment, registration, approval, partner or production action occurred.

Latest read-only R08 view: [staffing requests](src/app/staffing.ts) show
reinforcement, time-change and reduction lists/details and on-demand candidates.
The same stub startup commands/proxy apply; restart the API for updated routes.

Five requests demonstrate available, full (zero) and unknown (null) capacity;
counts requested/approved/remaining remain distinct. Deadlines and freshness use
the frozen October 13 scenario clock, not current time. Stale/unknown candidates
are labelled and never treated as authorized or assigned. A reduction example
has no candidates. All values are invented and fixed-team scoped.

Type filters, detail focus/return, retained search/filter on failure and
cancellation of superseded list/detail/candidate reads follow the existing
patterns. Notes render as plain text. The client validates request/recipient
context, markers and count consistency. No editable deadline/date or mutating
workflow control exists.

Current checks: 72 Angular + 80 API tests (152 total), full lint/types/builds
passed; initial bundle 431.23 kB under unchanged warning budget. Browser checks
passed full/unknown capacity, deadline and stale states, type filter, safe note,
empty/error/retry, keyboard focus, 320/768/1280 reflow and 200% resizing.
Real Oracle, scope/eligibility/capacity preconditions, manual accessibility and
UAT remain pending.

Latest R08 addition: the [replacement demo](src/app/replacement.ts) lists four
fixed-team synthetic candidates and calculates eligibility only. Separate
scenario IDs and a frozen October 13 clock make this explicitly different from
the operational attendance fixtures and current availability.

Candidate outcomes are suitable-under-demo, blocked, review-required and unknown.
The UI displays separate blockers, warnings and unknown facts, never an acceptance.
All results remain unsaved/unaccepted; there are no confirm/save/cleanup actions.
Changing candidate or refreshing cancels old work; failed previews retain the
list and do not manufacture a suitable result. The client rejects wrong-context,
real/unmarked, accepted and contradictory classifications.

Restart the existing stub API and web commands for the added candidate/preview
routes. Current checks: 65 Angular + 78 API tests (143 total), lint/types/builds
passed; initial bundle 430.76 kB under unchanged warning budget. Browser checks
passed all categories, keyboard focus/return, unchanged list, error/retry,
320/768/1280 reflow and 200% resizing. No live neighbor-schedule/Oracle/policy,
trusted identity, manual assistive-technology or UAT claim is made.

Latest addition: [shift-time/split previews](src/app/shift-preview.ts) use explicit
start/end local dates/times, optional split gap dates/times and a required demo
reason. Four Hebrew calendar toggles are available for split proposals; two for
plain shifts. The same stub API/proxy/start commands apply.

Example on shift `9007199254740993`: 08:00-18:00 on October 14, gap 14:00-16:00,
returns 600 span, 480 working and 120 gap minutes. A gap that overlaps the planned
13:00 break is rejected without modifying anything. Overnight proposals preserve
the next-day end date. Managed/unknown source policy is unavailable.

All output is explicitly unsaved; no write/offer cleanup/partner/operation
control exists. Draft edits clear old results and cancel requests, rejected drafts
remain intact, and the client verifies exact submitted values and minute totals.
Fixed synthetic thresholds are documented in the root README; they are not live
Oracle/attendance/unit policy or DST instant/paid-duration calculations.

Current checks: 58 Angular + 74 backend tests (132 total), full lint/types/builds
passed. Initial bundle 428.07 kB under unchanged warning budget. Browser tests
passed plain/split/overnight, calendar/segments, errors/draft/focus/cancellation,
unavailable sources, 320/768/1280 reflow and 200% resizing. Full real-policy/G4,
Oracle, trusted identity, manual assistive-technology and UAT remain pending.

Latest R07 increment: [break reads/previews](src/app/breaks.ts) add a personal
shift selector, planned/actual break table, local date/calendar/time/duration
form and explicitly unsaved calculation. It uses the existing stub startup
commands/proxy; restart the API for the new routes.

Normal shift `9007199254740993` supports an exact-boundary `11:45` / 15-minute
proposal; `11:46` is rejected by the synthetic 60-minute gap. Overnight shift
`9007199254740998` supports `2026-10-17`, `01:45` / 15 minutes. Managed/split/
unknown-source previews stay unavailable; actual seconds/nulls remain read data.
The policy's 1–120-minute positive duration limit is synthetic, not recovered
production configuration; zero is not a delete command.

Draft edits cancel old previews and clear stale results. Rule errors preserve
inputs, successful results focus the heading, and empty-source selection resets
the previous shift's draft. Saved/completed or inconsistent-duration responses
are rejected. Preview is the only calculation POST; it causes no save or partner
request and never substitutes an acceptance/operation result.

Current checks: 50 Angular + 69 backend tests (119 total), lint/types/builds
passed; initial bundle 426.75 kB. Browser checks passed planned/actual separation,
minute-edge/gap errors, explicit not-saved output, unchanged read table, calendar/
overnight, unavailable policy, focus/draft and narrow/200% resize behavior.
Real Oracle/policy/lead-time/DST/assistive-technology/UAT gates are not proven.

Latest approved increment: the
[operational screen](src/app/operational.ts) adds fixed-team schedule and
attendance modes through `/api/v1/shifts` and `/api/v1/attendance`. The same
existing startup commands/proxy apply; restart the stub API for its updated
fixtures. The demo range October 14-17, 2026 returns seven team shifts.

Planned start/end stay separate from actual stage/station arrival/exit.
Nullable facts are never replaced by zero, current time or success-shaped data.
The table preserves zero lateness, unknown lateness, missing reasons, reassigned
ownership and overnight local departure. Original baselines remain hidden.
No attendance registration, correction, unit/site selection or save action exists.
Inline detail returns focus to its row when closed.

Operational/personal date filters share the existing Hebrew calendar adapter and
one-to-31-day inclusive range helper. Table overflow is contained in a labelled
keyboard-focusable region; surrounding content reflows. Mode/filter replacement
cancels older reads and clears stale rows/detail. Responses must be explicitly
synthetic, unauthenticated and in fixed demo scope; UI capability is not real
authorization.

Current evidence: 41 Angular + 64 API tests (105 total), full lint/types/builds
passed; initial bundle 424.28 kB under unchanged warning budget. Browser checks
passed seven-row load, both modes, zero/null/overnight values, keyboard calendar,
focus restore, date filter/empty/failure/retry, 320/768/1280 reflow and 200% text
resizing. These do not establish real Oracle parity, manual Hebrew assistive-
technology acceptance, full WCAG conformance or UAT.

Latest R05 addition: employee cards now offer read-only skills, events and
education sections via labelled pressed-state buttons. Sections load on demand
through the existing stub proxy, cancel superseded reads, preserve the card on
failure and expose loading/empty/error/retry feedback. No event mutation or
course integration is implemented.

Employee `00000001` has populated demo sections, `00000002` has empty sections,
and `00000003` has unknown detail/date values. Education is explicitly invented
UI data, not a verified legacy feed. No new editable date fields were introduced.
The shared demo DTO and client validate employee/section identity as well as
synthetic response markers. Text is interpolated literally, never as HTML.

Current verification: 34 Angular + 62 backend tests (96 total), lint/types/builds
passed; initial bundle remains 423.81 kB. Local browser checks passed section
selection, safe text, empty/unknown/error/retry, card retention, keyboard/focus,
320/768/1280 reflow and 200% resizing. These are synthetic checks, not real Oracle
authorization, accessibility certification or UAT.

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

## Read-Only Messages Demo

The [messages screen](src/app/personal-messages.ts) appears below personal shifts.
It consumes the approved stub list/detail API through the same proxy and existing
startup commands. Three invented messages cover unread offer text, a previously
read historical notification and unknown read/type state with HTML-like content.
Other-recipient and deleted messages are not exposed.

Opening/closing a message does not mark it read; filtering and refresh preserve
the source fixture status. There are no deletion, acceptance, rejection or
notification controls. Content uses Angular text interpolation, never innerHTML.
Detail focuses its heading and restores the invoking button when closed.
Older filter/detail reads are cancelled before newer data replaces the view.

The [typed client](src/app/messages-api.ts) shares demo DTO types with the API
owner and uses the extracted [stub response guards](src/app/stub-response.ts)
also used by shifts. Capability, list and detail must be explicitly synthetic
and unauthenticated; malformed or unlabelled responses are rejected visibly.
Empty data is not a dependency-error fallback.

Current checks: 21 Angular tests and 58 backend tests passed (79 total), full
lint/type/template/build checks passed. Browser verification covered messages,
filtering, plain-text safety, unchanged read state, detail focus/return, narrow
layouts, 200% resizing and injected empty/503/retry cases. No Oracle, trusted
identity, manual Hebrew assistive-technology assessment, full WCAG conformance or
human business acceptance is established by these synthetic checks.

## Hebrew Calendars and Employee Demo

Shift start/end filter controls now have visible Material calendar toggles with
Hebrew names, month/week labels and keyboard behavior. Typed input remains ISO
`YYYY-MM-DD`; the [adapter](src/app/calendar.ts) rejects impossible dates and
serializes local date components, not a UTC-converted selection. Inclusive-end
and one-to-31-day range rules are preserved. Only these existing date inputs need
calendars; employee search has no date/age fields.

The [employee screen](src/app/employees.ts) adds read-only synthetic search and
card display below messages. Search accepts up to 80 characters for a name or
internal string ID, within a fixed invented team scope. Three fixtures include
leading-zero IDs, long Hebrew/English names and an unknown job. A foreign-team
fixture is inaccessible. No identity/contact/address data or write controls exist.

The [client](src/app/employees-api.ts) uses the shared minimal demo DTO and response
guards. Card heading focus and return-to-row focus, cancellation of superseded
reads, search preservation and empty/error/retry states match the established demo
patterns. This client is not a real employee authorization implementation.

Shift/calendar and employee components are immediate deferred features, with
visible loading/error states rather than silent chunk failures. The initial
production bundle measures 423.81 kB, below the unchanged 500 kB warning budget;
calendar/employee code loads separately immediately after shell render.

Current checks: 31 Angular tests and 60 backend tests (91 total) pass with full
lint/type/template/build checks. Calendar unit tests also pass in UTC-positive
and UTC-negative zones. Browser verification passed Hebrew calendar selection,
navigation/Escape/focus return, narrow popup layout, inclusive API filtering,
employee keyboard search/card/privacy/minimized data, empty/failure/retry,
320/768/1280 page reflow and 200% text resizing. Oracle, real identity, full
assistive-technology assessment and UAT remain unverified.

Accessibility acceptance includes keyboard access to the skip link, focus on the
main landmark, no horizontal overflow at 320 CSS pixels or 200% text resizing,
visible focus, readable contrast and Hebrew screen-reader assessment. Automated
checks do not constitute WCAG 2.2 AA certification.

See the [root README](../../readme.md) for scope, versions and approval boundaries.
