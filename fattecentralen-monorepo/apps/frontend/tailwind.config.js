/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        // './pages/**/*.{ts,tsx}', // Kept in case of future use or other modules - Commented out for testing
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        // './src/**/*.{ts,tsx,css,mdx}', // Updated to include .css and .mdx - Commented out for testing (potentially redundant)
        './src/app/globals.css',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))", // Updated to use hsl and direct variable name
                input: "hsl(var(--input))",   // Updated
                ring: "hsl(var(--ring))",     // Updated
                background: "hsl(var(--background))", // Updated
                foreground: "hsl(var(--foreground))", // Updated
                primary: {
                    DEFAULT: "hsl(var(--primary))", // Updated
                    foreground: "hsl(var(--primary-foreground))", // Updated
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))", // Updated
                    foreground: "hsl(var(--secondary-foreground))", // Updated
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))", // Updated
                    foreground: "hsl(var(--destructive-foreground))", // Updated
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))", // Updated
                    foreground: "hsl(var(--muted-foreground))", // Updated
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))", // Updated
                    foreground: "hsl(var(--accent-foreground))", // Updated
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))", // Updated
                    foreground: "hsl(var(--popover-foreground))", // Updated
                },
                card: {
                    DEFAULT: "hsl(var(--card))", // Updated
                    foreground: "hsl(var(--card-foreground))", // Updated
                },
                // Adding sidebar specific colors from globals.css
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar))", // Updated
                    foreground: "hsl(var(--sidebar-foreground))", // Updated
                    primary: {
                        DEFAULT: "hsl(var(--sidebar-primary))", // Updated
                        foreground: "hsl(var(--sidebar-primary-foreground))", // Updated
                    },
                    accent: {
                        DEFAULT: "hsl(var(--sidebar-accent))", // Updated
                        foreground: "hsl(var(--sidebar-accent-foreground))", // Updated
                    },
                    border: "hsl(var(--sidebar-border))", // Updated
                    ring: "hsl(var(--sidebar-ring))", // Updated
                },
                // Adding chart specific colors from globals.css
                chart: {
                    '1': "hsl(var(--chart-1))", // Updated
                    '2': "hsl(var(--chart-2))", // Updated
                    '3': "hsl(var(--chart-3))", // Updated
                    '4': "hsl(var(--chart-4))", // Updated
                    '5': "hsl(var(--chart-5))", // Updated
                },
            },
            borderRadius: {
                lg: "var(--radius)", // Directly use the CSS variable
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                // You can add xl or other sizes if needed, e.g.
                // xl: "calc(var(--radius) + 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require('tailwindcss-animate')], // Ændret fra tw-animate-css til tailwindcss-animate
}
