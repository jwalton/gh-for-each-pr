import * as github from '@actions/github';

const PAGE_SIZE = 100;

type Octokit = ReturnType<typeof github.getOctokit>;

export type PullRequest = (ReturnType<Octokit['rest']['pulls']['list']> extends Promise<infer R>
    ? R
    : never)['data'][0];

export interface IOctokit {
    rest: {
        pulls: {
            list: (options: Parameters<Octokit['rest']['pulls']['list']>[0]) => Promise<{
                data: PullRequest[];
            }>;
        };
    };
}

/**
 * Run a function for each PR that matches a set of criteria.
 */
export async function forEachPr(
    octokit: IOctokit,
    options: {
        owner: string;
        repo: string;
        state?: 'open' | 'closed' | 'all';
        label?: string;
        author?: string;
        base?: string;
    },
    fn: (pr: PullRequest) => void
): Promise<void> {
    const state = options.state || 'open';

    let done = false;
    let page = 1;
    while (!done) {
        const prs = await octokit.rest.pulls.list({
            owner: options.owner,
            repo: options.repo,
            state,
            page,
            per_page: PAGE_SIZE,
        });
        if (prs.data.length < PAGE_SIZE) {
            done = true;
        }
        for (const pr of prs.data) {
            const matchesLabel =
                !options.label || pr.labels.find((label) => label.name === options.label);
            const matchesAuthor = !options.author || pr.user?.login === options.author;
            const matchesBase = !options.base || pr.base.ref === options.base;
            const match = matchesLabel && matchesAuthor && matchesBase;

            if (match) {
                fn(pr);
            }
        }
        page++;
    }
}
