<h1 align="center">>Changelog<</h1>

<h1 id="table">Table of Contents</h1>

| Version | Description | Date |
|--------|-------------|------|
| [v1.1.1](#u3) | Fixed severe issue | 28th August 2026 |
| [v1.1.0](#u2) | Added safety net | 28th August 2026 |
| [v1.0.0](#u1) | First version! | 14th August 2026 |


<hr></hr>

<h2 id="u3">v1.1.1</h2> 

[Back to Table of Contents](#table)
|| This is the most recent commit.

Fixed a severe issue. Try-Catch that was added in the decrypt function in [v1.1.0](#u2) prevented users from decrypting anything even if there was nothing wrong with the file. (It made a value undefined while decrypting)

Replaced the try-catch with an if statement that checks to see if a(n) .enc file is empty. Decryption should now work normally again.

<h2 id="u2">v1.1.0</h2> 

[Back to Table of Contents](#table)
|| [Link to commit](https://github.com/fiskurxela/pepper/commit/056894cd836bcc8fdaab06a2c25a3e03dce55243)

Added a safety net that you can toggle. It saves your password in case you forget it. While toggled, when you encrypt files it gives you a randomly generated password that you must keep secure in order to access the safety net. If you disable the safety net while one is still active, it will delete the previously created safety net.


<h2 id="u1">v1.0.0</h2>

[Back to Table of Contents](#table)
|| [Link to commit](https://github.com/fiskurxela/pepper/commit/5160c13f0ebd5835334ba9327195f4e0912baa23)

This is the first version of Pepper! This includes individual encryption (`encrypt.js`) and decryption (`decrypt.js`) scripts along with a script that checks for encrypted files (`findenc.js`). There is also a script that includes all 3 of the previously mentioned scripts into one script (`pepper.js`). If you want to run it in a terminal outside of VS Code, you can use `run.bat` to run it instead!