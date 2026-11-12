'use strict';

const CATEGORIES = ['hardware', 'software', 'network'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['new', 'in_progress', 'resolved'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

function normalizeTitle(title) {
  if (typeof title !== 'string') return '';
  return title.trim().replace(/\s+/g, ' ');
}

function validateTicketInput(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { input: 'Ожидается объект с данными заявки' };
  }
  if (typeof input.title !== 'string' || input.title.length < 5 || input.title.length > 80) {
    errors.title = 'Тема должна содержать от 5 до 80 символов';
  }
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length < 10 || description.length > 500) {
    errors.description = 'Описание должно содержать от 10 до 500 символов';
  }
  if (!CATEGORIES.includes(input.category)) errors.category = 'Неизвестная категория';
  if (!PRIORITIES.includes(input.priority)) errors.priority = 'Неизвестный приоритет';
  return errors;
}

function canChangeStatus(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
  if (from === 'new') return to === 'in_progress';
  if (from === 'in_progress') return to === 'resolved';
  return false;
}

function filterAndSort(tickets, filters = {}) {
  // Принудительно приводим к строке и убираем пробелы
  const search = String(filters.search || '').trim();
  const status = String(filters.status || '').trim();
  const category = String(filters.category || '').trim();
  const priority = String(filters.priority || '').trim();

  return tickets
    .filter((ticket) => {
      if (status && ticket.status !== status) return false;
      if (category && ticket.category !== category) return false;
      if (priority && ticket.priority !== priority) return false; // фильтр
      if (!search) return true;
      return ticket.title.toLowerCase().includes(search.toLowerCase()) ||
             ticket.description.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (byPriority !== 0) return byPriority;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

module.exports = {
  CATEGORIES, PRIORITIES, STATUSES,
  normalizeTitle, validateTicketInput, canChangeStatus, filterAndSort
};