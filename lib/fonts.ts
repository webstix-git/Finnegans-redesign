export const FONT_ASSETS = {
  anton: '/assets/60cfbb76-24c6-482a-9337-d08603d11be9.woff2',
  montserrat: '/assets/9ba0e864-716b-40d4-8595-b60f1c0f0458.woff2',
  montserratItalic: '/assets/4848ff19-302c-4856-83eb-2fbded1c949c.woff2',
  oswald: '/assets/d9761209-5bfe-421b-a386-02654d4f1fd8.woff2',
} as const;

/** Preload every face used on the site to cut down first-paint font swapping. */
export const FONT_PRELOADS = Object.values(FONT_ASSETS);
