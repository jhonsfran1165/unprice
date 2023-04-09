function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const primary_dark = {
  50: "#F2F2F2",
  100: "#E8E8E8",
  200: "#CCCCCC",
  300: "#ABABAB",
  400: "#7D7D7D",
  500: "#787878",
  600: "#696969",
  700: "#595959",
  800: "#404040",
  900: "#000000",
}

const primary_light = {
  50: "#F0F0F0",
  100: "#F2F2F2",
  200: "#F5F5F5",
  300: "#F7F7F7",
  400: "#FCFCFC",
  500: "#FFFFFF",
  600: "#F2F2F2",
  700: "#E8E8E8",
  800: "#D9D9D9",
  900: "#CCCCCC",
}

// utils/index.js

/////////////////////////////////////////////////////////////////////
// Change hex color into RGB /////////////////////////////////////////////////////////////////////
const getRGBColor = (hex) => {
  let color = hex.replace(/#/g, "")
  // rgb values
  var r = parseInt(color.substr(0, 2), 16)
  var g = parseInt(color.substr(2, 2), 16)
  var b = parseInt(color.substr(4, 2), 16)

  return `${r}, ${g}, ${b}`
}

/////////////////////////////////////////////////////////////////////
// Determine the accessible color of text
/////////////////////////////////////////////////////////////////////
const getAccessibleColor = (hex) => {
  let color = hex.replace(/#/g, "")
  // rgb values
  var r = parseInt(color.substr(0, 2), 16)
  var g = parseInt(color.substr(2, 2), 16)
  var b = parseInt(color.substr(4, 2), 16)
  var yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#000000" : "#FFFFFF"
}

const getCssThemeConfig = (colors) => {
  Object.entries(colors).forEach(([key, value]) => {
    const c = getRGBColor(value)
    console.log("--color-" + key + ": " + c + ";")
  })
}

const colors = {
  "primary-default": "#d09c00",
  "primary-200": "#c5b070",
  "primary-900": "#caa538",
  "secondary-default": "#c53636",
  "secondary-200": "#b82d2d",
  "secondary-900": "#a62b2b",
  "bg-default": "#000000",
  "bg-200": "#5a5a5a",
  "bg-900": "#323338",
  "text-default": "#ffffff",
  muted: "#c8c8c8",
  accent: "#5b88f7",
  info: "#0761d1",
  success: "#50e3c2",
  warning: "#f5a623",
  error: "#e60000",
}

getCssThemeConfig(colors)
