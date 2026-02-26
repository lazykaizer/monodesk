const { generatePitchDeckImage } = require('./app/actions/gemini.ts');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function test() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('test-log.txt', msg + '\n');
    };

    try {
        fs.writeFileSync('test-log.txt', 'Starting Test...\n');
        log("Starting Image Gen Test...");
        const result = await generatePitchDeckImage("Futuristic office with glowing blue neon lights");
        log("Success! Image data length: " + (result ? result.length : 'null'));
    } catch (error) {
        log("Test Failed: " + error.message);
        if (error.cause) log("Cause: " + error.cause);
    }
}

test();
