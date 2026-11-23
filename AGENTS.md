<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All UI text comes from `src/i18n/am/*` dictionaries (`t` from `@/i18n`); never hardcode English UI strings, so more languages can plug in later.
- App data lives in the zustand store `src/stores/db.ts` (seeded from `src/data/mock.ts`); business rules live in pure functions under `src/lib/rules/` so they can be unit-tested and mirrored by the future PHP backend.
- Offline-capable writes go through `submitOrQueue` in `src/lib/sync-queue.ts` (IndexedDB queue with `clientUuid`) and `src/services/api.ts` (`/api/v1` REST client with a local mock adapter), so swapping in the real server only touches the adapter.
- Signed-in pages live under the pathless `src/routes/_authenticated` layout, which renders only after client hydration because session and data come from localStorage.
- Role checks use `can(role, permission)` from `src/lib/permissions.ts`; pages wrap restricted content in `<RequirePerm>`.
- User-supplied login photography uses an imported CDN asset pointer and CSS-only tonal overlays/motion so the actual architecture remains intact and rendering stays lightweight.
- Create/edit/detail flows open in place via `@/components/common/AdaptiveDialog` (centered modal ≥768px, slide-up bottom sheet on phones) instead of new routes, so actions finish without leaving the current screen; deep-link routes like `/students/$id` stay only as fallbacks.
- Phone layout (<768px) uses the bottom nav + "More" sheet in `AppShell`, `Fab` for the page's primary create action, `FilterBar` for filters and `Records` for list data (table on tablet/desktop, touch cards on phones), so new pages get the native-app pattern for free.
- List rows/cards open their detail via `rowOpen` (`@/components/common/clickable`) and the `row-click` utility; `Records` rows and `Panel` accept `onOpen` (Records falls back to a built-in detail + actions modal), so inner checkboxes/buttons keep working without per-page `stopPropagation`.
- Account rules (staff-only user list, temp passwords, suspend/role-change protection) live in `src/lib/rules/accounts.ts` so the future backend can mirror them.
- Domain defaults are dictionary-backed and class validation lives in pure rules; versioned on-device upgrades preserve recorded marks, financial amounts, stock quantities, and internal role IDs instead of reseeding.
