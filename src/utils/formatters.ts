export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatCurrency = (amount: number, decimals = 2) => {
  return `$${amount.toFixed(decimals)}`;
};

export const formatPnL = (pnl: number) => {
  const formatted = Math.abs(pnl).toFixed(2);
  return `${pnl >= 0 ? "+" : ""}$${formatted}`;
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};
