import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
    	extend: {
    		backgroundImage: {
    			'grid-pattern': ',
    			'grid-pattern-light': '
    		}
    	}
    },
    plugins: [],
};

export default config;
