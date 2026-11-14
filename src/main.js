const { app, BrowserWindow, Notification, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { localDateStr, completedOn, isOverdue, summaryFileName, summaryTime } = require('./dates');

let mainWindow;
let reminderInterval;

// Paths for data storage
const userDataPath = app.getPath('userData');
const dataPath = path.join(userDataPath, 'kanban-data.json');
const summariesPath = path.join(userDataPath, 'summaries');
const imagesPath = path.join(userDataPath, 'images');

// Ensure summaries directory exists
function ensureSummariesDir() {
    if (!fs.existsSync(summariesPath)) {
        fs.mkdirSync(summariesPath, { recursive: true });
    }
}

// Ensure images directory exists
function ensureImagesDir() {
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
    }
}

const store = require('./store.js');

// Lenient read for reminders and summaries: never throws, never writes.
// The renderer loads through the strict `load-data` handler instead.
function loadData() {
    try {
        return store.load(dataPath);
    } catch (e) {
        console.error('Error loading data:', e);
        return { tasks: [], tags: [] };
    }
}

// Check if current time is within work hours (8am-5pm)
function isWorkHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 17;
}

// Format duration in ms to human readable
function formatDuration(ms) {
    if (!ms || ms < 0) return '< 1m';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
        const remainingMins = minutes % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    if (minutes > 0) {
        return `${minutes}m`;
    }
    return '< 1m';
}

// Show reminder notification
function showReminder() {
    if (!isWorkHours()) return;

    const tasks = loadData().tasks;
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const doingCount = tasks.filter(t => t.status === 'doing').length;

    // Check for overdue tasks
    const todayStr = localDateStr(new Date());
    const overdue = tasks.filter(t => isOverdue(t, todayStr));

    let body = `📋 To Do: ${todoCount} | 🔄 In Progress: ${doingCount}`;
    if (overdue.length > 0) {
        body += `\n⚠️ ${overdue.length} overdue task(s)!`;
    }

    const notification = new Notification({
        title: '⏰ Kanban Check-in',
        body: body,
        silent: false
    });

    notification.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    notification.show();
}

