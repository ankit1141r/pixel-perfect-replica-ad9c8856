<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Signed-in app pages live under `src/routes/_authenticated/app/*` (URL /app) with the shell in `src/routes/_authenticated/app.tsx`; roles live in `user_roles` and every rule is enforced by RLS; nav items come from `src/components/sporty/nav.ts` so sidebar and mobile menu stay in sync.
- The app is dark-only; colors come from tokens in `src/styles.css` so components never hardcode colors.
