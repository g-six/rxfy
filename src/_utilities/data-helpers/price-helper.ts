export function getShortPrice(amount: number, prefix = '$') {
  const str = `${Math.round(amount / 1000)}`;
  if (amount < 1000000 && !str.includes('000')) {
    return `${prefix}${str}K`;
  }

  if (str.substring(1, 2) !== '0') {
    const x = Math.round(parseInt(str.substring(1), 10) / 100);
    if (x < 10) return `${prefix}${str.substring(0, 1)}.${x}M`;
    else return `${prefix}${str.substring(0, 1)}M`;
  }

  return `${prefix}${Math.round(amount / 1000000)}M`;
}