// Generate daily summary at 9pm
function generateDailySummary() {
    ensureSummariesDir();

    const tasks = loadData().tasks;
    const today = new Date();
    const dateStr = localDateStr(today);

    const done = tasks.filter(t => t.status === 'done');
    const todo = tasks.filter(t => t.status === 'todo');
    const doing = tasks.filter(t => t.status === 'doing');

    // Find tasks completed today (local date)
    const completedToday = done.filter(t => completedOn(t, dateStr));

    // Calculate total time spent today
    const totalTimeToday = completedToday.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

    // Check for overdue
    const overdue = tasks.filter(t => isOverdue(t, dateStr));

    // Tomorrow's priorities (overdue + due tomorrow + oldest todos)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = localDateStr(tomorrow);

    const dueTomorrow = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return t.dueDate.startsWith(tomorrowStr);
    });

    let summary = `# Daily Summary - ${dateStr}\n\n`;
    summary += `Generated at ${today.toLocaleTimeString()}\n\n`;

    summary += `## 📊 Overview\n`;
    summary += `- Total tasks: ${tasks.length}\n`;
    summary += `- To Do: ${todo.length}\n`;
    summary += `- In Progress: ${doing.length}\n`;
    summary += `- Done: ${done.length}\n`;
    if (totalTimeToday > 0) {
        summary += `- Time tracked today: ${formatDuration(totalTimeToday)}\n`;
    }
    summary += `\n`;

    if (completedToday.length > 0) {
        summary += `## ✅ Completed Today\n`;
        completedToday.forEach(t => {
            const timeStr = t.timeSpent ? ` (${formatDuration(t.timeSpent)})` : '';
            summary += `- ${t.title}${timeStr}\n`;
        });
        summary += `\n`;

        // Add time breakdown with percentages
        if (totalTimeToday > 0) {
            summary += `## ⏱️ Time Breakdown\n`;
            completedToday.forEach(t => {
                const percentage = ((t.timeSpent || 0) / totalTimeToday * 100).toFixed(1);
                summary += `- ${t.title}: ${formatDuration(t.timeSpent)} (${percentage}%)\n`;
            });
            summary += `\n**Total:** ${formatDuration(totalTimeToday)}\n\n`;
        }
    } else {
        summary += `## ✅ Completed Today\n`;
        summary += `No tasks marked complete today.\n\n`;
    }

    if (doing.length > 0) {
        summary += `## 🔄 Currently In Progress\n`;
        doing.forEach(t => {
            const due = t.dueDate ? ` (Due: ${t.dueDate})` : '';
            // Calculate current time in progress
            let inProgressTime = '';
            if (t.startedAt) {
                const elapsed = new Date().getTime() - new Date(t.startedAt).getTime();
                inProgressTime = ` [In progress: ${formatDuration(elapsed)}]`;
            }
            summary += `- ${t.title}${due}${inProgressTime}\n`;
        });
        summary += `\n`;
    }

    if (overdue.length > 0) {
        summary += `## ⚠️ OVERDUE\n`;
        overdue.forEach(t => {
            summary += `- ${t.title} (Was due: ${t.dueDate})\n`;
        });
        summary += `\n`;
    }

    summary += `## 📅 Tomorrow's Priorities\n`;
    if (overdue.length > 0) {
        summary += `### Overdue (tackle first!):\n`;
        overdue.slice(0, 3).forEach(t => {
            summary += `- ${t.title}\n`;
        });
    }
    if (dueTomorrow.length > 0) {
        summary += `### Due Tomorrow:\n`;
        dueTomorrow.forEach(t => {
            summary += `- ${t.title}\n`;
        });
    }
    if (doing.length > 0) {
        summary += `### Continue working on:\n`;
        doing.slice(0, 3).forEach(t => {
            summary += `- ${t.title}\n`;
        });
    }
    if (overdue.length === 0 && dueTomorrow.length === 0 && doing.length === 0) {
        summary += `Review your To Do list and pick your top priorities.\n`;
    }

    // Per-Tag Summary Section
    const tagData = loadData().tags || [];
    if (tagData.length > 0) {
        summary += `\n## 🏷️ By Tag\n\n`;

        tagData.forEach(tag => {
            const tagTasks = tasks.filter(t => t.tags && t.tags.includes(tag.id));
            const tagDone = tagTasks.filter(t => t.status === 'done');
            const tagDoing = tagTasks.filter(t => t.status === 'doing');
            const tagTodo = tagTasks.filter(t => t.status === 'todo');
            const tagCompletedToday = tagDone.filter(t => completedOn(t, dateStr));
            const tagTimeSpent = tagTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

            if (tagTasks.length > 0) {
                summary += `### ${tag.name}\n`;
                summary += `- Total: ${tagTasks.length} (Done: ${tagDone.length}, In Progress: ${tagDoing.length}, To Do: ${tagTodo.length})\n`;
                if (tagCompletedToday.length > 0) {
                    summary += `- Completed today: ${tagCompletedToday.length}\n`;
                }
                if (tagTimeSpent > 0) {
                    summary += `- Time tracked: ${formatDuration(tagTimeSpent)}\n`;
                }
                summary += '\n';
            }
        });

        // Untagged tasks
        const untaggedTasks = tasks.filter(t => !t.tags || t.tags.length === 0);
        if (untaggedTasks.length > 0) {
            const untaggedDone = untaggedTasks.filter(t => t.status === 'done');
            const untaggedDoing = untaggedTasks.filter(t => t.status === 'doing');
            const untaggedTodo = untaggedTasks.filter(t => t.status === 'todo');
            summary += `### Untagged\n`;
            summary += `- Total: ${untaggedTasks.length} (Done: ${untaggedDone.length}, In Progress: ${untaggedDoing.length}, To Do: ${untaggedTodo.length})\n\n`;
        }
    }

    summary += `\n---\n`;
    summary += `Data stored at: ${dataPath}\n`;
    summary += `Summaries stored at: ${summariesPath}\n`;

    const summaryFile = path.join(summariesPath, summaryFileName(today));
    fs.writeFileSync(summaryFile, summary);

    // Show notification about summary
    const notification = new Notification({
        title: '📝 Daily Summary Generated',
        body: `Completed: ${completedToday.length} | Time tracked: ${formatDuration(totalTimeToday)}`,
        silent: false
    });
    notification.show();

    return summaryFile;
}

