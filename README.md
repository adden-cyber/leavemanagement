This is a [Next.js](https://nextjs.org) project for the Roro Leave Management System.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

> **Troubleshooting**
>
> If you encounter a `TurbopackInternalError` (for example: *Cell CellId ... no longer exists in task DiskFileSystem::new_internal*)
> while running `npm run dev`, it is usually caused by the experimental Turbopack bundler.
> This can happen when your project path contains spaces or the cache becomes corrupted.
>
> Two simple remedies:
>
> 1. Use the modified dev script (`npm run dev` already includes `--turbo=false`) to force the
>    webpack-based compiler.
> 2. Delete the `.next`/`.turbo` cache folders and restart the server.
>
> If you prefer to keep Turbopack enabled, run the dev server with `next dev --turbo` and ensure your
> project path does not include spaces.
>

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
