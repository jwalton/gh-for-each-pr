# for-each-pr

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

This is a GitHub action for executing a command for each PR that meets some criteria.

## A Quick Example

This example will checkout the "alpha" branch, reset it to "main", then merge
all open PRs tagged with "alpha", and finally push the result.

```yaml
jobs:
  merge-alpha:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout alpha branch
        uses: actions/checkout@v3
        with:
          ref: alpha
      - name: Reset branch to main
        run: git reset --hard main
      - name: Merge all PRs tagged with alpha
        uses: jwalton/gh-for-each-pr@v1
        with:
          label: alpha
          command: git merge ${PR_HEAD_REF}
      - run: git push --force
```

## Inputs

### `command`

The command to run. Inside this command, you have access to all environment variables, and the following:

- `PR_NUMBER` - The PR number (e.g. "1234" for PR #1234).
- `PR_AUTHOR` - The GitHub username of the author of this PR.
- `PR_LABELS` - A space separated list of PR labels. If the PR is labeled with "bug fix" and "alpha" then this would be `" bug fix alpha "` (note the leading and trailing space).
- `PR_HEAD_REF` - The name of the branch the PR is from (e.g. "newfeature").
- `PR_HEAD_SHA` - The SHA of the most recent commit on the PR branch.
- `PR_BASE_REF` - The name of the branch the PR is going to merge to (e.g. "main").
- `PR_BASE_SHA` - The SHA of the most recent commit from the base branch.

### `github-token`

The token to use to access GitHub. Defaults to GITHUB_TOKEN.

### `state`

If provided, only PRs with the specified state will be used (e.g. "open", "closed", or "all"). Defaults to "open".

### `label`

If provided, only PRs with the specified label will be used (e.g. "bugfix").

### `author`

If provided, only PRs where the author is the specified GitHub username will be used (e.g. "jwalton").

### `baseRef`

If provided, only PRs with the specified baseRef will be used (e.g. "main").

## Contributing

When creating a PR or when pushing a new release to main, be sure to run `npm run all` first to rebuild the contents of lib and dist.
