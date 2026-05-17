import { readFile } from './readFile.js';
import { writeFile } from './writeFile.js';
import { edit } from './edit.js';
import { multiEdit } from './multiEdit.js';
import { listDirectory } from './listDirectory.js';
import { createDirectory } from './createDirectory.js';
import { moveFile } from './moveFile.js';
import { findByName } from './findByName.js';
import { grepSearch } from './grepSearch.js';
import { getFileInfo } from './getFileInfo.js';

export {
  readFile,
  writeFile,
  edit,
  multiEdit,
  listDirectory,
  createDirectory,
  moveFile,
  findByName,
  grepSearch,
  getFileInfo,
};

/**
 * Aggregated filesystem tools, keyed by their LLM-facing snake_case name.
 */
export const filesystemTools = {
  read_file: readFile,
  write_file: writeFile,
  edit: edit,
  multi_edit: multiEdit,
  list_directory: listDirectory,
  create_directory: createDirectory,
  move_file: moveFile,
  find_by_name: findByName,
  grep_search: grepSearch,
  get_file_info: getFileInfo,
};