// Write today's summary once it is due (9pm) and has not been written since then.
// Checked on every tick and at startup, so a Mac that was asleep at 9pm catches up when it wakes.
// ponytail: same-evening catch-up only; a Mac asleep through midnight skips that day.
// Give generateDailySummary a date and also check yesterday if that matters.
function writeSummaryIfDue() {
    try {
        const now = new Date();
        if (now < summaryTime(now)) return;
        const file = fs.statSync(path.join(summariesPath, summaryFileName(now)), { throwIfNoEntry: false });
        // A manual summary from earlier in the day does not count as tonight's
        if (!file || file.mtime < summaryTime(now)) generateDailySummary();
    } catch (e) {
        console.error('Error writing daily summary:', e);
    }
}

// Schedule reminders and summary
function setupScheduler() {
    // Check every minute for scheduled tasks
    setInterval(() => {
        const minutes = new Date().getMinutes();

        // 30-minute reminders during work hours
        if ((minutes === 0 || minutes === 30) && isWorkHours()) {
            showReminder();
        }

        writeSummaryIfDue();
    }, 60000); // Check every minute

    writeSummaryIfDue();

    // Initial reminder if within work hours
    if (isWorkHours()) {
        setTimeout(showReminder, 5000); // Show after 5 seconds on startup
    }
}

