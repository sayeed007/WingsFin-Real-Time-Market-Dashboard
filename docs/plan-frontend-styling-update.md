# Frontend Styling Direction

## Summary

Adopt `Ant Design` as the base component system only if this dashboard is expected to become a larger operational/admin frontend. Keep `Tailwind` optional for layout utilities. Do not introduce Material UI or Bootstrap.

## Key Changes

- Add AntD as the single base component library for buttons, selects, cards, empty/error states, layout primitives, forms, tables, modals, drawers, and notifications.
- Keep custom CSS for brand-level tokens, chart sizing, logo/hero treatment, and app-specific responsive layout.
- Gradually reduce `frontend/src/index.css` by moving reusable UI patterns into components instead of replacing everything at once.
- Use AntD theme tokens for colors, radius, shadows, typography, and state colors so future light/dark theming remains practical.
- Keep ECharts styling separate where chart options require explicit colors.

## Test Plan

- Run `npm run lint`.
- Run `npm run build`.
- Visually verify loading, error, closed-market, empty-data, and live-chart states.
- Check desktop and mobile layouts after replacing native controls/cards.

## Assumptions

- The frontend is expected to grow beyond the current single dashboard.
- AntD is preferred over MUI/Bootstrap because the AGENTS guidance and ERP direction favor AntD-style enterprise components.
- Tailwind is useful for utilities, but AntD should own base components and theme behavior.
