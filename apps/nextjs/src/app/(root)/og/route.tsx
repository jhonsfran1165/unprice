import { Logo } from "@unprice/ui/icons"
import { ImageResponse } from "@vercel/og"
import { siteConfig } from "~/constants/layout"

export const runtime = "edge"

// Helper function to load a font from Google Fonts
async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)
  if (resource) {
    const response = await fetch(resource[1]!)
    if (response.status === 200) {
      return await response.arrayBuffer()
    }
  }
  throw new Error("Failed to load font data")
}

export async function GET() {
  const font = await loadGoogleFont("Geist", "Unprice")

  // Default Pluto landing page OG image
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111110",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #222221 2%, transparent 0%), radial-gradient(circle at 75px 75px, #222221 2%, transparent 0%)",
        backgroundSize: "100px 100px",
        color: "white",
        fontSize: 100,
        fontWeight: 900,
        fontFamily: "Geist",
      }}
    >
      {/* Header with logo area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
          gap: "24px",
        }}
      >
        <Logo style={{ width: "80px", height: "80px", color: "#ffca16" }} />
        <span
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            background: "linear-gradient(45deg, #ffca16, #ffca16)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {siteConfig.name}
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "32px",
          color: "#a1a1aa",
          textAlign: "center",
          maxWidth: "800px",
          lineHeight: "1.3",
          marginBottom: "40px",
        }}
      >
        Unprice lets you track usage and iterate prices in real-time. Focus on your product, not
        your pricing.
      </div>

      {/* Feature highlights */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#222221",
            padding: "16px 24px",
            borderRadius: "12px",
            border: "1px solid #374151",
          }}
        >
          <span style={{ fontSize: "24px", marginRight: "12px" }}>📊</span>
          <span style={{ fontSize: "20px", color: "#e5e7eb" }}>Track usage</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#222221",
            padding: "16px 24px",
            borderRadius: "12px",
            border: "1px solid #374151",
          }}
        >
          <span style={{ fontSize: "24px", marginRight: "12px" }}>💸</span>
          <span style={{ fontSize: "20px", color: "#e5e7eb" }}>Iterate prices</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#222221",
            padding: "16px 24px",
            borderRadius: "12px",
            border: "1px solid #374151",
          }}
        >
          <span style={{ fontSize: "24px", marginRight: "12px" }}>⚡</span>
          <span style={{ fontSize: "20px", color: "#e5e7eb" }}>Real-time insights</span>
        </div>
      </div>

      {/* Footer with subtle branding */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          fontSize: "18px",
          color: "#6b7280",
        }}
      >
        Powered by Unprice
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Geist",
          data: font,
        },
      ],
    }
  )
}
