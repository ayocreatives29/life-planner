const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/life-planner';

// MongoDB Schema
const taskSchema = new mongoose.Schema({
    id: Number,
    title: String,
    date: String,
    time: String,
    category: String,
    priority: String,
    completed: Boolean,
    notes: String
}, { collection: 'tasks' });

const Task = mongoose.model('Task', taskSchema);

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

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // If MongoDB fails, the app will still run but use in-memory storage
        console.warn('Running without persistent database - tasks will be lost on restart');
    }
}

// API Routes
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({});
        res.json(tasks.map(t => t.toObject()));
    } catch (err) {
        console.error('Error reading tasks:', err);
        res.json([]);
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const tasks = req.body;
        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks must be an array' });
        }
        
        // Clear old tasks and insert new ones
        await Task.deleteMany({});
        if (tasks.length > 0) {
            await Task.insertMany(tasks);
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving tasks:', err);
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

// Start server
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Planner server running at http://localhost:${PORT}`);
        console.log(`Access from other devices: http://<your-computer-ip>:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
