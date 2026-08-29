# Pepper // AES-256-GCM Encryption 🐟

by xela (`@fiskurxela`) 🐟

# v1.1.1

### This entire project requires `Node.js` to work, you can download it [here](https://nodejs.org) if you don't already have it.

Hiya! This is an AES-256-GCM project that I made! You can use this to protect your files from being read/used locally. If you share a laptop/PC with someone, this is good for protecting your personal files!

I'm mainly uploading this because my friends said I should, but also because why not?

## 📖 How to use

### IMPORTANT/NEW: You can now add a safety net to prevent losing your password*. You still need to be sure to protect the `.pepper` file that is created after encryption. If you lose that, your files are **100% PERMANENTLY LOST**! More on this [here](#pepper).
**This is only available for Option **1** and Option **2***

For starters, to be able to encrypt files you must have them in a folder. It doesn't matter where, as long as they're in a folder you're fine. Then, from there, you must copy and paste the files in this repo (you don't have to copy and paste the sample stuff) into that same folder. 

**Note:** If you place a folder inside the main folder that Pepper is sitting in, Pepper will also encrypt the files inside the subfolder.

<hr></hr>

**If you don't want to copy and paste everything from this repo,** you can select one of the following groups:

**Option 1:** `run.bat` runs `node pepper.js` inside of a terminal. Double click it to use Pepper. If you're not already aware and you're using Windows, .bat files are automatically blocked from being opened. This is because .bat files are infamous for being used to distribute malware. Fear not though, you can check the code and see that this is not malware lol. **To bypass Windows from blocking this file,** right click on it and in properties check the **Unblock** box. After saving these settings you should be able to double click it to run it. If you'd rather just run `pepper.js` itself and avoid running the .bat file, look below.

**Option 2:** `pepper.js` is a script that includes encryption, decryption, and an option to find and list all encrypted files in the folder that it's inside of. To run it, open a terminal and run `node pepper.js`.

**Option 3:** Included in this repo are the individual encryption (`encrypt.js`), decryption (`decrypt.js`), and finding encrypted files (`findenc.js`) scripts. You can run each one if you'd like. To do so, run `node __.js` depending on which you'd like to do.

Included in this repo is an example.txt file that you can use to test the program.
<hr></hr>

<h2 id="pepper"> 🔒 What it does! </h2>

Pepper works by using AES-256-GCM (an encryption method). It scrambles the data in each file which prevents the data from being read. This method also creates an authentication tag to make sure that data wasn't changed. This specific method runs fast, so don't worry about how many files you're encrypting.

Do note that Pepper *does not* protect the `.pepper` file created, it sits in the folder once it's created. Although the pepper (salt) does not need to be hidden, if it's deleted you won't be able to decrypt your files! It's up to you on how you want to protect it, though since it isn't something that needs to be hidden (as in it's not the password), you could probably just save it somewhere else that you can access whenever.


**NEW**: You no longer have to worry about losing your password! By toggling the safety net, you can retrieve your password you used to encrypt files if you forgot it. To do so, open `run.bat` or run `node pepper.js` in VS Code and follow this path: `s/1/t`. Make sure you do this BEFORE encrypting files. 

Once you encrypt files, the program will give you a recovery key. This is to access your safety net whenever you'd like. Save this recovery key somewhere safe; without it you won't be able to access the safety net. To access the password you used to encrypt files, from the main menu, follow this path: `s/1/a`. From there it will prompt you to input the recovery key it previously gave you. After unlocking the safety net, you can follow the same path to access the safety net whenever you'd like. It won't ask you to put in the recovery key again.

If you disable the safety net or encrypt new files while a safety net actively exists, **the previously created one will be deleted**.

<hr></hr>
<hr></hr>

Horray! Now you can protect your files :D
Thanks for visiting!

🐟` f i s k u r x e l a `🐟
