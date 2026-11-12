import { TicketsPage } from '../pages/TicketsPage';

const page = new TicketsPage();

describe('HelpDesk — базовые E2E-проверки', () => {
  beforeEach(() => {
    // Сброс доступен только при запуске npm run start:test.
    cy.request('POST', '/api/__reset');
  });

  it('E-01: Создание заявки через интерфейс', () => {
    page.open();

    // Заполняем форму
    page.fillTitle('Сбой VPN в корпусе');
    page.fillDescription('Не удается подключиться к сети');
    page.selectCategory('network');
    page.selectPriority('high');
    page.submitForm();

    // Проверяем, что заявка появилась в списке
    cy.contains('Сбой VPN в корпусе').should('be.visible');
    cy.contains('Не удается подключиться к сети').should('be.visible');
  });

  it('E-02: Поиск и фильтрация в браузере', () => {
    // Создаем заявку через API для скорости
    cy.request('POST', '/api/tickets', {
      title: 'Ошибка в программе',
      description: 'Программа вылетает',
      category: 'software',
      priority: 'high'
    });

    page.open();

    // Вводим поиск
    page.searchFor('программа');

    // Проверяем, что она нашлась
    cy.contains('Ошибка в программе').should('be.visible');
  });

  it('E-03: Смена статуса заявки через интерфейс', () => {
    // 1. Создаем заявку через API
    cy.request('POST', '/api/tickets', {
      title: 'Сломался монитор',
      description: 'Экран не включается',
      category: 'hardware',
      priority: 'low'
    });

    page.open();

    // 2. Находим кнопку "В работу" и кликаем
    cy.contains('В работу').click();

    // 3. Проверяем, что статус изменился на "В работе"
    cy.contains('В работе').should('be.visible');

    // 4. Находим кнопку "Завершить" и кликаем
    cy.contains('Завершить').click();

    // 5. Проверяем, что статус изменился на "Завершена"
    cy.contains('Завершена').should('be.visible');
  });
});