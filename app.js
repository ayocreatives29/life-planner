// Life Planner Application
// Toby - 2026

const CONFIG = {
    apiBase: '/api',
    storageKey: 'life_planner_tasks',
    google: {
        clientId: '', // Add your Google OAuth client ID here
        apiKey: '',
        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        scopes: 'https://www.googleapis.com/auth/calendar.events'
    }
};

let tasks = [];
let editingTaskId = null;
let expandedTaskId = null;
let googleEvents = [];
let isAuthorized = false;
let tokenClient = null;
let gapiInited = false;
let gisInited = false;

// ==================== Initialization ====================

function getLocalISOString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function init() {
    await loadTasks();
    renderDashboard();
    setupEventListeners();
    loadGoogleScripts();
}

function getDefaultTasks() {
    return [
        {
            id: Date.now() - 86400000 * 3,
            title: "EcoSys Weekly Sync",
            date: getLocalISOString(),
            time: "11:30",
            category: "work",
            priority: "high",
            completed: false,
            notes: "Review Q1 metrics and planning"
        },
        {
            id: Date.now() - 86400000 * 2,
            title: "Family Dinner - Mom",
            date: getLocalISOString(new Date(Date.now() + 86400000)),
            time: "18:00",
            category: "family",
            priority: "medium",
            completed: false,
            notes: "Bring dessert"
        },
        {
            id: Date.now() - 86400000,
            title: "Life Group Prep",
            date: getLocalISOString(new Date(Date.now() + 86400000 * 2)),
            time: "19:00",
            category: "ministry",
            priority: "high",
            completed: false,
            notes: "Prepare discussion questions"
        },
        {
            id: Date.now(),
            title: "Gym - Leg Day",
            date: getLocalISOString(),
            time: "06:30",
            category: "personal",
            priority: "medium",
            completed: false,
            notes: "Focus on squats and lunges"
        },
        {
            id: Date.now() + 86400000,
            title: "Project Deadline - Submit Specs",
            date: getLocalISOString(new Date(Date.now() + 86400000 * 5)),
            category: "work",
            priority: "high",
            completed: false,
            notes: "Final spec document for client"
        },
        {
            id: Date.now() + 86400000 * 3,
            title: "Awaiting: Legal documents from Dhaval",
            date: getLocalISOString(new Date(Date.now() + 86400000 * 7)),
            category: "awaiting",
            priority: "high",
            completed: false,
            notes: "Contract review - follow up Wednesday"
        }
    ];
}

async function saveTasks() {
    try {
        const response = await fetch(CONFIG.apiBase + '/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
        if (!response.ok) throw new Error('Failed to save');
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(tasks));
        // Broadcast to other tabs
        window.dispatchEvent(new Event('tasks-updated'));
    } catch (err) {
        console.error('Save failed, using localStorage:', err);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(tasks));
    }
}

async function loadTasks() {
    try {
        const response = await fetch(CONFIG.apiBase + '/tasks');
        if (response.ok) {
            const data = await response.json();
            if (data) {
                tasks = data;
                localStorage.setItem(CONFIG.storageKey, JSON.stringify(tasks));
                return;
            }
        }
    } catch (err) {
        console.error('Load failed, using localStorage:', err);
    }
    const saved = localStorage.getItem(CONFIG.storageKey);
    if (saved) {
        tasks = JSON.parse(saved);
    } else {
        tasks = getDefaultTasks();
        await saveTasks();
    }
}

// ==================== Modal Management ====================

function openModal(taskId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('taskModal');
    modal.classList.add('active');

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDate').value = task.date;
            document.getElementById('taskTime').value = task.time || '';
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskNotes').value = task.notes || '';
        }
    } else {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDate').value = getLocalISOString();
        document.getElementById('taskTime').value = '';
        document.getElementById('taskCategory').value = 'work';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskNotes').value = '';
    }

    document.getElementById('taskTitle').focus();
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    editingTaskId = null;
}

async function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return;

    const taskData = {
        title,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        notes: document.getElementById('taskNotes').value.trim()
    };

    if (editingTaskId) {
        tasks = tasks.map(t => t.id === editingTaskId ? { ...t, ...taskData } : t);
    } else {
        tasks.push({
            id: Date.now(),
            ...taskData,
            completed: false
        });
    }

    await saveTasks();
    renderDashboard();
    closeModal();
    showToast(editingTaskId ? 'Task updated!' : 'Task created!');
}

// ==================== Task Operations ====================

async function toggleTask(id) {
    const response = await fetch(CONFIG.apiBase + '/tasks');
    if (response.ok) {
        const data = await response.json();
        if (data) tasks = data;
    }
    
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    await saveTasks();
    renderDashboard();
}

