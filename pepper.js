/**
 * @author fiskurxela
 * @desc aes-256 but like all in one
 * 
 * yay let's hope i can make this work
 */
const crypto = require('crypto');
const fs = require('fs');

let pepper; //this is the salt lol is just a joke
let recoverykey;

const Mode = {
    ENCRYPT: 'e',
    DECRYPT: 'd',
    CHECK: 'c',
    EXIT: 'x',
    SETTINGS: 's'
};

let mode = '';
let snstat = '';

let settings = { safetynet: false };
loadSettings();

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
        console.log('Would you like to encrypt, decrypt, or check for encrypted files? Enter s to manage settings. Enter x if you would like to exit. (e/d/c/s/x)');
        rl.question('', (answer) => {
            if (answer !== 'e' && answer !== 'd' && answer !== 'c' && answer !== 'x' && answer !== 's') {
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

        if (safetynet) {
            createsafetynet(password);
        }

    
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
        
                if (entry.name === '.pepper') continue;       // skip the salt file
                if (entry.name.endsWith('.enc')) continue;    // skip already-encrypted files
                if (entry.name === 'encrypt.js') continue;    // skip the script itself
                if (entry.name === 'decrypt.js') continue;    // ^
                if (entry.name === 'findenc.js') continue;    // ^
                if (entry.name === 'pepper.js') continue;     // ^
                if (entry.name === 'run.bat') continue;       // ^
                if (entry.name === 'settings.json') continue; //  skip settings
                if (entry.name === '.safetynet') continue;    // this itself is already encrypted
                if (entry.name === 'LICENSE') continue;
                if (entry.name === 'changelog.md') continue;
                if (entry.name === 'README.md') continue;
                if (entry.name === '.gitignore') continue;
                if (entry.name.startsWith('.git')) continue;
                if (entry.name === 'Excel.lnk') continue;    //ignore this REMOVE BEFORE PUSHING
    
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

        if (safetynet){
            console.log('!! SAFETYNET KEY !!');
            console.log(recoverykey);
            console.log('!! SAVE THIS SOMEWHERE SAFE. THIS IS THE ONLY TIME YOU WILL SEE THIS. !!');
        }
        console.log('Encryption process completed. Encrypted', counter, 'files.');
        console.log();
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

                if (fs.statSync(fullPath).size === 0){
                    console.log('Error: File is empty');
                    console.log('Please delete or move this file out of this folder: ' + fullPath);
                    failCounter++;
                    continue;
                }
    
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
        console.log();
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

function loadSettings(){
    if (fs.existsSync('safetynet.txt') || fs.existsSync('.safetynet')){
        safetynet = true;
        settings = { safetynet: true };
        if (fs.existsSync('settings.json')){
            const raw = fs.readFileSync('settings.json', 'utf8');
            if (JSON.parse(raw).safetynet !== safetynet){
                fs.unlinkSync('settings.json');
                fs.writeFileSync('settings.json', JSON.stringify(settings));
            }
        }
    }
    else if (fs.existsSync('settings.json')){
        const raw = fs.readFileSync('settings.json', 'utf8');
        settings = JSON.parse(raw);
        safetynet = settings.safetynet;
    }
    else {
        fs.writeFileSync('settings.json', JSON.stringify(settings));
        safetynet = false;
    }
}

function saveSettings(){
    fs.writeFileSync('settings.json', JSON.stringify({ safetynet: safetynet }));
}

function osettings(){

    const sMode = {
        SAFETYNET: '1',
        MAINMENU: 'm'
    };

    function esafetynet() {

        console.log('Enter a to access the saved password. Enter t to toggle the safetynet. Enter x to exit/cancel the action. (a/t/x)');
        return new Promise((resolve) => {
            rl.question('', (answer) => {
                if (answer !== 'a' && answer !== 't' && answer !== 'x'){
                    console.log('Please input a valid answer.');
                        esafetynet().then(resolve);
                }
                else if (answer == 'a'){

                    if(fs.existsSync('safetynet.txt')){
                        console.log('Your password is: ', fs.readFileSync('safetynet.txt', 'utf8'));
                        console.log('Returning to main menu.');
                        console.log();
                        main();
                        return;
                    }
                    else if (!fs.existsSync('.safetynet')){
                        console.log('A safetynet does not exist. Returning to main menu.');
                        console.log();
                        main();
                        return;
                    }
                    console.log('Please enter the given key.');
                    rl.question('', (answer) => {

                        const buffer = fs.readFileSync('.safetynet');
                        let chilipepper = buffer.slice(0,16);
                        const recoverykey = crypto.scryptSync(answer, chilipepper, 32);
                        const iv = buffer.slice(16,28);
                        const authTag = buffer.slice(28, 44);
                        const encrypted = buffer.slice(44);
                        const decipher = crypto.createDecipheriv('aes-256-gcm', recoverykey, iv);
                        decipher.setAuthTag(authTag);

                        try {
                            const decrypted = decipher.update(encrypted);
                            const final = decipher.final();
                            const rpassword = Buffer.concat([decrypted,final]).toString('utf8');
                            fs.writeFileSync('safetynet.txt', rpassword);
                            fs.unlinkSync('.safetynet');
                            console.log('Safetynet unlocked. Your password is: ', rpassword);
                            console.log('Open safetynet.txt to reaccess the password. Returning to main menu.');
                            console.log();
                            main();
                            return;
                        }
                        catch (err) {
                            console.log('The key you entered was incorrect. Returning to main menu.');
                            console.log();
                            main();
                            return;
                        }                                    
                        
                    });
                }
                else if (answer == 't'){

                    safetynet = !safetynet;
                    saveSettings();

                    console.log('Safetynet is now set to ', safetynet);
                    if (!safetynet){
                        if (fs.existsSync('.safetynet')){
                            console.log('Deleting previously saved password...');
                            fs.unlinkSync('.safetynet');
                            console.log('Password deleted.');                                
                        }
                        else if (fs.existsSync('safetynet.txt')){
                            console.log('Deleting previously saved password...');
                            fs.unlinkSync('safetynet.txt');
                            console.log('Password deleted.'); 
                        }
                    }

                    console.log('Returning to main menu.');
                    console.log();
                    main();
                    return;
                }
                else if (answer =='x'){

                    console.log('Cancelling action. Returning to main menu.');
                    console.log();
                    main();
                    return;

                }
                
            });
        });
       
    }
    

    let smode = '';

    return new Promise((resolve) => {

        console.log('Enter the number you would like to edit. Enter m to return to the main menu. (#/m)');

        rl.question('', (answer) => {
            if (answer !== '1' && answer !== 'm'){
                console.log('Please input a valid answer.');
                osettings().then(resolve);
                return;
            }
            else {
                smode = answer;
                switch (smode) {
                    case sMode.SAFETYNET:
                        esafetynet();
                        break;
                    case sMode.MAINMENU:
                        console.log('Returning to main menu.');
                        console.log();
                        main();
                        return;
                }
                resolve(answer);
            }
        });
    });
}

function createsafetynet(actualPassword){

    if (fs.existsSync('safetynet.txt')){
        console.log('Deleting previously saved password...');
        fs.unlinkSync('safetynet.txt');
        console.log('Password deleted.'); 
    }

    recoverykey = crypto.randomBytes(8).toString('hex');

    const chilipepper = crypto.randomBytes(16);
    const housekey = crypto.scryptSync(recoverykey, chilipepper, 32);
    const fourth = crypto.randomBytes(12);

    const cider = crypto.createCipheriv('aes-256-gcm', housekey, fourth);
    const encryptedPassword = Buffer.concat([cider.update(actualPassword, 'utf8'), cider.final()]);
    const authTag = cider.getAuthTag();

    fs.writeFileSync('.safetynet', Buffer.concat([chilipepper, fourth, authTag, encryptedPassword]));

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
            case Mode.SETTINGS:

                console.log('Selected settings.');
                console.log();
                console.log('-Settings-');
                if (safetynet) {

                    snstat = '';

                    if (fs.existsSync('safetynet.txt') || fs.existsSync('.safetynet')){
                        snstat = 'On, Active'
                    }
                    else {
                        snstat = 'On, not Active';
                    }
                }
                else {
                    snstat = 'Off';
                }
                console.log('1 | Safety net: ', snstat);
                osettings();
                break;
            case Mode.EXIT:
                rl.close();
        }
    });

}

main();