function createWindow() {
    const isMac = process.platform === 'darwin';
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 560,
        minHeight: 400,
        // The renderer's 52px header is the title bar: it is the drag region and leaves
        // 80px on the left for the traffic lights, which this centres in it.
        ...(isMac && { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 18, y: 18 } }),
        // Painted before the page loads, so there is no white flash.
        // ponytail: page colour of the default dark/light palette, so a user-picked palette of the
        // other kind flashes once; have the renderer report its --c-bg over IPC if that ever matters.
        backgroundColor: require('electron').nativeTheme.shouldUseDarkColors ? '#0c0d14' : '#e8e8ed',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // In dev mode with electron-vite, load from Vite dev server
    // In production, load the built renderer index.html
    if (process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// IPC handlers for renderer
// File text the renderer last loaded or saved (null = no file, undefined = the last load failed).
// Anything else on disk is someone else's change.
let lastSeen = null;
let knownTaskIds = null; // null until the first load, so launch does not announce every task

ipcMain.handle('load-data', () => {
    try {
        const text = store.read(dataPath);
        const data = store.parse(text);
        lastSeen = text;
        notifyNewTasks(data.tasks);
        return data;
    } catch (e) {
        lastSeen = undefined; // matches nothing: every save is refused, and the watcher reloads when the file is fixed
        return { error: `${dataPath}: ${e.message}` };
    }
});

// Resolves false when the write was refused because the file changed underneath; the renderer then reloads.
// ponytail: whole-file compare, so the refused UI change is dropped and disk wins. Merge per task if that ever bites.
ipcMain.handle('save-data', (event, data) => {
    const text = store.saveIfFresh(dataPath, data, lastSeen);
    if (text === null) return false;
    lastSeen = text;
    knownTaskIds = new Set(data.tasks.map(t => t.id));
    return true;
});
ipcMain.handle('get-paths', () => ({
    data: dataPath,
    summaries: summariesPath,
    images: imagesPath
}));
ipcMain.handle('generate-summary', () => generateDailySummary());

// List all summary files
ipcMain.handle('list-summaries', async () => {
    ensureSummariesDir();
    const files = fs.readdirSync(summariesPath)
        .filter(f => f.endsWith('.md'))
        .sort().reverse();
    return files;
});

// Handlers below take a filename from the renderer: safeJoin rejects anything
// that is not a bare filename, so they cannot reach outside their directory.
const { shell } = require('electron');
const { safeJoin, isAttachmentReferenced } = require('./file-guards');

// Read a specific summary file
ipcMain.handle('read-summary', async (event, filename) => {
    const filePath = safeJoin(summariesPath, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    return null;
});

// Image handlers
ipcMain.handle('save-image', async (event, base64Data) => {
    ensureImagesDir();
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid image data');
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${ext}`;
    const filePath = path.join(imagesPath, filename);
    fs.writeFileSync(filePath, buffer);
    return filename;
});

ipcMain.handle('load-image', async (event, filename) => {
    const filePath = safeJoin(imagesPath, filename);
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).slice(1);
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
});

// Delete an attachment file. Resolves to false, deleting nothing, while a task in
// the saved board still lists it: the renderer's save is debounced and can be
// refused, so "removed in the window" is not yet "removed on disk". An unreadable
// data file throws, which also deletes nothing.
ipcMain.handle('delete-image', async (event, filename) => {
    const filePath = safeJoin(imagesPath, filename);
    const savedBoard = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : [];
    if (isAttachmentReferenced(savedBoard, filename)) return false;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return true;
});

// Open an attachment with the system default app. Resolves to '' on success,
// or an error message (e.g. the file is missing).
ipcMain.handle('open-attachment', async (event, filename) => {
    const filePath = safeJoin(imagesPath, filename);
    if (!fs.existsSync(filePath)) return 'File not found';
    return shell.openPath(filePath);
});

// Generic file save handler (for non-image attachments)
ipcMain.handle('save-file', async (event, { base64Data, originalName, mimeType }) => {
    ensureImagesDir();
    const ext = path.extname(originalName) || '.bin';
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`;
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(imagesPath, filename);
    fs.writeFileSync(filePath, buffer);
    return filename;
});

// Announce tasks that reached the board from outside the app (e.g. the MCP server)
function notifyNewTasks(tasks) {
    const newTasks = knownTaskIds ? tasks.filter(t => !knownTaskIds.has(t.id)) : [];
    knownTaskIds = new Set(tasks.map(t => t.id));
    if (newTasks.length === 0) return;

    const notification = new Notification({
        title: `📋 ${newTasks.length} new task${newTasks.length > 1 ? 's' : ''} added`,
        body: newTasks.map(t => t.title).join(', '),
        silent: false
    });
    notification.on('click', () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    });
    notification.show();
}

// Watch the data directory, not the file: an atomic save replaces the inode, which a file watch loses.
function startFileWatcher() {
    let debounce = null;
    fs.watch(userDataPath, (eventType, filename) => {
        if (filename && filename !== path.basename(dataPath)) return;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
            let onDisk;
            try { onDisk = store.read(dataPath); } catch (e) { return; }
            if (!store.isStale(onDisk, lastSeen)) return; // our own save, or nothing new
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('data-changed-external');
            }
        }, 100);
    });
}

app.whenReady().then(() => {
    ensureSummariesDir();
    ensureImagesDir();
    createWindow();
    startFileWatcher();
    setupScheduler();

    // Global quick-add hotkey: Control+Option+K (not Cmd+T, which is "new tab" in every other app)
    const quickAddKey = 'Control+Alt+K';
    const registered = globalShortcut.register(quickAddKey, () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('quick-add-task');
        }
    });
    if (!registered) {
        console.error(`Global shortcut ${quickAddKey} could not be registered (already taken by another app?)`);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Show window when clicking notification
app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    }
});
