import { describe, it, expect } from 'vitest';
import { parseTransactionsCSV, parseAccountsCSV } from './csvParser';

describe('parseTransactionsCSV', () => {
  const validHeader = 'Período,Fecha,Tipo,Categoría,Origen,Destino,Monto,Descripción';

  it('parses valid transaction rows', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Gasto,Comida,BBVA,,"$1.500,00",Supermercado',
      'abr-2026,2026-04-10,Ingreso,Sueldo,,BBVA,"$25.000,00",Nómina',
      'abr-2026,2026-04-15,Transferencia,Pago TDC,BBVA,BBVA TDC,"$5.000,00",Pago mensual',
    ].join('\n');

    const result = parseTransactionsCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(3);

    // Gasto
    expect(result.data[0]).toEqual({
      date: '2026-04-05',
      type: 'Gasto',
      category: 'Comida',
      source: 'BBVA',
      destination: null,
      amount: 150000,
      description: 'Supermercado',
    });

    // Ingreso
    expect(result.data[1]).toEqual({
      date: '2026-04-10',
      type: 'Ingreso',
      category: 'Sueldo',
      source: null,
      destination: 'BBVA',
      amount: 2500000,
      description: 'Nómina',
    });

    // Transferencia
    expect(result.data[2]).toEqual({
      date: '2026-04-15',
      type: 'Transferencia',
      category: 'Pago TDC',
      source: 'BBVA',
      destination: 'BBVA TDC',
      amount: 500000,
      description: 'Pago mensual',
    });
  });

  it('returns error for empty content', () => {
    const result = parseTransactionsCSV('');
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
  });

  it('returns error for invalid headers', () => {
    const csv = 'Col1,Col2,Col3\ndata1,data2,data3';
    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
  });

  it('reports errors for invalid rows and imports valid ones', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Gasto,Comida,BBVA,,"$1.500,00",OK',
      'abr-2026,invalid-date,Gasto,Comida,BBVA,,"$1.500,00",Bad date',
      'abr-2026,2026-04-05,Invalido,Comida,BBVA,,"$1.500,00",Bad type',
      'abr-2026,2026-04-05,Gasto,Comida,BBVA,,"$0,00",Zero amount',
      'abr-2026,2026-04-05,Ingreso,Sueldo,,BBVA,"$10.000,00",OK too',
    ].join('\n');

    const result = parseTransactionsCSV(csv);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].description).toBe('OK');
    expect(result.data[1].description).toBe('OK too');

    expect(result.errors).toHaveLength(3);
    expect(result.errors[0].row).toBe(3); // invalid date
    expect(result.errors[1].row).toBe(4); // invalid type
    expect(result.errors[2].row).toBe(5); // zero amount
  });

  it('requires Origen for Gasto', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Gasto,Comida,,,"$1.000,00",Missing origin',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Origen es obligatorio');
  });

  it('requires Destino for Ingreso', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Ingreso,Sueldo,,,"$1.000,00",Missing dest',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Destino es obligatorio');
  });

  it('requires both Origen and Destino for Transferencia', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Transferencia,Pago,,,"$1.000,00",Missing both',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Origen es obligatorio');
    expect(result.errors[0].message).toContain('Destino es obligatorio');
  });

  it('sets source to null for Ingreso and destination to null for Gasto', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Ingreso,Sueldo,SomeOrigin,BBVA,"$1.000,00",Has origin but ignored',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].source).toBeNull();
    expect(result.data[0].destination).toBe('BBVA');
  });

  it('handles empty description gracefully', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Gasto,Comida,BBVA,,"$500,00",',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('');
  });

  it('rejects rows with insufficient columns', () => {
    const csv = [
      validHeader,
      'abr-2026,2026-04-05,Gasto',
    ].join('\n');

    const result = parseTransactionsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Número insuficiente');
  });
});

describe('parseAccountsCSV', () => {
  const validHeader = 'Cuenta,Saldo Inicial';

  it('parses valid account rows', () => {
    const csv = [
      validHeader,
      'BBVA,"$50.000,00"',
      'Efectivo,"$5.000,00"',
      'BBVA TDC,"-$12.000,00"',
    ].join('\n');

    const result = parseAccountsCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(3);

    expect(result.data[0]).toEqual({ name: 'BBVA', initialBalance: 5000000 });
    expect(result.data[1]).toEqual({ name: 'Efectivo', initialBalance: 500000 });
    expect(result.data[2]).toEqual({ name: 'BBVA TDC', initialBalance: -1200000 });
  });

  it('returns error for empty content', () => {
    const result = parseAccountsCSV('');
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('returns error for invalid headers', () => {
    const csv = 'Name,Balance\nBBVA,1000';
    const result = parseAccountsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
  });

  it('reports errors for invalid rows and imports valid ones', () => {
    const csv = [
      validHeader,
      'BBVA,"$50.000,00"',
      ',"$1.000,00"',
      'Efectivo,invalid-amount',
    ].join('\n');

    const result = parseAccountsCSV(csv);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('BBVA');

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].row).toBe(3); // empty name
    expect(result.errors[1].row).toBe(4); // invalid amount
  });

  it('requires non-empty Cuenta', () => {
    const csv = [
      validHeader,
      ',"$1.000,00"',
    ].join('\n');

    const result = parseAccountsCSV(csv);
    expect(result.data).toHaveLength(0);
    expect(result.errors[0].message).toContain('Cuenta es obligatoria');
  });

  it('allows zero as initial balance', () => {
    const csv = [
      validHeader,
      'Nueva Cuenta,"$0,00"',
    ].join('\n');

    const result = parseAccountsCSV(csv);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].initialBalance).toBe(0);
  });
});
