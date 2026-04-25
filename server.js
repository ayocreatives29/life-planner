const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json());

// Enable CORS for all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Static files
app.use(express.static(__dirname));

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return content ? JSON.parse(content) : [];
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/tasks', (req, res) => {
    try {
        const tasks = readData();
        res.json(tasks);
    } catch (err) {
        console.error('Error reading tasks:', err);
        res.json([]);
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const tasks = req.body;
        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks must be an array' });
        }
        writeData(tasks);
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving tasks:', err);
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planner server running at http://localhost:${PORT}`);
    console.log(`Access from other devices: http://<your-computer-ip>:${PORT}`);
});
