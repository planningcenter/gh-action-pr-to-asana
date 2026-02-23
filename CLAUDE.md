# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

GitHub Action (Node.js) that creates Asana tasks from pull requests and links them back to the PR description. Designed primarily for Dependabot-generated PRs.

## Essential Commands

- `npm run build` - Compile action
- `npm install` - Install dependencies

## Project Structure

```
src/
  action.js         Action entry point
dist/               Compiled output (committed, used by action runner)
action.yml          Action definition and inputs
```

## Development Practices

- The `dist/` directory is committed and must be kept in sync — always run `npm run build` before committing changes to `src/`
- `action.yml` defines all inputs; update it when adding or removing inputs in `src/action.js`
- Action runs on `node20` via the compiled `dist/index.js`
- Secrets (`asana_token`, `github_token`) and the project/section IDs must be configured in both Actions secrets and Dependabot secrets for Dependabot workflows
