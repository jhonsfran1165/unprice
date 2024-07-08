export const isPercentage = (val?: string | number) =>
  typeof val === "string" && val.indexOf("%") > -1

export const percentToPx = (comparativeValue: number, value?: string | number) => {
  if (!value) return "0px"

  if (value.toString().indexOf("px") > -1 || value === "auto" || !comparativeValue) return value
  const percent = Number.parseInt(value.toString())
  return `${(percent / 100) * comparativeValue}px`
}

export const pxToPercent = (comparativeValue: number, value?: string | number) => {
  if (!value) return 0

  const val = (Math.abs(Number.parseInt(value.toString())) / comparativeValue) * 100
  if (Number.parseInt(value.toString()) < 0) return -1 * val
  return Math.round(val)
}

export const getElementDimensions = (element?: HTMLElement | null) => {
  if (!element) return { width: 0, height: 0 }

  const computedStyle = getComputedStyle(element)

  let height = element.clientHeight
  let width = element.clientWidth // width with padding

  height -=
    Number.parseFloat(computedStyle.paddingTop) + Number.parseFloat(computedStyle.paddingBottom)
  width -=
    Number.parseFloat(computedStyle.paddingLeft) + Number.parseFloat(computedStyle.paddingRight)

  return {
    width,
    height,
  }
}
