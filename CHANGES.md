# Changes — 2026-04-10

## Git

- Fixed broken remote URL (old expired token) by updating it with a new PAT
- Removed hardcoded GitHub tokens from `.claude/settings.local.json` (were in the `allow` permissions list)
- Amended the commit to scrub the secrets before pushing (GitHub push protection was blocking it)
- Successfully pushed to `luqmaan17053/coc-viewer` on master

## Azure Container Registry

- Built and pushed Docker image to `crcocdashboard.azurecr.io`
- Image: `coc-web:v1`, build ID: `cm1`
- Build succeeded (the Azure CLI crashed on Windows mid-stream due to a Unicode encoding bug with the Next.js `▲` character, but the build itself completed successfully on ACR's side)
