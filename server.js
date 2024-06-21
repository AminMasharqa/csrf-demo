const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const path = require('path');

const app = express();
const csrfProtection = csrf({ cookie: true });
const parseForm = bodyParser.urlencoded({ extended: false });

app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // should be true in production
}));
app.use(express.static(path.join(__dirname, 'client', 'build')));

app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/generate-token', parseForm, csrfProtection, (req, res) => {
  req.session.csrfToken = req.csrfToken();
  res.redirect('/confirm');
});

app.get('/confirm', csrfProtection, (req, res) => {
  const token = req.session.csrfToken;
  res.send(`
    <html>
      <body>
        <h1>Are you sure?</h1>
        <form action="/confirm-purchase" method="POST">
          <input type="hidden" name="_csrf" value="${token}">
          <button type="submit">Yes, I'm sure yyy </button>
        </form>
      </body>
    </html>
  `);
});

app.post('/confirm-purchase', parseForm, csrfProtection, (req, res) => {
  if (req.body._csrf === req.session.csrfToken) {
    res.send('Purchase confirmed!');
    console.log(req.body._csrf);
    console.log(req.session.csrfToken);
  } else {
    res.status(403).send('CSRF token mismatch.');
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
