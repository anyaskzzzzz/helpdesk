'use strict';
const { createApp } = require('./src/app');

const app = createApp();
const PORT = 3000;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server started on http://127.0.0.1:${PORT}`);
});