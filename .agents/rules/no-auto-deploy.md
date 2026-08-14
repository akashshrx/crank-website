# Rule: No Automatic Git Push / Netlify Deployments

## Overview
Pushing to the GitHub repository automatically triggers Netlify build pipelines, which consumes Netlify build minutes.

## Mandatory Policy
1. **Local Editing & Verification First**: All file modifications, bug fixes, or feature additions must be performed and verified locally without pushing to `origin/main` automatically.
2. **Explicit User Consent / Command Required**: Do **NOT** run `git push` automatically after making edits unless the user explicitly requests to deploy or push to GitHub (e.g. "push changes", "deploy to netlify", "push to github").
3. **Batch Pushes**: When a push is requested, group completed and tested changes into logical commits rather than pushing after every single file edit.
