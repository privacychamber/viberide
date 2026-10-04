const fs = require('fs');
const ftp = require('basic-ftp');

async function run() {
    const c = new ftp.Client();
    try {
        await c.access({
            host: '103.86.176.168',
            user: 'Viberideftp@viberide.in',
            password: '$trong@pa$$'
        });
        await c.downloadTo('login.php.txt', '/api/auth/login.php');
        console.log(fs.readFileSync('login.php.txt', 'utf8'));
    } finally {
        c.close();
    }
}
run();
