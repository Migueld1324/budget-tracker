/**
 * Feature: budget-tracker
 * Property 5: Filtrado de categorías por tipo de transacción
 * Property 27: Selectores muestran solo cuentas existentes
 *
 * Validates: Requirements 3.6, 4.3
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from './TransactionForm';
import type { Account, CategoryLists } from '../../types';

// Mock firebase modules imported transitively through types
vi.mock('firebase/firestore', () => ({
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
}));
vi.mock('../../services/firebase', () => ({ db: {} }));

const mockAccounts: Account[] = [
  { id: '1', userId: 'u1', name: 'BBVA', initialBalance: 100000, isTDC: false, createdAt: { seconds: 0, nanoseconds: 0 } as any },
  { id: '2', userId: 'u1', name: 'Efectivo', initialBalance: 50000, isTDC: false, createdAt: { seconds: 0, nanoseconds: 0 } as any },
  { id: '3', userId: 'u1', name: 'BBVA TDC', initialBalance: 0, isTDC: true, createdAt: { seconds: 0, nanoseconds: 0 } as any },
];

const mockCategories: CategoryLists = {
  Ingreso: ['Sueldo', 'Freelance', 'Inversiones'],
  Gasto: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios'],
  Transferencia: ['Pago TDC', 'Ahorro', 'Inversión'],
};

const noop = () => {};

/**
 * Helper: opens a MUI Select dropdown by its label and returns the listbox element.
 */
async function openSelect(user: ReturnType<typeof userEvent.setup>, label: string) {
  // MUI Select renders a div with role="combobox" — click it to open the listbox
  const selectTrigger = screen.getByLabelText(label);
  await user.click(selectTrigger);
  return screen.getByRole('listbox');
}

/**
 * Helper: gets the text content of all options in an open listbox.
 */
function getOptionTexts(listbox: HTMLElement): string[] {
  const options = within(listbox).getAllByRole('option');
  return options.map((opt) => opt.textContent ?? '');
}

describe('Property 5: Filtrado de categorías por tipo de transacción', () => {
  it('shows only Gasto categories when type is Gasto (default)', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    const listbox = await openSelect(user, 'Categoría');
    const options = getOptionTexts(listbox);

    expect(options).toEqual(mockCategories.Gasto);
  });

  it('shows only Ingreso categories when type is changed to Ingreso', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Change type to Ingreso
    const typeListbox = await openSelect(user, 'Tipo');
    await user.click(within(typeListbox).getByText('Ingreso'));

    // Open category dropdown
    const catListbox = await openSelect(user, 'Categoría');
    const options = getOptionTexts(catListbox);

    expect(options).toEqual(mockCategories.Ingreso);
  });

  it('shows only Transferencia categories when type is changed to Transferencia', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Change type to Transferencia
    const typeListbox = await openSelect(user, 'Tipo');
    await user.click(within(typeListbox).getByText('Transferencia'));

    // Open category dropdown
    const catListbox = await openSelect(user, 'Categoría');
    const options = getOptionTexts(catListbox);

    expect(options).toEqual(mockCategories.Transferencia);
  });

  it('resets category selection when type changes', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Select a Gasto category
    const catListbox = await openSelect(user, 'Categoría');
    await user.click(within(catListbox).getByText('Comida'));

    // Change type to Ingreso — category should reset
    const typeListbox = await openSelect(user, 'Tipo');
    await user.click(within(typeListbox).getByText('Ingreso'));

    // The category select should now have empty value (reset)
    // MUI Select renders the selected value as textContent in the trigger element
    const categorySelect = screen.getByLabelText('Categoría');
    expect(categorySelect.textContent).toBe('​'); // MUI renders a zero-width space when empty
  });
});

describe('Property 27: Selectores muestran solo cuentas existentes', () => {
  it('source selector shows exactly the registered accounts', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Default type is Gasto, so source is enabled
    const listbox = await openSelect(user, 'Origen');
    const options = getOptionTexts(listbox);

    const expectedNames = mockAccounts.map((a) => a.name);
    expect(options).toEqual(expectedNames);
  });

  it('destination selector shows exactly the registered accounts', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Change type to Ingreso so destination is enabled
    const typeListbox = await openSelect(user, 'Tipo');
    await user.click(within(typeListbox).getByText('Ingreso'));

    const destListbox = await openSelect(user, 'Destino');
    const options = getOptionTexts(destListbox);

    const expectedNames = mockAccounts.map((a) => a.name);
    expect(options).toEqual(expectedNames);
  });

  it('both selectors show accounts when type is Transferencia', async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Change type to Transferencia — both source and destination enabled
    const typeListbox = await openSelect(user, 'Tipo');
    await user.click(within(typeListbox).getByText('Transferencia'));

    const expectedNames = mockAccounts.map((a) => a.name);

    const sourceListbox = await openSelect(user, 'Origen');
    expect(getOptionTexts(sourceListbox)).toEqual(expectedNames);
    // Close by pressing Escape
    await user.keyboard('{Escape}');

    const destListbox = await openSelect(user, 'Destino');
    expect(getOptionTexts(destListbox)).toEqual(expectedNames);
  });

  it('selectors reflect a different set of accounts', async () => {
    const user = userEvent.setup();
    const differentAccounts: Account[] = [
      { id: 'a', userId: 'u1', name: 'Cuenta A', initialBalance: 0, isTDC: false, createdAt: { seconds: 0, nanoseconds: 0 } as any },
      { id: 'b', userId: 'u1', name: 'Cuenta B', initialBalance: 0, isTDC: false, createdAt: { seconds: 0, nanoseconds: 0 } as any },
    ];

    render(
      <TransactionForm
        accounts={differentAccounts}
        categories={mockCategories}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    // Default type is Gasto, source is enabled
    const listbox = await openSelect(user, 'Origen');
    const options = getOptionTexts(listbox);

    expect(options).toEqual(['Cuenta A', 'Cuenta B']);
    expect(options).toHaveLength(differentAccounts.length);
  });
});
