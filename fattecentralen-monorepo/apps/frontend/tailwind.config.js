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
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                // Adding sidebar specific colors from globals.css
                sidebar: {
                    DEFAULT: "var(--sidebar)",
                    foreground: "var(--sidebar-foreground)",
                    primary: {
                        DEFAULT: "var(--sidebar-primary)",
                        foreground: "var(--sidebar-primary-foreground)",
                    },
                    accent: {
                        DEFAULT: "var(--sidebar-accent)",
                        foreground: "var(--sidebar-accent-foreground)",
                    },
                    border: "var(--sidebar-border)",
                    ring: "var(--sidebar-ring)",
                },
                // Adding chart specific colors from globals.css
                chart: {
                    '1': "var(--chart-1)",
                    '2': "var(--chart-2)",
                    '3': "var(--chart-3)",
                    '4': "var(--chart-4)",
                    '5': "var(--chart-5)",
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
