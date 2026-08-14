/**
 * @author fiskurxela
 * @desc helper for mmy aes-256
 * 
 * yay
 */
const fs = require('fs');

let counter = 0;

function walk(dir) {

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {

            const fullPath = dir + '/' + entry.name;
            
            if (entry.isDirectory()){
                walk(fullPath);
                continue;
            }

            if (entry.name.endsWith('.enc')) {
                counter++;
                console.log('Encrypted file found:', fullPath);
            }
        }
    }
    
    walk('.');
    console.log('Total encrypted files found:', counter);