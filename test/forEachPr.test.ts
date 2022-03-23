import { describe, expect, it } from '@jest/globals';
import { forEachPr, IOctokit, PullRequest } from '../src/forEachPr';

const makePR = (number: number, labels: string[], user: string): PullRequest =>
    ({
        number,
        labels: labels.map((label) => ({ name: label })),
        user: { login: user },
        head: { ref: 'branch', sha: 'branch-sha' },
        base: { ref: 'master', sha: 'master-sha' },
    } as PullRequest);

class DummyOctokit implements IOctokit {
    rest: {
        pulls: {
            list: (options: Parameters<IOctokit['rest']['pulls']['list']>[0]) => Promise<{
                data: PullRequest[];
            }>;
        };
    };

    constructor(prs: PullRequest[]) {
        this.rest = {
            pulls: {
                async list() {
                    return { data: prs };
                },
            },
        };
    }
}

describe('forEachPr', () => {
    it('should do something for each PR', async () => {
        const octokit = new DummyOctokit([
            makePR(1, [], 'jwalton'),
            makePR(2, ['bugfix'], 'jwalton'),
            makePR(3, ['alpha', 'bugfix'], 'jwalton'),
        ]);

        const prs: string[] = [];
        await forEachPr(octokit, { owner: 'jwalton', repo: 'gh-for-each-pr' }, (pr) => {
            prs.push(`${pr.number}`);
        });
        expect(prs).toEqual(['1', '2', '3']);
    });

    it('should match PRs with a specific label', async () => {
        const octokit = new DummyOctokit([
            makePR(1, [], 'jwalton'),
            makePR(2, ['bugfix'], 'jwalton'),
            makePR(3, ['alpha', 'bugfix'], 'jwalton'),
        ]);

        const prs: string[] = [];
        await forEachPr(
            octokit,
            { owner: 'jwalton', repo: 'gh-for-each-pr', label: 'bugfix' },
            (pr) => {
                prs.push(`${pr.number}`);
            }
        );
        expect(prs).toEqual(['2', '3']);
    });

    it('error if any command errors', async () => {
        const octokit = new DummyOctokit([
            makePR(1, [], 'jwalton'),
            makePR(2, ['bugfix'], 'jwalton'),
            makePR(3, ['alpha', 'bugfix'], 'jwalton'),
        ]);

        expect(async () => {
            await forEachPr(octokit, { owner: 'jwalton', repo: 'gh-for-each-pr' }, (pr) => {
                if (pr.number === 2) {
                    throw new Error('Boom');
                }
            });
        }).rejects.toThrow('Boom');
    });
});