async function deleteTask(id) {
    if (confirm('Delete this task?')) {
        const response = await fetch(CONFIG.apiBase + '/tasks');
        if (response.ok) {
            const data = await response.json();
            if (data) tasks = data;
        }
        
        tasks = tasks.filter(t => t.id !== id);
        await saveTasks();
        renderDashboard();
        showToast('Task deleted');
    }
}

async function clearCompleted() {
    const response = await fetch(CONFIG.apiBase + '/tasks');
    if (response.ok) {
        const data = await response.json();
        if (data) tasks = data;
    }
    
    if (tasks.some(t => t.completed)) {
        if (confirm('Clear all completed tasks?')) {
            tasks = tasks.filter(t => !t.completed);
            await saveTasks();
            renderDashboard();
            showToast('Completed tasks cleared');
        }
    }
}

function exportData() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-planner-${getLocalISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
}

// ==================== Rendering ====================

function renderDashboard() {
    const now = new Date();
    const todayStr = getLocalISOString(now);

    document.getElementById('currentDateDisplay').textContent =
        now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const allTasks = [...tasks, ...googleEvents];
    const todayTasks = allTasks.filter(t => t.date === todayStr && t.category !== 'awaiting')
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    renderTodayStrip(todayTasks, todayStr);
    renderWeeklyGrid(allTasks, now);
    renderHorizon(allTasks, now);
    renderAwaiting(allTasks);
    renderStats(allTasks);
}

function renderTodayStrip(tasks, todayStr) {
    const container = document.getElementById('todayStrip');
    const countBadge = document.getElementById('todayCount');

    const incomplete = tasks.filter(t => !t.completed).length;
    countBadge.textContent = `${incomplete} REMAINING`;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="min-w-[280px] h-32 bg-white rounded-xl border border-gray-200 border-dashed flex items-center justify-center">
                <p class="text-gray-400 text-sm">No tasks scheduled for today</p>
            </div>`;
        return;
    }

    container.innerHTML = tasks.map(task => createTaskCard(task, true)).join('');
}

function renderWeeklyGrid(allTasks, now) {
    const container = document.getElementById('weeklyGrid');
    let html = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const dateStr = getLocalISOString(date);
        const dayTasks = allTasks.filter(t => t.date === dateStr)
            .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

        const isToday = i === 0;

        html += `
            <div class="flex-shrink-0 w-72 bg-white rounded-2xl border ${isToday ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100'} shadow-sm p-5">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${date.toLocaleDateString('en-AU', { weekday: 'short' })}</span>
                    <span class="text-xl font-serif font-bold text-gray-800">${date.getDate()}</span>
                </div>
                <div class="space-y-3 min-h-[200px]">
                    ${dayTasks.map(t => createTaskCard(t, false)).join('')}
                    ${dayTasks.length === 0 ? `
                        <div class="h-24 flex items-center justify-center text-gray-200 text-xs uppercase tracking-widest">
                            Clear day
                        </div>` : ''
                    }
                </div>
            </div>`;
    }

    container.innerHTML = html;
}

function renderHorizon(allTasks, now) {
    const tbody = document.getElementById('horizonBody');
    const horizonTasks = allTasks
        .filter(t => {
            const taskDate = new Date(t.date);
            return taskDate > now && t.category !== 'awaiting';
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10);

    tbody.innerHTML = horizonTasks.map(task => `
        <tr class="horizon-row cursor-pointer" onclick='openModal(${task.id})'>
            <td class="p-4">
                <div class="text-sm font-medium text-gray-900">${formatDate(task.date)}</div>
            </td>
            <td class="p-4">
                <div class="text-sm font-semibold text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}">
                    ${task.title}
                </div>
            </td>
            <td class="p-4">
                <span class="badge badge-${task.category}">${task.category}</span>
            </td>
            <td class="p-4">
                <span class="priority-dot priority-${task.priority}" title="${task.priority}"></span>
            </td>
        </tr>
    `).join('');
}

function renderAwaiting(allTasks) {
    const container = document.getElementById('awaitingList');
    const awaiting = allTasks.filter(t => t.category === 'awaiting');

    if (awaiting.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                <p class="text-sm text-gray-500">No pending responses</p>
            </div>`;
        return;
    }

    container.innerHTML = awaiting.map(task => `
        <div class="bg-red-50 rounded-xl p-4 border-l-4 border-red-500 relative group hover:shadow-md transition">
            <button onclick="deleteTask(${task.id})"
                    class="absolute top-3 right-3 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold flex-shrink-0">!</div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-800 leading-tight">${task.title}</p>
                    <p class="text-xs text-red-700 mt-1 italic">${task.notes || 'Awaiting response'}</p>
                    <p class="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">Due: ${formatDate(task.date)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStats(allTasks) {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function createTaskCard(task, isStrip) {
    return `
        <div onclick="toggleTask(${task.id})"
             class="task-card flex-1 min-w-[250px] ${isStrip ? 'p-4' : 'p-4'} bg-white rounded-xl border border-gray-100 shadow-sm category-${task.category} ${task.completed ? 'completed' : ''}">
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 flex-1">
                    <div class="w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center mt-0.5 flex-shrink-0">
                        ${task.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>' : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="task-title text-sm font-bold text-gray-900 leading-snug">${task.title}</p>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                            <span class="text-[10px] text-gray-500 uppercase tracking-wide">${task.time ? formatTime(task.time) : ''}</span>
                            <span class="text-[10px] text-gray-300">•</span>
                            <span class="badge badge-${task.category}">${task.category}</span>
                            ${task.priority ? `<span class="priority-dot priority-${task.priority}" title="${task.priority}"></span>` : ''}
                        </div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); openModal(${task.id})"
                        class="text-gray-300 hover:text-blue-500 transition p-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// ==================== Utilities ====================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatTime(timeStr) {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.animation = 'fadeIn 0.3s ease';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    window.onclick = (e) => {
        const modal = document.getElementById('taskModal');
        if (modal && e.target === modal) closeModal();
    };

    // Sync when tab becomes visible (after switching from phone to laptop, etc.)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadTasks().then(() => renderDashboard());
        }
    });

    // Listen for updates from other tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === CONFIG.storageKey) {
            loadTasks().then(() => renderDashboard());
        }
    });

    // Poll for updates every 5 seconds
    setInterval(() => {
        loadTasks().then(() => renderDashboard());
    }, 5000);
}

