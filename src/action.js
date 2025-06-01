import * as core from '@actions/core';
import * as github from '@actions/github';
import asana from 'asana';

async function run() {
  // Check if PR author is someone we are making Asana tasks for
  const prAuthor = github.context.payload.pull_request.user.login;
  const allowedPrAuthors = core
    .getInput("pr_authors")
    .split(",")
    .map((author) => author.trim());
  if (!allowedPrAuthors.includes(prAuthor)) {
    console.log(
      `Author ${prAuthor} is not in expected authors list: ${allowedPrAuthors.join(
        ", "
      )}, skipping...`
    );
    return;
  }

  // Create an Asana task for the PR for project and section
  const asanaAccessToken = core.getInput("asana_token");
  const asanaProjectId = core.getInput("asana_project_id");
  const asanaSectionId = core.getInput("asana_section_id");
  const prNumber = github.context.payload.pull_request.number;
  const prTitle = github.context.payload.pull_request.title;

  console.log("Debug: Input variables:");
  console.log("- PR Author:", prAuthor);
  console.log("- Allowed PR Authors:", allowedPrAuthors);
  console.log("- PR Number:", prNumber);
  console.log("- PR Title:", prTitle);

  // Initialize Asana client using Client instead of ApiClient
  const client = asana.Client.create().useAccessToken(asanaAccessToken);

  const formattedPrTitle = prTitle.includes(":") ? prTitle.split(":")[1].trim() : prTitle;
  const taskName = `${formattedPrTitle} #${prNumber}`;

  try {
    // Create task in Asana
    const response = await client.tasks.createTask({
      name: taskName,
      projects: [asanaProjectId],
      memberships: [{ project: asanaProjectId, section: asanaSectionId }],
    });

    console.log(`Created Asana task for PR #${prNumber} - ${prTitle} by ${prAuthor}`);
    console.log("Asana task created successfully:", response.gid);

    // Get the task URL
    const taskUrl = response.permalink_url

    // Update PR description with Asana link if a GitHub token is provided
    const octokit = github.getOctokit();
    const { owner, repo } = github.context.repo;

    // Get current PR description
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });

    // Add Asana link to PR description
    const updatedBody = pullRequest.body ?
      `${pullRequest.body}\n\n---\n[View the associated task in Asana](${taskUrl})` :
      `[View the associated task in Asana](${taskUrl})`;

    // Update PR description
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: updatedBody
    });

    console.log(`Updated PR #${prNumber} with Asana task link`);
  } catch (error) {
    console.error("Error:", error);
    core.setFailed(error.message);
  }
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
