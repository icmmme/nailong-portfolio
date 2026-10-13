# GitHub Pages deployment

- Repository: https://github.com/icmmme/nailong-portfolio
- Website: https://icmmme.github.io/nailong-portfolio/
- Source branch: `main`
- Publishing source: GitHub Actions (`.github/workflows/pages.yml`)
- Initial deployment: https://github.com/icmmme/nailong-portfolio/actions/runs/38384064433

Each push runs motion tests, verifies the 20 content records and original image hashes, builds with the repository URL prefix, and deploys `dist` to Pages. No extra deploy token is stored in the repository; the workflow uses GitHub's built-in token and Pages identity permissions.

## Verification on 2026-10-13

The initial GitHub Actions run completed successfully, including tests, content checks, production build, and deployment. The live homepage returns HTTP 200 with the NAILONG title and correct `/nailong-portfolio/` asset prefix. All 20 live JPEG responses match the original SHA256 checksums.

Online browser inspection was attempted but the browser connection repeatedly timed out. Therefore this deployment has HTTP and image integrity verification, plus the previously completed local UI checks; a fresh online interaction check and screenshot could not be completed in this session.

To verify online assets again:

```powershell
node scripts/verify-nailong.mjs https://icmmme.github.io/nailong-portfolio/
```

For updates, edit and test the local project, commit the changes, then run `git push origin main`. Watch the Actions run in the repository; the same public URL updates after a successful deploy.
