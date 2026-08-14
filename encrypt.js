/**
 * @author fiskurxela
 * @desc aes-256 for folder on desktop
 * 
 * ok this is for encrypting the stuff yay
 */

const crypto = require('crypto');
const fs = require('fs');


//stuff used for getting password
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let password = '';
let counter = 0;

function askPassword() {
    return new Promise((resolve) => {
        console.log('Enter password:');

        //underneath is so that user input is hidden
        rl._writeToOutput = function (stringToWrite) {
            if (stringToWrite.charCodeAt(0) === 13 || stringToWrite.includes('\n')) {
                rl.output.write(stringToWrite);
            }
            else {
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

//pepper stuff outside of password stuff since it doesn't need it
let pepper;

if (fs.existsSync('.pepper')) {
    pepper = fs.readFileSync('.pepper');
}
else {
    pepper = crypto.randomBytes(16);
    fs.writeFileSync('.pepper', pepper);
}

askPassword().then(() => {

    const key = crypto.scryptSync(password, pepper, 32);

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {

            const fullPath = dir + '/' + entry.name;
            
            if (entry.isDirectory()){
                walk(fullPath);
                continue;
            }
    
            if (entry.name === '.pepper') continue;      // skip the salt file
            if (entry.name.endsWith('.enc')) continue;   // skip already-encrypted files
            if (entry.name === 'encrypt.js') continue;   // skip the script itself
            if (entry.name === 'decrypt.js') continue;  // ^
            if (entry.name === 'findenc.js') continue;  // ^
            if (entry.name === 'pepper.js') continue;  // ^

            const plainText = fs.readFileSync(fullPath); //buffer!
            const iv = crypto.randomBytes(12);

            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
            const authTag = cipher.getAuthTag();

            fs.writeFileSync(fullPath + '.enc', Buffer.concat([iv, authTag, encrypted]));
            fs.unlinkSync(fullPath); //delete original file
            counter++;
            console.log('Encrypted:', fullPath);
        }
    }
    
    walk('.');
    console.log('Encryption process completed. Encrypted', counter, 'files.');
    rl.close();
});
