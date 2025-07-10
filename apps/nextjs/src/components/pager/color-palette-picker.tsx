"use client"

import type { Page } from "@unprice/db/validators"
import { Badge } from "@unprice/ui/badge"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Palette, RefreshCw } from "lucide-react"
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { generateColorsFromBackground } from "~/lib/colors"
import { getImageSrc, isSvgLogo } from "~/lib/image"
import { colorPresets } from "./color-presets"

interface ColorPalettePickerProps {
  control: Control<Page>
  setValue: UseFormSetValue<Page>
  watch: UseFormWatch<Page>
}

export function ColorPalettePicker({ control, setValue, watch }: ColorPalettePickerProps) {
  const currentPalette = watch("colorPalette")

  const applyPreset = (palette: Page["colorPalette"]) => {
    setValue("colorPalette", palette)
  }

  const resetToDefault = () => {
    setValue("colorPalette", colorPresets[0]!.palette)
  }

  const { text } = generateColorsFromBackground(currentPalette.primary)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Palette
        </CardTitle>
        <CardDescription>Customize the color scheme for your page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Quick Presets</h4>
            <Button type="button" variant="outline" size="sm" onClick={resetToDefault}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {colorPresets.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                className="flex h-auto flex-col items-start gap-2 p-3 hover:bg-muted/50"
                onClick={() => applyPreset(preset.palette)}
              >
                <div className="flex w-full items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: preset.palette.primary }}
                  />
                  <span className="font-medium text-xs">{preset.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Current Palette Preview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Current Palette</h4>
          <div className="rounded-lg border p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src={getImageSrc(watch("logo"), watch("logoType") ?? "")}
                  alt="Current page logo"
                  className="max-h-32 max-w-32 rounded object-contain"
                  onError={() => {
                    console.error("Failed to load image preview")
                  }}
                  {...(isSvgLogo(watch("logoType") ?? "") ? { width: 128, height: 128 } : {})}
                  aria-label="Current page logo"
                />
              </div>
              <h5 className="font-semibold">{watch("title")}</h5>
              <p className="text-sm opacity-80">{watch("copy")}</p>
              <div className="mt-3 flex gap-2">
                <Badge style={{ backgroundColor: currentPalette.primary, color: text }}>
                  Primary
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Color Inputs */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Custom Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="colorPalette.primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Primary</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-8 w-12 cursor-pointer rounded border p-1"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                        }}
                      />
                      <Input
                        type="text"
                        placeholder="#000000"
                        className="flex-1 text-xs"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Use the color pickers or enter hex values directly. Changes are reflected in the preview
            above.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
