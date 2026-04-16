@import "tailwindcss";

@theme {
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-accent: #c5a059;
  --color-text: #e0e0e0;
  --color-text-dim: #888888;
  --color-border-dim: rgba(255, 255, 255, 0.1);
  
  --font-serif: "Georgia", serif;
  --font-sans: "Helvetica Neue", Arial, sans-serif;
}

@layer base {
  body {
    @apply bg-bg text-text font-sans;
  }
}
