import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { forEachPr } from './forEachPr';

const VALID_STATES = ['open', 'closed', 'all'];

async function run(): Promise<void> {
    try {
        const token =
            core.getInput('github-token', { required: false }) || process.env.GITHUB_TOKEN || '';
        const octokit = github.getOctokit(token);
        const context = github.context;

        const command = core.getInput('command');
        if (!command) {
            throw new Error('"command" is required.');
        }

        let state = core.getInput('state');
        if (!VALID_STATES.includes(state)) {
            state = 'open';
        }

        const author = core.getInput('author') || undefined;
        const label = core.getInput('label') || undefined;
        const base = core.getInput('base') || undefined;

        await forEachPr(
            octokit,
            {
                owner: context.repo.owner,
                repo: context.repo.repo,
                author,
                label,
                base,
                state: state as 'open' | 'closed' | 'all',
            },
            (pr) => {
                const env: NodeJS.ProcessEnv = {
                    ...process.env,
                    PR_NUMBER: `${pr.number}`,
                    PR_AUTHOR: pr.user?.login,
                    PR_LABELS: ' ' + pr.labels.map((label) => label.name).join(' ') + ' ',
                    PR_HEAD_REF: pr.head.ref,
                    PR_HEAD_SHA: pr.head.sha,
                    PR_BASE_REF: pr.base.ref,
                    PR_BASE_SHA: pr.base.sha,
                };

                core.startGroup(`PR #${pr.number}`);
                const output = execSync(command, { shell: '/bin/bash', encoding: 'utf-8', env });
                console.log(output);
                core.endGroup();
            }
        );
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();
