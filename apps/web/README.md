# SHF Web Foundation

Standalone Angular 22.2.2 with Angular Material/CDK and Material 3. This is a
local Hebrew/RTL shell, not a connected workforce application. Authentication,
business data, feature routes and API/UI contracts remain pending.

Run these commands from the repository root:

```powershell
npm run dev:web
npm test --workspace=shf-web
npm run typecheck --workspace=shf-web
npm run build --workspace=shf-web
```

The development server binds to `http://127.0.0.1:4200`. Tests use Angular's
Vitest builder and jsdom; they do not prove real-browser accessibility or live
integration behavior. No end-to-end runner is installed.

The shell uses Hebrew document language, RTL layout, isolated Latin labels,
semantic landmarks, a keyboard skip link, logical CSS properties and a locally
rendered Material theme. It does not download fonts or contact an API.

Accessibility acceptance includes keyboard access to the skip link, focus on the
main landmark, no horizontal overflow at 320 CSS pixels or 200% text resizing,
visible focus, readable contrast and Hebrew screen-reader assessment. Automated
checks do not constitute WCAG 2.2 AA certification.

See the [root README](../../readme.md) for scope, versions and approval boundaries.
