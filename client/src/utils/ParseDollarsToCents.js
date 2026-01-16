  export function dollarsToCents(text) {
    const n = Number(text);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }