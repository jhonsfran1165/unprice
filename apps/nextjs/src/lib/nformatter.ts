export function nFormatter(
  num?: number,
  opts: { digits?: number; full?: boolean } = {
    digits: 1,
  }
) {
  if (num === Number.POSITIVE_INFINITY) return "∞"
  if (!num) return "0"
  if (opts.full) {
    return Intl.NumberFormat("en-US").format(num)
  }
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value)
  return item ? (num / item.value).toFixed(opts.digits).replace(rx, "$1") + item.symbol : "0"
}

type FormatAmountParams = {
  currency: string
  amount: number
  locale?: string
  maximumFractionDigits?: number
  minimumFractionDigits?: number
}

export function formatAmount({
  currency,
  amount,
  locale = "en-US",
  minimumFractionDigits,
  maximumFractionDigits,
}: FormatAmountParams) {
  if (!currency) {
    return
  }

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
