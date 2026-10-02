import * as fs from 'fs';
import * as path from 'path';

function fixLineEndings(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    fs.writeFileSync(filePath, content);
}

fixLineEndings(path.resolve('api/process/r/index.php'));
fixLineEndings(path.resolve('api/process/l/index.php'));
console.log("Line endings fixed.");
