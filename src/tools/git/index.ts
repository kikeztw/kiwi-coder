import { gitStatus } from './gitStatus.js';
import { gitDiff } from './gitDiff.js';
import { gitLog } from './gitLog.js';
import { gitShow } from './gitShow.js';
import { gitBranch } from './gitBranch.js';
import { gitBlame } from './gitBlame.js';
import { gitAdd } from './gitAdd.js';
import { gitCommit } from './gitCommit.js';
import { gitBranchCreate } from './gitBranchCreate.js';
import { gitCheckout } from './gitCheckout.js';
import { gitStash } from './gitStash.js';

export {
  gitStatus,
  gitDiff,
  gitLog,
  gitShow,
  gitBranch,
  gitBlame,
  gitAdd,
  gitCommit,
  gitBranchCreate,
  gitCheckout,
  gitStash,
};

/**
 * Read-only git tools (no approval needed).
 */
export const gitReadTools = {
  git_status: gitStatus,
  git_diff: gitDiff,
  git_log: gitLog,
  git_show: gitShow,
  git_branch: gitBranch,
  git_blame: gitBlame,
};

/**
 * Write git tools (each requires approval).
 */
export const gitWriteTools = {
  git_add: gitAdd,
  git_commit: gitCommit,
  git_branch_create: gitBranchCreate,
  git_checkout: gitCheckout,
  git_stash: gitStash,
};

/**
 * Aggregated git tools (read + write).
 */
export const gitTools = {
  ...gitReadTools,
  ...gitWriteTools,
};
