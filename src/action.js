import * as github from "@actions/github";
import * as core from "@actions/core";
import * as asana from "asana";

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

  // Create an Asana task for the PR in the project and section
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

  const client = asana.ApiClient.instance;
  const token = client.authentications["token"];
  token.accessToken = asanaAccessToken;
  const tasksApiInstance = new asana.TasksApi();

  const formattedPrTitle = prTitle.split(":")[1].trim();
  const taskName = `${formattedPrTitle} #${prNumber}`;
  const body = {
    data: {
      name: taskName,
      projects: [asanaProjectId],
      memberships: [{ project: asanaProjectId, section: asanaSectionId }],
    },
  };
  const opts = {};

  console.log(
    `Creating Asana task for PR #${prNumber} - ${prTitle} by ${prAuthor}`
  );
  tasksApiInstance.createTask(body, opts).then(
    () => {
      console.log("Asana create API call successful.");
    },
    (error) => {
      console.error(error.response.body);
    }
  );
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
