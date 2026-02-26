
const https = require('https');

const urls = [
    'https://pollinations.ai/p/cat',
    'https://image.pollinations.ai/prompt/cat',
    'https://image.pollinations.ai/prompt/cat?nologo=true'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`URL: ${url} - Status: ${res.statusCode} - Content-Type: ${res.headers['content-type']}`);
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`  -> Redirects to: ${res.headers.location}`);
        }
    }).on('error', (e) => {
        console.error(`URL: ${url} - Error: ${e.message}`);
    });
});