// ==================== Google Calendar Integration ====================

function loadGoogleScripts() {
    if (!CONFIG.google.clientId) return;

    try {
        const gapiScript = document.createElement('script');
        gapiScript.src = "https://apis.google.com/js/api.js";
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            if (typeof gapi !== 'undefined' && gapi.load) {
                gapi.load('client', () => {
                    gapi.client.init({
                        apiKey: CONFIG.google.apiKey,
                        discoveryDocs: [CONFIG.google.discoveryDoc],
                    }).then(() => {
                        gapiInited = true;
                    }).catch(e => console.error("GAPI init error", e));
                });
            }
        };
        document.head.appendChild(gapiScript);

        const gisScript = document.createElement('script');
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CONFIG.google.clientId,
                    scope: CONFIG.google.scopes,
                    callback: '',
                });
                gisInited = true;
            }
        };
        document.head.appendChild(gisScript);
    } catch (err) {
        console.error("Script loading error:", err);
    }
}

async function handleGoogleAuth() {
    if (!CONFIG.google.clientId) {
        showToast('Google sync not configured');
        return;
    }

    if (!gapiInited || !gisInited || !tokenClient) {
        showToast("Auth services loading... please wait.");
        return;
    }

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        isAuthorized = true;
        document.getElementById('googleSyncBtn').innerHTML = 'Syncing...';
        await listGoogleEvents();
    };

    if (typeof gapi !== 'undefined' && gapi.client) {
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }
}

async function listGoogleEvents() {
    if (!gapiInited || !gapi.client || !gapi.client.calendar) return;

    try {
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 20,
            orderBy: 'startTime',
        });

        const events = response.result.items || [];
        googleEvents = events.map(event => {
            const start = event.start.dateTime || event.start.date;
            const startDate = new Date(start);
            let category = 'google';
            const summary = (event.summary || "").toLowerCase();
            if (summary.includes('ministry') || summary.includes('church')) category = 'ministry';
            else if (summary.includes('meeting')) category = 'work';
            return {
                id: event.id,
                title: event.summary,
                date: getLocalISOString(startDate),
                time: event.start.dateTime ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
                category: category,
                notes: event.description || '',
                isGoogle: true
            };
        });

        const btn = document.getElementById('googleSyncBtn');
        if (btn) {
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.963H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.037l3.007-2.331z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.963L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Synced`;
        }

        renderDashboard();
        showToast('Google Calendar synced!');
    } catch (err) {
        console.error("Error fetching events:", err);
        const btn = document.getElementById('googleSyncBtn');
        if (btn) btn.innerHTML = 'Sync Failed';
        showToast('Sync failed. Please try again.');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);
