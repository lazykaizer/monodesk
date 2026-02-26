const https = require('https');

const apiKey = "AIzaSyAC3gnrzRPdOImjW4_2n5Rm7Ji1z4QC4kQ";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
                return;
            }

            const veos = json.models?.filter(m => m.name.includes('veo'));

            if (veos && veos.length > 0) {
                veos.forEach(v => {
                    console.log('Veo Model Found:', v.name);
                    console.log('Supported Methods:', JSON.stringify(v.supportedGenerationMethods, null, 2));
                });
            } else {
                console.log('Veo model not found in list.');
                // Log all model names to be sure
                if (json.models) {
                    console.log('All Models:', json.models.map(m => m.name));
                } else {
                    console.log("No models property in JSON");
                }
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error('Network Error:', e);
});
