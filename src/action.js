const core = require("@actions/core")
const github = require("@actions/github")
const asana = require("asana")

async function run() {
  //
  // Check if PR author is someone we should make Asana tasks for
  //
  const prAuthor = github.context.payload.pull_request.user.login
  const allowedPrAuthors = core
    .getInput("pr_authors")
    .split(",")
    .map((author) => author.trim())
  if (!allowedPrAuthors.includes(prAuthor)) {
    console.log(
      `Author ${prAuthor} is not in expected authors list: ${allowedPrAuthors.join(
        ", "
      )}, skipping for now...`
    )
    return
  }

  //
  // Boiler
  //
  const asanaAccessToken = core.getInput("asana_token")
  const asanaProjectId = core.getInput("asana_project_id")
  const asanaSectionId = core.getInput("asana_section_id")
  const githubToken = core.getInput("github_token")
  const prNumber = github.context.payload.pull_request.number
  const prTitle = github.context.payload.pull_request.title
  const prUrl = github.context.payload.pull_request.html_url

  // Initialize Asana client
  const client = asana.ApiClient.instance
  const token = client.authentications["token"]
  token.accessToken = asanaAccessToken

  //
  // Create an Asana Task for the PR
  //
  const tasksApiInstance = new asana.TasksApi()
  const formattedPrTitle = prTitle.includes(":") ? prTitle.split(":")[1].trim() : prTitle.trim()
  const taskName = `${formattedPrTitle} #${prNumber}`

  try {
    const taskBody = {
      data: {
        name: taskName,
        projects: [asanaProjectId],
        memberships: [{ project: asanaProjectId, section: asanaSectionId }],
      },
    }

    // Create the Asana task
    const asanaTask = await tasksApiInstance.createTask(taskBody)
    console.log(`Created Asana task ${asanaTask.data.gid}} for PR #${prNumber} by ${prAuthor}`)

    //
    // Add Asana link to PR description
    //
    const octokit = github.getOctokit(githubToken)
    const { owner, repo } = github.context.repo

    // Get current PR description
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    })

    const taskUrl = `https://app.asana.com/0/0/${asanaTask.data.gid}`
    // Matches the format of the Asana app for GitHub
    const updatedBody = `${pullRequest.body || ""}\n\n---\n- To see the specific tasks where the Asana app for GitHub is being used, see below:\n  - ${taskUrl}`

    // Update the PR description
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: updatedBody,
    })

    console.log(`Updated PR #${prNumber} with Asana task link`)

    //
    // Add a comment to the PR with the Asana task link
    //

    // This simple comment/story is made because we can't use the
    // Asana API to make a rich GitHub attachment links.
    // And this isn't an attachment because the Asana app for GitHub
    // will not work if the PR is already linked.
    const storiesApiInstance = new asana.StoriesApi()
    const storyBody = {
      data: {
        text: `Associated GitHub PR: ${prUrl}`,
      },
    }
    const taskGid = asanaTask.data.gid

    // Add the story/comment
    await storiesApiInstance.createStoryForTask(storyBody, taskGid)
    console.log("Added comment to Asana task successfully")
  } catch (error) {
    console.error("Error:", error)
    core.setFailed(error.message)
  }
}

try {
  run()
} catch (error) {
  core.setFailed(error.message || "An unexpected error occurred")
}
