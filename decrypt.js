/**
 * @author fiskurxela
 * @desc aes-256 for folder on desktop
 * 
 * ok this is for decrypting yay
 */

const crypto = require('crypto');
const fs = require('fs');

if (!fs.existsSync('.pepper')) { 
    console.log('No .pepper file found. Cannot decrypt w/o it.');
    process.exit(1);
}
let pepper = fs.readFileSync('.pepper');

//stuff used for getting password
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let password = '';
let counter = 0;
let failCounter = 0;

function askPassword() {
    return new Promise((resolve) => {
        console.log('Enter password:');

        //hide unser input
        rl._writeToOutput = function (stringToWrite) {
            if (stringToWrite.charCodeAt(0) === 13 || stringToWrite.includes('\n')){
                rl.output.write(stringToWrite);
            }
            else{
                rl.output.write('*');
            }
        };

        rl.question('', (answer) => {
            password = answer;
            rl.history = rl.history.slice(1); //prevents password from being stored in readline history

            //get rid of the like masking thingy
            rl._writeToOutput = function (stringToWrite) {
                rl.output.write(stringToWrite);
            };
            
            resolve();
        });
    });
}

askPassword().then(() => {

    const key = crypto.scryptSync(password, pepper, 32);
    
    function walk(dir) {
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
    
        for (const entry of entries) {

            const fullPath = dir + '/' + entry.name;

            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }

            if (!entry.name.endsWith('.enc')) continue;

            const ironFist = fs.readFileSync(fullPath); 
            const iv = ironFist.slice(0, 12); 
            const authTag = ironFist.slice(12, 28); 
            const encrypted = ironFist.slice(28); 

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            try {
                const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                const originalFilename = fullPath.slice(0, -4); 
                fs.writeFileSync(originalFilename, decrypted); 
                fs.unlinkSync(fullPath); 
                counter++;
                console.log('Decrypted:', fullPath);
            }
            catch (err) {
                console.log('Failed to decrypt (possibly due to wrong password):', fullPath);
                failCounter++;
            }
        }
    }

    walk('.');
    console.log('Decryption process completed. Decrypted', counter, 'files.');
    console.log('Failed to decrypt', failCounter, 'files.');
    rl.close();
});