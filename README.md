This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev


Open [http://0](http://localhost:3000) with your browser to see the result.


```

## Update database for syncing with Supabase

```bash

# Step 1: Sync schema safely
npx prisma db push

# Step 2: Regenerate Prisma client types
npx prisma generate

# Step 3: (Optional) Open Prisma Studio to confirm
npx prisma studio

```
