import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';
import store from './store.js'; // CommonJS, shared with the Electron main process

// Data paths — match Electron's app.getPath('userData') for kanban-app
const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'kanban-app');
const dataPath = path.join(userDataPath, 'kanban-data.json');
const summariesPath = path.join(userDataPath, 'summaries');

// Helpers

// Same store as the app. Strict: a corrupt file fails the tool call instead of
// reading as an empty board that the next write would save over the real data.
const loadData = () => store.load(dataPath);
const saveData = data => store.save(dataPath, data);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// Server setup

const server = new McpServer({
  name: 'kanban',
  version: '1.0.0',
});

// --- Task tools ---

server.tool(
  'list_tasks',
  'List tasks, optionally filtered by status and/or tag',
  { status: z.enum(['todo', 'doing', 'done']).optional(), tagId: z.string().optional() },
  async ({ status, tagId }) => {
    const { tasks } = loadData();
    let filtered = tasks;
    if (status) filtered = filtered.filter(t => t.status === status);
    if (tagId) filtered = filtered.filter(t => t.tags && t.tags.includes(tagId));
    filtered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return { content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }] };
  }
);

server.tool(
  'get_task',
  'Get a single task by ID',
  { id: z.string() },
  async ({ id }) => {
    const { tasks } = loadData();
    const task = tasks.find(t => t.id === id);
    if (!task) return { content: [{ type: 'text', text: `Task not found: ${id}` }], isError: true };
    return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
  }
);

server.tool(
  'create_task',
  'Create a new task',
  {
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['todo', 'doing', 'done']).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ title, description, status, dueDate, tags }) => {
    const data = loadData();
    const s = status || 'todo';
    const now = new Date().toISOString();

    // Calculate max sortOrder for the target status column
    const maxSort = data.tasks
      .filter(t => t.status === s)
      .reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1);

    const task = {
      id: generateId(),
      title,
      description: description || '',
      status: s,
      dueDate: dueDate || null,
      tags: tags || [],
      attachments: [],
      createdAt: now,
      startedAt: s === 'doing' || s === 'done' ? now : null,
      completedAt: s === 'done' ? now : null,
      timeSpent: null,
      sortOrder: maxSort + 1,
      tagSortOrders: {},
    };

    data.tasks.push(task);
    saveData(data);
    return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
  }
);

server.tool(
  'update_task',
  'Update an existing task (partial update)',
  {
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['todo', 'doing', 'done']).optional(),
    dueDate: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ id, title, description, status, dueDate, tags }) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === id);
    if (!task) return { content: [{ type: 'text', text: `Task not found: ${id}` }], isError: true };

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    if (status !== undefined && status !== task.status) {
      const now = new Date().toISOString();
      // Transition logic
      if (status === 'doing' && !task.startedAt) task.startedAt = now;
      if (status === 'done') {
        task.completedAt = now;
        if (!task.startedAt) task.startedAt = now;
      }
      if (task.status === 'done' && status !== 'done') task.completedAt = null;
      task.status = status;
    }

    saveData(data);
    return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
  }
);

server.tool(
  'delete_task',
  'Delete a task by ID',
  { id: z.string() },
  async ({ id }) => {
    const data = loadData();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return { content: [{ type: 'text', text: `Task not found: ${id}` }], isError: true };
    data.tasks.splice(idx, 1);
    saveData(data);
    return { content: [{ type: 'text', text: `Deleted task ${id}` }] };
  }
);

// --- Tag tools ---

server.tool(
  'list_tags',
  'List all tags',
  {},
  async () => {
    const { tags } = loadData();
    return { content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }] };
  }
);

server.tool(
  'create_tag',
  'Create a new tag',
  { name: z.string(), color: z.string() },
  async ({ name, color }) => {
    const data = loadData();
    const tag = { id: generateId(), name, color };
    data.tags.push(tag);
    saveData(data);
    return { content: [{ type: 'text', text: JSON.stringify(tag, null, 2) }] };
  }
);

server.tool(
  'update_tag',
  'Update an existing tag',
  { id: z.string(), name: z.string().optional(), color: z.string().optional() },
  async ({ id, name, color }) => {
    const data = loadData();
    const tag = data.tags.find(t => t.id === id);
    if (!tag) return { content: [{ type: 'text', text: `Tag not found: ${id}` }], isError: true };
    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    saveData(data);
    return { content: [{ type: 'text', text: JSON.stringify(tag, null, 2) }] };
  }
);

server.tool(
  'delete_tag',
  'Delete a tag and remove it from all tasks',
  { id: z.string() },
  async ({ id }) => {
    const data = loadData();
    const idx = data.tags.findIndex(t => t.id === id);
    if (idx === -1) return { content: [{ type: 'text', text: `Tag not found: ${id}` }], isError: true };
    data.tags.splice(idx, 1);
    // Strip tag from all tasks
    for (const task of data.tasks) {
      if (task.tags) task.tags = task.tags.filter(t => t !== id);
      if (task.tagSortOrders) delete task.tagSortOrders[id];
    }
    saveData(data);
    return { content: [{ type: 'text', text: `Deleted tag ${id}` }] };
  }
);

// --- Summary tools ---

server.tool(
  'list_summaries',
  'List available daily summary files, newest first',
  {},
  async () => {
    try {
      if (!fs.existsSync(summariesPath)) return { content: [{ type: 'text', text: '[]' }] };
      const files = fs.readdirSync(summariesPath)
        .filter(f => f.startsWith('summary-') && f.endsWith('.md'))
        .sort()
        .reverse();
      return { content: [{ type: 'text', text: JSON.stringify(files, null, 2) }] };
    } catch {
      return { content: [{ type: 'text', text: '[]' }] };
    }
  }
);

server.tool(
  'read_summary',
  'Read a daily summary file by filename',
  { filename: z.string() },
  async ({ filename }) => {
    // Path traversal guard
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return { content: [{ type: 'text', text: 'Invalid filename' }], isError: true };
    }
    const filePath = path.join(summariesPath, filename);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content: [{ type: 'text', text: content }] };
    } catch {
      return { content: [{ type: 'text', text: `Summary not found: ${filename}` }], isError: true };
    }
  }
);

// Start server

const transport = new StdioServerTransport();
await server.connect(transport);
