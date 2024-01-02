const fs = require('fs');
const https = require('https');
const express = require('express');
const { json } = require('body-parser');
const basicAuth = require('basic-auth');

const reservation = require('./api/reservation');
const calendarRouter = require('./api/calendar');
const lineRouter = require('./api/line');

const port = 3000;
const app = express();

const auth = function(req, res, next) {
  const user = basicAuth(req);

  if (!user || user.name !== 'yusei' || user.pass !== 'yusei0207') {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
    return;
  }

  next();
};

app.use((req, res, next) => {
  if (req.path === '/public') {
    // Basic認証を適用
    basicAuthMiddleware(req, res, next);
  } else {
    // Basic認証をスキップ
    next();
  }
});

app.use(express.static('public'));
app.use(json());

// ルーティングの設定
app.use('/reservations', reservation);
app.use('/calendar', calendarRouter);
app.use('/line', lineRouter);

// SSL証明書のファイルパスを指定
const privateKey = fs.readFileSync('./certificate/astronquts.com.key', 'utf8');
const certificate = fs.readFileSync('./certificate/astronquts.com.crt', 'utf8');

// HTTPSサーバーの設定
const credentials = {
  key: privateKey,
  cert: certificate
};

// HTTPSサーバーを起動
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
