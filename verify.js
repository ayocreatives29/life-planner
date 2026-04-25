#!/usr/bin/env node

/**
 * Simple validity checker for the Life Planner app
 * Ensures all required files exist and are properly linked
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

const requiredFiles = [
    'index.html',
    'app.js',
    'styles.css',
    'README.md'
];

console.log('🔍 Verifying Life Planner installation...\n');

let allGood = true;

requiredFiles.forEach(file => {
    const filePath = path.join(BASE_DIR, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);

    if (!exists) allGood = false;
});

// Check index.html links
console.log('\n🔗 Checking file references in index.html...\n');

const htmlContent = fs.readFileSync(path.join(BASE_DIR, 'index.html'), 'utf8');

const jsMatch = htmlContent.match(/<script[^>]+src="([^"]+)"[^>]*>/g);
const cssMatch = htmlContent.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/g);

if (jsMatch) {
    jsMatch.forEach(tag => {
        const match = tag.match(/src="([^"]+)"/);
        if (match) {
            const src = match[1];
            if (!src.startsWith('http')) {
                const exists = fs.existsSync(path.join(BASE_DIR, src));
                console.log(`${exists ? '✅' : '❌'} JS: ${src}`);
                if (!exists) allGood = false;
            } else {
                console.log(`✅ External JS: ${src}`);
            }
        }
    });
}

if (cssMatch) {
    cssMatch.forEach(tag => {
        const match = tag.match(/href="([^"]+)"/);
        if (match) {
            const href = match[1];
            if (!href.startsWith('http')) {
                const exists = fs.existsSync(path.join(BASE_DIR, href));
                console.log(`${exists ? '✅' : '❌'} CSS: ${href}`);
                if (!exists) allGood = false;
            } else {
                console.log(`✅ External CSS: ${href}`);
            }
        }
    });
}

console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('✅ All checks passed! App is ready.');
    console.log('\n📝 To run the app:');
    console.log('   1. Open index.html in a browser, OR');
    console.log('   2. Run: node start.js');
    console.log('   3. Visit http://localhost:3000');
} else {
    console.log('❌ Some checks failed. Please fix missing files.');
    process.exit(1);
}
