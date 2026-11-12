'use strict';
const { createApp } = require('../../src/app');

let server;
let base;

beforeEach(async () => {
  server = createApp({ seed: [] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/health отвечает HTTP 200', async () => {
  const response = await fetch(`${base}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /api/tickets создает корректную заявку', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой принтера', description: 'Принтер в аудитории не отвечает',
      category: 'hardware', priority: 'medium'
    })
  });
  const body = await response.json();
  expect(response.status).toBe(201);
  expect(body.ticket.id).toBe(1);
  expect(body.ticket.status).toBe('new');
});

test('I-01: Успешное создание и чтение заявки', async () => {
  const postRes = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Проблема с VPN', description: 'Не подключается к сети',
      category: 'network', priority: 'high'
    })
  });
  await postRes.json();

  const getRes = await fetch(`${base}/api/tickets`);
  const list = await getRes.json();
  expect(list.items.length).toBe(1);
  expect(list.items[0].title).toBe('Проблема с VPN');
});

test('I-02: Ошибка валидации при короткой теме (HTTP 400)', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: '123', description: 'Описание проблемы', category: 'software', priority: 'low'
    })
  });
  expect(response.status).toBe(400);
});

test('I-03: Поиск по подстроке (регистр не важен)', async () => {
  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой Принтера', description: 'Не печатает документы',
      category: 'hardware', priority: 'medium'
    })
  });

  const response = await fetch(`${base}/api/tickets?search=принтер`);
  const data = await response.json();
  expect(data.items.length).toBe(1);
});

test('I-04: Комбинированная фильтрация (категория + статус)', async () => {
  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Ошибка в программе', description: 'Программа вылетает при запуске',
      category: 'software', priority: 'high'
    })
  });

  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сломался монитор', description: 'Монитор не включается',
      category: 'hardware', priority: 'low'
    })
  });

  const response = await fetch(`${base}/api/tickets?category=software&status=new`);
  const data = await response.json();
  expect(data.items.length).toBe(1);
  expect(data.items[0].category).toBe('software');
  expect(data.items[0].status).toBe('new');
});

test('I-05: Запрет перехода из new в resolved (HTTP 409)', async () => {
  const postRes = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Тестовая заявка для статуса', description: 'Описание для теста статуса',
      category: 'software', priority: 'low'
    })
  });
  const ticket = (await postRes.json()).ticket;

  const patchRes = await fetch(`${base}/api/tickets/${ticket.id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' })
  });
  expect(patchRes.status).toBe(409);
});

test('TDD-A: Фильтрация по приоритету (priority=high)', async () => {
  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Важная проблема', description: 'Срочно нужно исправить',
      category: 'software', priority: 'high'
    })
  });

  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Неважная проблема', description: 'Можно подождать',
      category: 'software', priority: 'low'
    })
  });

  const response = await fetch(`${base}/api/tickets?priority=high`);
  const data = await response.json();

  console.log('ДИАГНОСТИКА В ТЕСТЕ ');
  console.log('Количество заявок:', data.items.length);
  console.log('Приоритеты:', data.items.map(t => t.priority));

  expect(data.items.length).toBe(1);
  expect(data.items[0].priority).toBe('high');
});