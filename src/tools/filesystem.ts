import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

// Read complete contents of a file as text
export const readTextFile = tool({
  description: 'Read complete contents of a file as text. Always treats the file as UTF-8 text regardless of extension.',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to read'),
    head: z.number().optional().describe('First N lines to read'),
    tail: z.number().optional().describe('Last N lines to read'),
  }),
  execute: async ({ path: filePath, head, tail }) => {
    try {
      if (head && tail) {
        throw new Error('Cannot specify both head and tail simultaneously');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      
      if (head || tail) {
        const lines = content.split('\n');
        const selectedLines = head 
          ? lines.slice(0, head)
          : lines.slice(-tail!);
        return selectedLines.join('\n');
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Read an image or audio file as base64
export const readMediaFile = tool({
  description: 'Read an image or audio file and return base64 data with the corresponding MIME type',
  inputSchema: z.object({
    path: z.string().describe('Path to the media file'),
  }),
  execute: async ({ path: filePath }) => {
    try {
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      
      // Determine MIME type from extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
      };
      
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      return {
        mimeType,
        base64Data: base64,
      };
    } catch (error) {
      throw new Error(`Failed to read media file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Read multiple files simultaneously
export const readMultipleFiles = tool({
  description: 'Read multiple files simultaneously. Failed reads won\'t stop the entire operation.',
  inputSchema: z.object({
    paths: z.array(z.string()).describe('Array of file paths to read'),
  }),
  execute: async ({ paths }) => {
    const results = await Promise.allSettled(
      paths.map(async (filePath) => {
        const content = await fs.readFile(filePath, 'utf-8');
        return { path: filePath, content, success: true };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          path: paths[index],
          error: result.reason?.message || 'Unknown error',
          success: false,
        };
      }
    });
  },
});

// Create new file or overwrite existing
export const writeFile = tool({
  description: 'Create new file or overwrite existing (exercise caution with this)',
  inputSchema: z.object({
    path: z.string().describe('File location'),
    content: z.string().describe('File content'),
  }),
  execute: async ({ path: filePath, content }) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Make selective edits using pattern matching
export const editFile = tool({
  description: 'Make selective edits to a file using advanced pattern matching and formatting. Best practice: Always use dryRun first to preview changes.',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to edit'),
    edits: z.array(z.object({
      oldText: z.string().describe('Text to search for (can be substring)'),
      newText: z.string().describe('Text to replace with'),
    })).describe('List of edit operations'),
    dryRun: z.boolean().optional().default(false).describe('Preview changes without applying'),
  }),
  execute: async ({ path: filePath, edits, dryRun = false }) => {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      const changes: Array<{ oldText: string; newText: string; found: boolean }> = [];

      for (const edit of edits) {
        const found = content.includes(edit.oldText);
        changes.push({ ...edit, found });
        
        if (found && !dryRun) {
          content = content.replace(edit.oldText, edit.newText);
        }
      }

      if (dryRun) {
        return {
          dryRun: true,
          changes,
          preview: content !== originalContent ? content : 'No changes',
        };
      }

      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
      }

      return {
        success: true,
        changes,
        modified: content !== originalContent,
      };
    } catch (error) {
      throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Create new directory
export const createDirectory = tool({
  description: 'Create new directory or ensure it exists. Creates parent directories if needed.',
  inputSchema: z.object({
    path: z.string().describe('Directory path to create'),
  }),
  execute: async ({ path: dirPath }) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true, path: dirPath };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// List directory contents
export const listDirectory = tool({
  description: 'List directory contents with [FILE] or [DIR] prefixes',
  inputSchema: z.object({
    path: z.string().describe('Directory path to list'),
  }),
  execute: async ({ path: dirPath }) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      return entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'DIR' : 'FILE',
        path: path.join(dirPath, entry.name),
      }));
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// List directory contents with sizes
export const listDirectoryWithSizes = tool({
  description: 'List directory contents with [FILE] or [DIR] prefixes, including file sizes and summary statistics',
  inputSchema: z.object({
    path: z.string().describe('Directory path to list'),
    sortBy: z.enum(['name', 'size']).optional().default('name').describe('Sort entries by name or size'),
  }),
  execute: async ({ path: dirPath, sortBy = 'name' }) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const entriesWithSize = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          let size = 0;
          
          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            size = stats.size;
          }
          
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'DIR' : 'FILE',
            size,
            path: fullPath,
          };
        })
      );

      // Sort
      if (sortBy === 'size') {
        entriesWithSize.sort((a, b) => b.size - a.size);
      } else {
        entriesWithSize.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Calculate summary
      const totalFiles = entriesWithSize.filter(e => e.type === 'FILE').length;
      const totalDirs = entriesWithSize.filter(e => e.type === 'DIR').length;
      const totalSize = entriesWithSize.reduce((sum, e) => sum + e.size, 0);

      return {
        entries: entriesWithSize,
        summary: {
          totalFiles,
          totalDirectories: totalDirs,
          totalSize,
        },
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Move or rename file
export const moveFile = tool({
  description: 'Move or rename files and directories. Fails if destination exists.',
  inputSchema: z.object({
    source: z.string().describe('Source path'),
    destination: z.string().describe('Destination path'),
  }),
  execute: async ({ source, destination }) => {
    try {
      if (existsSync(destination)) {
        throw new Error('Destination already exists');
      }
      
      await fs.rename(source, destination);
      return { success: true, from: source, to: destination };
    } catch (error) {
      throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Search for files matching pattern
export const searchFiles = tool({
  description: 'Recursively search for files/directories that match simple pattern (supports * wildcard)',
  inputSchema: z.object({
    path: z.string().describe('Starting directory'),
    pattern: z.string().describe('Search pattern (supports * wildcard)'),
    excludePatterns: z.array(z.string()).optional().describe('Patterns to exclude'),
  }),
  execute: async ({ path: searchPath, pattern, excludePatterns = [] }) => {
    try {
      const matches: string[] = [];
      
      async function searchRecursive(currentPath: string) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          // Check if excluded
          const isExcluded = excludePatterns.some(excludePattern => 
            entry.name.includes(excludePattern)
          );
          
          if (isExcluded) continue;
          
          // Simple pattern matching (supports * wildcard)
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          if (regex.test(entry.name)) {
            matches.push(fullPath);
          }
          
          // Recurse into directories
          if (entry.isDirectory()) {
            await searchRecursive(fullPath);
          }
        }
      }
      
      await searchRecursive(searchPath);

      return {
        matches,
        count: matches.length,
      };
    } catch (error) {
      throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get directory tree structure
export const directoryTree = tool({
  description: 'Get recursive JSON tree structure of directory contents',
  inputSchema: z.object({
    path: z.string().describe('Starting directory'),
    excludePatterns: z.array(z.string()).optional().describe('Patterns to exclude (glob format)'),
  }),
  execute: async ({ path: dirPath, excludePatterns = [] }) => {
    async function buildTree(currentPath: string): Promise<any> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      const tree = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(currentPath, entry.name);
          
          // Check if excluded
          const shouldExclude = excludePatterns.some(pattern => {
            // Simple pattern matching
            return entry.name.includes(pattern) || fullPath.includes(pattern);
          });
          
          if (shouldExclude) return null;
          
          if (entry.isDirectory()) {
            const children = await buildTree(fullPath);
            return {
              name: entry.name,
              type: 'directory',
              children,
            };
          } else {
            return {
              name: entry.name,
              type: 'file',
            };
          }
        })
      );
      
      return tree.filter(Boolean);
    }

    try {
      const tree = await buildTree(dirPath);
      return tree;
    } catch (error) {
      throw new Error(`Failed to build directory tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get file/directory metadata
export const getFileInfo = tool({
  description: 'Get detailed file/directory metadata including size, timestamps, type, and permissions',
  inputSchema: z.object({
    path: z.string().describe('Path to file or directory'),
  }),
  execute: async ({ path: filePath }) => {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        type: stats.isDirectory() ? 'directory' : 'file',
        permissions: stats.mode.toString(8).slice(-3),
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// List allowed directories (for workspace security)
export const listAllowedDirectories = tool({
  description: 'List all directories the agent is allowed to access',
  inputSchema: z.object({}),
  execute: async () => {
    // This would typically come from configuration
    // For now, return the current working directory
    return {
      allowedDirectories: [process.cwd()],
    };
  },
});

// Export all tools as an object for easy use
export const filesystemTools = {
  read_text_file: readTextFile,
  read_media_file: readMediaFile,
  read_multiple_files: readMultipleFiles,
  write_file: writeFile,
  edit_file: editFile,
  create_directory: createDirectory,
  list_directory: listDirectory,
  list_directory_with_sizes: listDirectoryWithSizes,
  move_file: moveFile,
  search_files: searchFiles,
  directory_tree: directoryTree,
  get_file_info: getFileInfo,
  list_allowed_directories: listAllowedDirectories,
};
