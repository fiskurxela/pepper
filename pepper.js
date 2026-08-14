/**
 * @author fiskurxela
 * @desc aes-256 but like all in one
 * 
 * yay let's hope i can make this work
 */
const crypto = require('crypto');
const fs = require('fs');

let pepper; //this is the salt lol is just a joke

const Mode = {
    ENCRYPT: 'e',
    DECRYPT: 'd',
    CHECK: 'c',
    EXIT: 'x'
};

let mode = '';

//shit used for getting password
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let password = '';

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

function askType() {
    return new Promise((resolve) => {
        console.log('Would you like to encrypt, decrypt, or check for encrypted files? Enter x if you would like to exit. (e/d/c/x)');
        rl.question('', (answer) => {
            if (answer !== 'e' && answer !== 'd' && answer !== 'c' && answer !== 'x') {
                console.log('Please input a valid answer.');
                askType().then(resolve);
                return;
            }
            else {
                mode = answer;
                resolve(answer);
            }
        });
    });
}

function encrypt() {
    
    if (fs.existsSync('.pepper')) {
        pepper = fs.readFileSync('.pepper');
    }
    else {
        pepper = crypto.randomBytes(16);
        fs.writeFileSync('.pepper', pepper);
    }

    return askPassword().then(() => {
    
        const key = crypto.scryptSync(password, pepper, 32);
        let counter = 0;
    
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
                if (entry.name === 'pepper.js') continue;   // ^
                if (entry.name === 'run.bat') continue;     // ^
    
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
    });
}

function decrypt() {

    let counter = 0;
    let failCounter = 0;

    if (!fs.existsSync('.pepper')) { 
        console.log('No .pepper file found. Cannot decrypt w/o it.');
        process.exit(1);
    }
    let pepper = fs.readFileSync('.pepper');

    return askPassword().then(() => {
    
        const key = crypto.scryptSync(password, pepper, 32);
        
        function walk(dir) {
            
            const entries = fs.readdirSync(dir, { withFileTypes: true });
        
            for (const entry of entries) {
    
                const fullPath = dir + '/' + entry.name;
    
                if (entry.isDirectory()) {
                    walk(fullPath);
                    continue;
                }
    
                if (!entry.name.endsWith('.enc')) continue;   // skip non-encrypted files
    
                const ironFist = fs.readFileSync(fullPath); //file -> one Buffer
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
    });
}

function checkEnc() {

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
}

function main() {

    askType().then((answer) => {

        switch (mode) {

            case Mode.ENCRYPT:
                console.log('Selected encrypt. Encrypting...');
                encrypt().then(main);
                break;
            case Mode.DECRYPT:
                console.log('Selected decrypt. Decrypting...');
                decrypt().then(main);
                break;
            case Mode.CHECK:
                console.log('Selected check for encrypted files. Scanning...');
                checkEnc();
                main();
                break;
            case Mode.EXIT:
                rl.close();
        }
    });

}

main();

