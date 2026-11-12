export class TicketsPage {
  open() { cy.visit('/'); }
  items() { return cy.get('[data-testid="ticket-item"]'); }
  count() { return cy.get('[data-testid="ticket-count"]'); }
  searchFor(text) { cy.get('[data-testid="search"]').clear().type(text); }
  setStatus(status) { cy.get('[data-testid="status-filter"]').select(status); }
  setCategory(category) { cy.get('[data-testid="category-filter"]').select(category); }

  //добавленные методы
  fillTitle(text) { cy.get('[data-testid="title"]').clear().type(text); }
  fillDescription(text) { cy.get('[data-testid="description"]').clear().type(text); }
  selectCategory(value) { cy.get('[data-testid="category"]').select(value); }
  selectPriority(value) { cy.get('[data-testid="priority"]').select(value); }
  submitForm() { cy.get('[data-testid="submit-ticket"]').click(); }
  getFormMessage() { return cy.get('[data-testid="form-message"]'); }
}