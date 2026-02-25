const express = require('express'); //Importerer Express-frameworket: Express giver dig - routing (app.get, app.post), middleware (app.use), og server logik.
const path = require('path'); //Importerer Node’s indbyggede path-modul - Bruges til at bygge filstier korrekt på tværs af OS (Windows/Mac/Linux).
require('dotenv').config(); //Loader environment variables fra en .env fil ind i process.env - Bruges typisk til secrets: fx SESSION_SECRET, SMTP credentials osv - Vigtigt for sikkerhed: secrets skal ikke hardcodes i koden.
const app = express(); //Opretter Express-appen (din “server-instans”) - Det er app du sætter middleware på og definerer routes på.
const session = require('express-session'); //Importerer session-middleware - Sessions = måde at have “state” i et ellers stateless HTTP-system.


app.set('trust proxy', 1); // nginx / DigitalOcean proxy //Fortæller Express at den kører bag en proxy (fx Nginx). - Relevant fordi: klientens IP, HTTPS (secure cookies), og headers ofte kommer via proxy. - Hvis I bruger HTTPS via Nginx, er trust proxy vigtigt for at Express kan “stole” på proxyens info (fx X-Forwarded-Proto).

app.use(session({ //app.use(...) betyder: “kør denne middleware på ALLE requests”.
  secret: process.env.SESSION_SECRET || 'fallback-secret', //secret: ... Bruges til at signere session-id/cookie data, så den ikke kan forfalskes. - process.env.SESSION_SECRET er det rigtige. - fallback-secret er en backup hvis env mangler (men i produktion bør man altid have rigtig secret).
  resave: false, //Gemmer ikke session igen, hvis der ikke er ændringer. - Mindsker unødvendigt arbejde.
  saveUninitialized: false, //Opretter ikke en session for “anonyme” brugere før du faktisk gemmer noget (fx ved login). - Godt for privacy + performance.
  cookie: {
    httpOnly: true, //Cookie kan ikke læses af JavaScript i browseren (beskytter mod XSS-stjålne cookies).
    // secure: true, - Hvis den er true, sendes cookie kun over HTTPS. - I produktion bag Nginx + HTTPS bør den typisk være true.
    maxAge: 1000 * 60 * 60 // Session cookie lever 1 time.
  }
}));


// Middleware
app.use(express.json()); //Middleware der gør at Express kan parse JSON bodies. - Uden den ville req.body være tom ved POST requests med JSON (fx login, register, send message).

// HTML-routes
app.get('/', (req, res) => { //betyder: når browseren laver GET /, så send denne fil.
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'frontpage.html')); //sender en HTML-fil. - sikrer korrekt sti: __dirname = mappen hvor app.js ligger.
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'login.html'));
});

app.get('/createaccount', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'createaccount.html'));
});

app.get('/forgotpassword', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'forgotpassword.html'));
});

app.get('/howdoesbitchatwork', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'howdoesbitchatwork.html'));
});

app.get('/whatweoffer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'whatweoffer.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'HTML', 'chat.html'));
});
// De andre routes (/login, /createaccount, /chat, osv.) gør det samme: serveren serverer jeres HTML views.


// Statisk public-mappe til frontend filer
app.use(express.static(path.join(__dirname, 'public'))); //Serverer alt i public som statiske filer. - Det gør at browseren kan hente: /CSS/bitchat-theme.css, /JS/chat.js, /images/BIT.png - Uden den linje ville CSS/JS/images ikke blive leveret.

// Henter routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); //Importerer routeren til auth. - Monterer den på /api/auth. - Det betyder: hvis authRoutes har router.post('/login'), så bliver den til: POST /api/auth/login

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);



const port = 3000; //Starter en HTTP server på port 3000.
app.listen(port, () => { //listen gør at Node accepterer indkommende TCP connections på den port. - Når en request kommer ind, bliver den kørt igennem: 1.middleware (session, json), 2.routes (html eller api), 3.response sendes tilbage
  console.log(`Example app listening on port ${port}`)
})


/*🧠 “Hvad sker der når jeg logger ind?” (koblet til app.js)

1. Browser loader /login → server sender login.html
2. login.html loader login.js (statisk fil fra public)
3. Når du trykker “Log ind”:
    - JS laver POST /api/auth/login med JSON
4. Requesten går gennem:
    - session middleware (så req.session findes)
    - express.json() (så req.body virker)
5. Auth-route validerer password
6. Auth-route sætter req.session.user = {...}
7. Server sender svar → browser gemmer cookie
8. Næste gang browser kalder /api/chat/...:
    - cookie sendes automatisk
    - server kan slå session op → ved hvem du er

Det er kerneforståelsen.*/

/*🎯 Eksamens-sætninger (du kan sige højt)

Hvis du skal forklare app.js kort:

“I app.js sætter vi Express op, konfigurerer session-middleware til at håndtere state over HTTP via cookies, 
aktiverer JSON parsing til vores REST API, serverer HTML-sider og statiske assets fra public-mappen, 
og monterer vores API routers på /api/auth, /api/chat og /api/users.”*/


