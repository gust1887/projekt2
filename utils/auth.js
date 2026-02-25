const crypto = require('crypto'); //Importerer Node.js’ indbyggede kryptografi-modul. - Giver adgang til: randomBytes(), pbkdf2Sync() & hashing-algoritmer


// Hash funktion
function hashPassword(password) { // Den kaldes når: En bruger oprettes el Password resettes
    const salt = crypto.randomBytes(16).toString('hex'); // randomBytes(16) → genererer 16 kryptografisk sikre bytes. - 16 bytes = 128 bits. - .toString('hex') → konverterer dem til hex-streng (32 tegn).
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex'); //Det her er det vigtigste i hele filen. PBKDF2 betyder: Password-Based Key Derivation Function 2 - Det er: En key stretching algoritme, Designet til passwords, Modstår brute force bedre end normal hashing
    return { salt, hash }; // I gemmer: Salt & Hash - I gemmer ALDRIG password.
  }
  
  function validatePassword(password, salt, hash) { //Den kaldes ved login.
    const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex'); // Her sker det vigtige: Bruger indtaster password, Server tager det gemte salt, Kører præcis samme PBKDF2, Får et nyt hash
    return hash === hashVerify; // Hvis: Recomputed hash == stored hash → Password korrekt - Hvis ikke → Forkert password
  }
  
  module.exports = { hashPassword, validatePassword };

/*
📌 Kernen du skal kunne forklare

Du skal kunne sige:
“Når en bruger opretter sig, genererer vi et unikt salt og hasher passwordet med PBKDF2 og SHA-512 i 1000 iterationer. Salt og hash gemmes i databasen. 
Ved login hashes input igen med samme salt og sammenlignes med den gemte hash.”
Hvis du kan sige det roligt → du er sikker.*/
