const { normalizeTitle, validateTicketInput, canChangeStatus, filterAndSort } = require('../../src/core');

describe('Unit тесты HelpDesk', () => {

  test('отклоняет неизвестную категорию', () => {
    const errors = validateTicketInput({
      title: 'Ошибка печати', description: 'Принтер не печатает документ',
      category: 'unknown', priority: 'low'
    });
    expect(errors).toHaveProperty('category');
  });

  test('запрещает возвращение из закрытого статуса', () => {
    expect(canChangeStatus('resolved', 'new')).toBe(false);
  });

  //

  test('U-01: Нормализация (удаление пробелов по краям)', () => {
    expect(normalizeTitle('  Ошибка  ')).toBe('Ошибка');
  });

  test('U-02: Нормализация (двойные пробелы внутри)', () => {
    expect(normalizeTitle('Сбой    сети')).toBe('Сбой сети');
  });

  test('U-03: Валидация длины темы (минимум 5 символов)', () => {
    const errors = validateTicketInput({
      title: 'Тест',
      description: 'Описание проблемы',
      category: 'software',
      priority: 'high'
    });
    expect(errors.title).toBeDefined();
  });

  test('U-04: Валидация длины темы (максимум 80 символов)', () => {
    const longTitle = 'А'.repeat(81);
    const errors = validateTicketInput({
      title: longTitle,
      description: 'Описание проблемы',
      category: 'software',
      priority: 'high'
    });
    expect(errors.title).toBeDefined();
  });

  test('U-05: Запрет перехода из new сразу в resolved', () => {
    expect(canChangeStatus('new', 'resolved')).toBe(false);
  });

  test('U-06: Сортировка по приоритету (сначала High)', () => {
    const tickets = [
      { priority: 'low', createdAt: '2023-01-01' },
      { priority: 'high', createdAt: '2023-01-02' },
      { priority: 'medium', createdAt: '2023-01-03' }
    ];
    const sorted = filterAndSort(tickets);
    expect(sorted[0].priority).toBe('high');
  });

  // ДИАГНОСТИЧЕСКИЙ ТЕСТ
  test('ПРОВЕРКА ФИЛЬТРА ПО ПРИОРИТЕТУ НАПРЯМУЮ', () => {
    const tickets = [
      { priority: 'high', createdAt: '2023-01-01' },
      { priority: 'low', createdAt: '2023-01-02' }
    ];

    // Вызываем функцию напрямую с фильтром
    const result = filterAndSort(tickets, { priority: 'high' });

    console.log('РЕЗУЛЬТАТ ФИЛЬТРА ');
    console.log(result);
    console.log('');

    expect(result.length).toBe(1);
  });

});