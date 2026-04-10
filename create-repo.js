const { execSync } = require('child_process');
const https = require('https');

// Get git credentials via PowerShell
const cred = execSync(`powershell -Command "echo \\"protocol=https\`nhost=github.com\`n\\" | git credential fill"`, { encoding: 'utf8' });
const tokenMatch = cred.match(/password=(.+)/);
if (!tokenMatch) { console.error('No token found'); process.exit(1); }
const token = tokenMatch[1].trim();

const data = JSON.stringify({ name: 'json-content-manager', private: false, description: 'JSON Content Manager UI' });
const options = {
    hostname: 'api.github.com',
    path: '/user/repos',
    method: 'POST',
    headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'node-script',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const j = JSON.parse(body);
        if (j.html_url) console.log('Created:', j.html_url);
        else if (j.errors) console.log('Error:', j.message, j.errors.map(e=>e.message).join(', '));
        else console.log('Response:', j.message || body.substring(0, 200));
    });
});
req.on('error', e => console.error('Request error:', e.message));
req.write(data);
req.end();
