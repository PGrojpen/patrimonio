/**
 * pt-BR number and currency formatters.
 * All monetary values are in BRL (R$).
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlCompactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const pctFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatBRL = (value: number): string => brlFormatter.format(value);

export const formatBRLCompact = (value: number): string =>
  brlCompactFormatter.format(value);

export const formatPct = (value: number): string =>
  pctFormatter.format(value / 100);

export const formatNumber = (value: number, decimals = 2): string =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const formatDate = (dateStr: string): string => {
  const [year, month] = dateStr.split("-");
  return `${month}/${year}`;
};

export const formatYears = (months: number): string => {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${rem}m`;
};

export const parseBRLInput = (value: string): number => {
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
};
