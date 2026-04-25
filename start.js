#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const DIR = __dirname;

function startServer() {
    console.log('Starting Toby\'s Life Planner...\n');

    // Check if index.html exists
    if (!fs.existsSync(path.join(DIR, 'index.html'))) {
        console.error('Error: index.html not found!');
        process.exit(1);
    }

    console.log(`Server starting at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop\n');

    // Try using 'serve' package first, fallback to Python
    const serve = spawn('npx', ['serve', '.', '-p', PORT], {
        stdio: 'inherit',
        shell: true,
        cwd: DIR
    });

    serve.on('error', (err) => {
        console.error('Failed to start server:', err.message);
        console.log('\nFalling back to Python HTTP server...\n');

        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const python = spawn(pythonCmd, ['-m', 'http.server', PORT.toString()], {
            stdio: 'inherit',
            shell: true,
            cwd: DIR
        });

        python.on('error', (err) => {
            console.error('Python not available. Please install Node.js or Python.');
            process.exit(1);
        });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        process.exit(0);
    });
}

startServer();
