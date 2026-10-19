import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GIT = 'git';
export const DEFAULT_COMMIT_MESSAGE = 'Update blog content';
export const MAX_COMMIT_MESSAGE_LENGTH = 10000;
export const NOTHING_TO_COMMIT = 'nothing to commit';

/**
 * The message to commit with: the given one if it is a non-empty string, otherwise the default.
 * Throws when it is longer than MAX_COMMIT_MESSAGE_LENGTH.
 */
export function commitMessage(message) {
    if (typeof message !== 'string' || message.trim() === '') return DEFAULT_COMMIT_MESSAGE;
    if (message.length > MAX_COMMIT_MESSAGE_LENGTH) {
        throw new RangeError(`The commit message is longer than ${MAX_COMMIT_MESSAGE_LENGTH} characters.`);
    }
    return message;
}

/**
 * Stages every change in the repository at `cwd` and commits it.
 * Git runs without a shell and gets the message as one argument, so nothing in it is ever interpreted.
 * Resolves to { committed, output }; committed is false when there was nothing to commit.
 */
export async function commitAll(cwd, message) {
    const text = commitMessage(message);
    await execFileAsync(GIT, ['add', '.'], { cwd });
    try {
        const { stdout } = await execFileAsync(GIT, ['commit', '-m', text], { cwd });
        return { committed: true, output: stdout };
    } catch (err) {
        if (err.stdout && err.stdout.includes(NOTHING_TO_COMMIT)) {
            return { committed: false, output: 'Nothing to commit, working tree clean' };
        }
        throw err;
    }
}

/** Pushes the current branch of the repository at `cwd`. Resolves to git's output. */
export async function push(cwd) {
    const { stdout } = await execFileAsync(GIT, ['push'], { cwd });
    return stdout;
}
