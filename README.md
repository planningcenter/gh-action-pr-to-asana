# gh-action-pr-to-asana

This action creates Asana tasks from pull requests. It's specifically designed to handle PRs that are automatically generated by tools like Dependabot, converting them into trackable tasks in your Asana workspace.

## Example Usage

```yaml
name: Create Asana Task for PR

on:
  pull_request:
    types: 
      - opened

permissions:
    pull-requests: write

jobs:
  create-asana-task:
    runs-on: ubuntu-latest
    steps:
      - name: Create Asana Task
        uses: planningcenter/gh-action-pr-to-asana@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          asana_token: ${{ secrets.ASANA_PAT }}
          asana_project_id: ${{ secrets.ASANA_PROJECT_ID }}
          asana_section_id: ${{ secrets.ASANA_SECTION_ID }}
          asana_tasks_for_pr_authors: ${{ vars.ASANA_TASKS_FOR_PR_AUTHORS }}
```

## Setup Tips

If you plan to use this action beyond Dependabot workflows, you'll need to configure secrets in both locations:

* Actions secrets: GitHub Repo → Settings → Secrets and variables → Actions
* Dependabot secrets: GitHub Repo → Settings → Secrets and variables → Dependabot

> [!NOTE]
> The `asana_tasks_for_pr_authors` input should be configured as a variable, not a secret.
