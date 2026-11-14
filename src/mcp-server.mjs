// MCP server: lets Claude and Codex read and change the board the app shows.
// Written for an agent's context window: compact one-line JSON, tags by name, errors that say what to do next.
// The board logic lives in mcp-board.mjs; this file is the tool list and the file I/O.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';
import store from './store.js'; // CommonJS, shared with the Electron main process
import dates from './dates.js';
import * as board from './mcp-board.mjs';

// Defaults to Electron's app.getPath('userData') for kanban-app
const dataDir = process.env.KANBAN_DATA_DIR || path.join(os.homedir(), 'Library', 'Application Support', 'kanban-app');
const dataPath = path.join(dataDir, 'kanban-data.json');
const imagesPath = path.join(dataDir, 'images');
const summariesPath = path.join(dataDir, 'summaries');

// Same strict store as the app: a corrupt file fails the call instead of reading as an empty board.
function load() {
  try {
    return store.load(dataPath);
  } catch (e) {
    throw new Error(`Cannot read the board file ${dataPath} (${e.message}). Nothing was changed; the file has to be repaired by hand.`);
  }
}

// Apply a change to the board and save it. A change that throws, or changes nothing, writes nothing.
function change(apply) {
  const data = load();
  const before = JSON.stringify(data);
  const result = apply(data);
  if (JSON.stringify(data) !== before) store.save(dataPath, data);
  return result;
}

// Dates that have a daily summary, newest first
function summaryDates() {
  try {
    return fs.readdirSync(summariesPath)
      .map(name => /^summary-(\d{4}-\d{2}-\d{2})\.md$/.exec(name)?.[1])
      .filter(Boolean)
      .sort()
      .reverse();
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

const text = value => ({ content: [{ type: 'text', text: value }] });
const json = value => text(JSON.stringify(value));

const server = new McpServer(
  { name: 'kanban', version: '2.0.0' },
  { instructions: 'A personal kanban board (todo / doing / done). Start with board_summary; use list_tasks to find task ids. Tags are given by name, dates as local YYYY-MM-DD.' },
);

// A handler that throws becomes an isError result carrying the message (the SDK does this).
// Schemas are strict, so a misspelt or unsupported argument is an error rather than silently ignored.
const READ = { readOnlyHint: true, openWorldHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

const id = z.string().describe('Task id, from list_tasks or board_summary');
const status = z.enum(['todo', 'doing', 'done']);
const tagNames = z.array(z.string()).describe('Tag names (see list_tags); they must already exist');

server.registerTool('board_summary', {
  title: 'Board summary',
  description: 'Start here: what is being worked on and what is urgent. Returns task counts per status, the tasks in progress, and the open tasks that are overdue or due today, each with its id. Use list_tasks for anything more.',
  annotations: READ,
}, () => json(board.boardSummary(load(), dates.localDateStr(new Date()))));

server.registerTool('list_tasks', {
  title: 'List tasks',
  description: 'Lists tasks as compact rows {id, title, status, due, tags}: with no arguments, the open (todo and doing) tasks in board order. Returns {tasks, total}. Use get_task for a task\'s description and attachments.',
  inputSchema: z.strictObject({
    status: z.enum(['todo', 'doing', 'done', 'open', 'all']).optional().describe('Default "open" (todo + doing)'),
    tag: z.string().optional().describe('Only tasks with this tag name (case-insensitive)'),
    query: z.string().optional().describe('Only tasks whose title or description contains this text (case-insensitive)'),
    due_before: z.string().optional().describe('Only tasks due on or before this date, YYYY-MM-DD'),
    limit: z.number().int().min(1).max(200).optional().describe('Maximum rows, default 50'),
  }),
  annotations: READ,
}, filters => json(board.listTasks(load(), filters)));

server.registerTool('get_task', {
  title: 'Get task',
  description: 'Returns one task in full: description, tag names, timestamps, minutes spent, and attachments with absolute file paths you can read.',
  inputSchema: z.strictObject({ id }),
  annotations: READ,
}, ({ id }) => json(board.taskDetail(load(), id, imagesPath)));

server.registerTool('add_task', {
  title: 'Add task',
  description: 'Creates a task at the end of its column and returns its row, including the new id.',
  inputSchema: z.strictObject({
    title: z.string(),
    description: z.string().optional(),
    due: z.string().optional().describe('Due date, YYYY-MM-DD'),
    tags: tagNames.optional(),
    status: status.optional().describe('Default "todo"'),
  }),
  annotations: WRITE,
}, fields => json(change(data => board.addTask(data, fields))));

server.registerTool('update_task', {
  title: 'Update task',
  description: 'Changes a task\'s title, description, due date or tags and returns its updated row. Only the fields you pass change. To change status, use move_task.',
  inputSchema: z.strictObject({
    id,
    title: z.string().optional(),
    description: z.string().optional(),
    due: z.string().nullable().optional().describe('Due date, YYYY-MM-DD; "" or null removes it'),
    tags: tagNames.optional().describe('Tag names; replaces the task\'s tags ([] removes them all)'),
  }),
  annotations: { ...WRITE, idempotentHint: true },
}, ({ id, ...changes }) => json(change(data => board.updateTask(data, id, changes))));

server.registerTool('move_task', {
  title: 'Move task',
  description: 'Moves a task to todo, doing or done, with the app\'s time tracking: doing starts the clock, done records the time spent, todo resets it. Returns the task\'s status, timestamps and minutes spent.',
  inputSchema: z.strictObject({ id, status }),
  annotations: { ...WRITE, idempotentHint: true },
}, ({ id, status }) => json(change(data => board.moveTask(data, id, status))));

server.registerTool('delete_task', {
  title: 'Delete task',
  description: 'Permanently deletes a task and returns the deleted title. There is no undo: to finish a task, use move_task with status "done" instead.',
  inputSchema: z.strictObject({ id }),
  annotations: { ...WRITE, destructiveHint: true, idempotentHint: true },
}, ({ id }) => json(change(data => board.deleteTask(data, id))));

server.registerTool('list_tags', {
  title: 'List tags',
  description: 'Lists the tags as {name, color, open}, where open is the number of open tasks with that tag. These names are what the tag arguments of list_tasks, add_task and update_task accept.',
  annotations: READ,
}, () => json(board.listTags(load())));

server.registerTool('read_summary', {
  title: 'Read daily summary',
  description: 'Returns the daily summary the app writes each evening (markdown: completed, in progress, overdue) for one date, or the most recent one when no date is given.',
  inputSchema: z.strictObject({
    date: z.string().optional().describe('YYYY-MM-DD; default is the most recent summary'),
  }),
  annotations: READ,
}, ({ date }) => {
  const available = summaryDates();
  const wanted = date === undefined ? available[0] : board.checkDate(date, 'date');
  if (!wanted) throw new Error('No daily summaries have been written yet.');
  // `wanted` is only ever read if it is one of the dates found in the folder, so it cannot name another path
  if (!available.includes(wanted)) {
    throw new Error(`No summary for ${wanted}. Most recent: ${available.slice(0, 5).join(', ') || 'none'}.`);
  }
  return text(fs.readFileSync(path.join(summariesPath, `summary-${wanted}.md`), 'utf8'));
});

const transport = new StdioServerTransport();
await server.connect(transport);
