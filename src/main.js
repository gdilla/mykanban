const { app, BrowserWindow, Notification, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let reminderInterval;

// Paths for data storage
const userDataPath = app.getPath('userData');
const dataPath = path.join(userDataPath, 'kanban-data.json');
const summariesPath = path.join(userDataPath, 'summaries');

// Ensure summaries directory exists
function ensureSummariesDir() {
    if (!fs.existsSync(summariesPath)) {
        fs.mkdirSync(summariesPath, { recursive: true });
    }
}

// Load data from file (tasks and tags)
function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            // Handle legacy format (array of tasks) vs new format ({ tasks, tags })
            if (Array.isArray(data)) {
                return { tasks: data, tags: [] };
            }
            return { tasks: data.tasks || [], tags: data.tags || [] };
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
    return { tasks: [], tags: [] };
}

// Save data to file (tasks and tags)
function saveData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving data:', e);
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
    const now = new Date();
    const overdue = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < now;
    });

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
    const dateStr = today.toISOString().split('T')[0];

    const done = tasks.filter(t => t.status === 'done');
    const todo = tasks.filter(t => t.status === 'todo');
    const doing = tasks.filter(t => t.status === 'doing');

    // Find tasks completed today (if we track completion date)
    const completedToday = done.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.startsWith(dateStr);
    });

    // Calculate total time spent today
    const totalTimeToday = completedToday.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

    // Check for overdue
    const overdue = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < today;
    });

    // Tomorrow's priorities (overdue + due tomorrow + oldest todos)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

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
            summary += `- ${t.content}${timeStr}\n`;
        });
        summary += `\n`;

        // Add time breakdown with percentages
        if (totalTimeToday > 0) {
            summary += `## ⏱️ Time Breakdown\n`;
            completedToday.forEach(t => {
                const percentage = ((t.timeSpent || 0) / totalTimeToday * 100).toFixed(1);
                summary += `- ${t.content}: ${formatDuration(t.timeSpent)} (${percentage}%)\n`;
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
            summary += `- ${t.content}${due}${inProgressTime}\n`;
        });
        summary += `\n`;
    }

    if (overdue.length > 0) {
        summary += `## ⚠️ OVERDUE\n`;
        overdue.forEach(t => {
            summary += `- ${t.content} (Was due: ${t.dueDate})\n`;
        });
        summary += `\n`;
    }

    summary += `## 📅 Tomorrow's Priorities\n`;
    if (overdue.length > 0) {
        summary += `### Overdue (tackle first!):\n`;
        overdue.slice(0, 3).forEach(t => {
            summary += `- ${t.content}\n`;
        });
    }
    if (dueTomorrow.length > 0) {
        summary += `### Due Tomorrow:\n`;
        dueTomorrow.forEach(t => {
            summary += `- ${t.content}\n`;
        });
    }
    if (doing.length > 0) {
        summary += `### Continue working on:\n`;
        doing.slice(0, 3).forEach(t => {
            summary += `- ${t.content}\n`;
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
            const tagCompletedToday = tagDone.filter(t => t.completedAt && t.completedAt.startsWith(dateStr));
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

    const summaryFile = path.join(summariesPath, `summary-${dateStr}.md`);
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

// Schedule reminders and summary
function setupScheduler() {
    // Check every minute for scheduled tasks
    setInterval(() => {
        const now = new Date();
        const minutes = now.getMinutes();
        const hour = now.getHours();

        // 30-minute reminders during work hours
        if ((minutes === 0 || minutes === 30) && isWorkHours()) {
            showReminder();
        }

        // 9pm daily summary
        if (hour === 21 && minutes === 0) {
            generateDailySummary();
        }
    }, 60000); // Check every minute

    // Initial reminder if within work hours
    if (isWorkHours()) {
        setTimeout(showReminder, 5000); // Show after 5 seconds on startup
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// IPC handlers for renderer
ipcMain.handle('load-data', () => loadData());
ipcMain.handle('save-data', (event, data) => {
    saveData(data);
    return true;
});
ipcMain.handle('get-paths', () => ({
    data: dataPath,
    summaries: summariesPath
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

// Read a specific summary file
ipcMain.handle('read-summary', async (event, filename) => {
    const filePath = path.join(summariesPath, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    return null;
});

app.whenReady().then(() => {
    ensureSummariesDir();
    createWindow();
    setupScheduler();

    // Register global Cmd+T hotkey for quick add
    globalShortcut.register('CommandOrControl+T', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('quick-add-task');
        }
    });

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
