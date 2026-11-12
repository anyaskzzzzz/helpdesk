'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { createTicketStore } = require('./store');
const { filterAndSort } = require('./core');

function createApp(options = {}) {
  const store = createTicketStore(options.seed);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204); res.end(); return;
    }

    // обработчик сброса для Е2Е-тестов
    if (req.method === 'POST' && url.pathname === '/api/__reset') {
      store.reset([]); // Сбрасываем базу в пустой массив
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // получение списка заявок
    if (req.method === 'GET' && url.pathname === '/api/tickets') {
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      const category = url.searchParams.get('category') || '';
      const priority = url.searchParams.get('priority') || '';

      const allTickets = store.list();
      const filtered = filterAndSort(allTickets, { search, status, category, priority });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ items: filtered, total: filtered.length }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    //  создание заявки
    if (req.method === 'POST' && url.pathname === '/api/tickets') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const input = JSON.parse(body);
          const result = store.create(input);
          if (result.errors) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ errors: result.errors }));
            return;
          }
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ticket: result.ticket }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Неверный JSON' }));
        }
      });
      return;
    }

    // смена статуса
    const patchMatch = url.pathname.match(/^\/api\/tickets\/(\d+)\/status$/);
    if (req.method === 'PATCH' && patchMatch) {
      const id = parseInt(patchMatch[1], 10);
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { status } = JSON.parse(body);
          const result = store.changeStatus(id, status);
          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Заявка не найдена' }));
            return;
          }
          if (result.conflict) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Недопустимый переход статуса' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Неверный JSON' }));
        }
      });
      return;
    }

    //  статик файлы
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(__dirname, '../public', filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      const ext = path.extname(filePath);
      const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return server;
}

module.exports = { createApp };