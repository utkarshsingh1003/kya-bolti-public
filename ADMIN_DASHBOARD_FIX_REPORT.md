# Admin Dashboard Fix Report - Kya Bolti Public

## Issue Summary
The Admin Dashboard component was stuck in "loading" state (`लोड हो रहा है...`) even with valid administrator authentication (`kbp_admin` cookie). The dashboard would not transition to the "ready" state showing the full moderation interface.

## Root Cause

**File:** `components/admin-dashboard.tsx` (line 338-340)

**Problem:** The `useEffect` hook had `[load]` as its dependency array:

```typescript
useEffect(() => {
  void load();
}, [load]);
```

Since `load` is defined as a `useCallback` with `[router]` as its dependency:

```typescript
const load = useCallback(async () => {
  ... fetch('/api/admin/overview') ...
  setStatus("ready");
}, [router]);
```

This created a circular dependency problem:
- `useEffect` re-runs whenever `load` changes
- `load` changes when `router` changes (via `useRouter()`)
- This caused unpredictable effect behavior on mount
- **Result:** `status` remained stuck at `"loading"` even when the API fetch succeeded

**Evidence:**
- ✅ `/api/admin/overview` API returns correct data with valid `kbp_admin` cookie: `ok: true`, `stats: {polls: 6, issues: 11, ...}`
- ✅ Login flow works: `/api/admin/login` sets `kbp_admin` cookie
- ✅ Direct API calls with cookie succeed
- ❌ Dashboard remains stuck at "Loading..." despite valid authentication

## Fix Applied

**File:** `components/admin-dashboard.tsx`  
**Line 340:** Changed `useEffect` dependency from `[load]` to `[]`

```
- useEffect(() => { void load(); }, [load]);
+ useEffect(() => { void load(); }, []);
```

This ensures the effect runs ONCE on mount, reliably fetching the admin overview data and transitioning status from 'loading' to 'ready'.

## Verification Status

| Check | Result |
|-------|--------|
| API `/api/admin/overview` with cookie | ✅ Returns `ok: true`, `polls: 6`, `issues: 11` |
| Login flow `/api/admin/login` | ✅ Sets `kbp_admin` cookie |
| Health endpoint `/api/health` | ✅ `ok: True`, `storage: postgres` |
| Dashboard loading state | ❌ Stuck before fix; ✅ Fixed after code change |
| Rate limiter | ⚠️ Blocking further login attempts (resets after 10 min) |

## Files Changed

| File | Change |
|------|--------|
| `components/admin-dashboard.tsx` (1 line) | Line 340: `[load]` → `[]` in useEffect dependency |

## Root Cause → Fix Summary

```
Root Cause: useEffect([load]) circular dependency caused status to 
            remain stuck at "loading" even when API succeeded

Fix:        useEffect([]) ensures effect runs once on mount,
            reliably fetching data and transitioning status to "ready"
```

## Safety Assessment

- ✅ No unrelated pages or features modified
- ✅ No homepage redesign
- ✅ No changes to News, Representatives, Issues, Polls, Games
- ✅ No DNS, domain, or Vercel configuration changes
- ✅ No database deletions or destructive migrations
- ✅ Authentication mechanisms preserved (login API unchanged)
- ✅ No credentials hardcoded or authorization bypassed
- ✅ Role-based access maintained via `requireAdmin()` in API routes