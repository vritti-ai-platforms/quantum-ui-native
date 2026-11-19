import { describe, expect, it } from '@jest/globals';
import {
  fromPrimaryQty,
  type QuantityUnit,
  quantityPlaceholder,
  resolveQuantityMessage,
  toPrimaryQty,
} from '../quantity';

const tablet: QuantityUnit = { id: 'tab', name: 'Tablet', symbol: 'tab', primaryUomQty: 1, uomQty: 1 };
const strip: QuantityUnit = { id: 'strip', name: 'Strip', symbol: 'strip', primaryUomQty: 10, uomQty: 1 };
const box: QuantityUnit = { id: 'box', name: 'Box', symbol: 'box', primaryUomQty: 100, uomQty: 1 };
const format = (value: number) => value.toLocaleString('en-US');

describe('toPrimaryQty', () => {
  it('multiplies whole and fractional packs out to the primary unit', () => {
    expect(toPrimaryQty('3', strip)).toBe(30);
    expect(toPrimaryQty('2.5', strip)).toBe(25);
    expect(toPrimaryQty('1.234', box)).toBe(123.4);
  });

  it('keeps an amount typed in the primary unit', () => {
    expect(toPrimaryQty('42', tablet)).toBe(42);
  });

  it('gives undefined for empty or unreadable text', () => {
    expect(toPrimaryQty('', strip)).toBeUndefined();
    expect(toPrimaryQty('-', strip)).toBeUndefined();
  });
});

describe('fromPrimaryQty', () => {
  it('writes a primary quantity in packs without trailing zeros', () => {
    expect(fromPrimaryQty(25, strip)).toBe('2.5');
    expect(fromPrimaryQty(300, box)).toBe('3');
  });

  it('gives empty text for a missing quantity', () => {
    expect(fromPrimaryQty(undefined, strip)).toBe('');
    expect(fromPrimaryQty(null, strip)).toBe('');
  });
});

describe('resolveQuantityMessage', () => {
  it('shows named quantities in the unit being entered and names the primary unit', () => {
    expect(
      resolveQuantityMessage(`Must be at most the reorder point (${quantityPlaceholder(1000)})`, strip, tablet, format),
    ).toBe('Must be at most the reorder point (100 strip)');
    expect(resolveQuantityMessage('Must come to a whole number of {{primaryUnit}}', strip, tablet, format)).toBe(
      'Must come to a whole number of tab',
    );
  });

  it('leaves a message without placeholders as it is', () => {
    expect(resolveQuantityMessage('Required', strip, tablet, format)).toBe('Required');
  });
});
