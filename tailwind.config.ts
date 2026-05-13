import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        page:    "#F7F6F2",
        surface: "#FFFFFF",
        ink:     "#1C1B18",
        ink2:    "#5A5850",
        ink3:    "#9A9890",
        border:  "#DDD9CE",
        green: {
          DEFAULT: "#276749",
          light:   "#EBF4EF",
          mid:     "#C6E2D2",
        },
        amber: {
          DEFAULT: "#A86800",
          light:   "#FDF3E3",
          mid:     "#F5D18A",
        },
        red: {
          DEFAULT: "#B52B2B",
          light:   "#FCEAEA",
          mid:     "#F0B8B8",
        },
        danger: {
          DEFAULT: "#B52B2B",
          light:   "#FCEAEA",
          mid:     "#F0B8B8",
        },
      },
      animation: {
        "pulse-ring": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}

export default config
