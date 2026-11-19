import Decimal from 'decimal.js';

export type QuantityUnit = {
  id: string;
  name: string;
  symbol: string;
  // Exact ratio to the primary unit: `primaryUomQty` primary units = `uomQty` of this unit (strip: 10 = 1; primary: 1 = 1)
  primaryUomQty: number;
  uomQty: number;
};

const PRIMARY_DECIMALS = 3;
const UNIT_DECIMALS = 6;
const QUANTITY_PLACEHOLDER = /\{\{qty:(-?[\d.]+)\}\}/g;

export const PRIMARY_UNIT_PLACEHOLDER = '{{primaryUnit}}';

// Parses a typed amount into a Decimal, or null when it is empty or not a finite number
function parseAmount(amount: string): Decimal | null {
  const text = amount.trim();
  if (text === '' || !Number.isFinite(Number(text))) return null;
  return new Decimal(text);
}

// Converts an amount typed in `unit` to the primary unit, rounded to 3 dp; empty or invalid text gives undefined
export function toPrimaryQty(amount: string, unit: QuantityUnit): number | undefined {
  const parsed = parseAmount(amount);
  if (!parsed) return undefined;
  return parsed.times(unit.primaryUomQty).div(unit.uomQty).toDecimalPlaces(PRIMARY_DECIMALS).toNumber();
}

// Expresses a primary-unit quantity as text in `unit`, without trailing zeros; a missing quantity gives ''
export function fromPrimaryQty(primaryQty: number | null | undefined, unit: QuantityUnit): string {
  if (primaryQty == null || !Number.isFinite(primaryQty)) return '';
  return new Decimal(primaryQty).times(unit.uomQty).div(unit.primaryUomQty).toDecimalPlaces(UNIT_DECIMALS).toFixed();
}

// Names a primary-unit quantity in a validation message; QuantityField shows it in the unit being entered
export function quantityPlaceholder(primaryQty: number): string {
  return `{{qty:${primaryQty}}}`;
}

// Writes a validation message's quantities in the unit being entered and its primary-unit placeholder as that unit
export function resolveQuantityMessage(
  message: string,
  unit: QuantityUnit,
  primaryUnit: QuantityUnit,
  formatNumber: (value: number) => string,
): string {
  return message
    .replace(
      QUANTITY_PLACEHOLDER,
      (_, qty: string) => `${formatNumber(Number(fromPrimaryQty(Number(qty), unit)))} ${unit.symbol}`,
    )
    .split(PRIMARY_UNIT_PLACEHOLDER)
    .join(primaryUnit.symbol);
}
