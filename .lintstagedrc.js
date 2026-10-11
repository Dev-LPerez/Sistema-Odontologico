module.exports = {
  'Backend/**/*.{ts,js,json}': [
    () => 'pnpm --filter backend lint',
    () => 'pnpm --filter backend format:check',
  ],
};
