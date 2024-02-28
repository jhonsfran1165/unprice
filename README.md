# BuilderAI

> **Warning**
> This is a work-in-progress and not the finished product.
>
> Feel free to leave feature suggestions but please don't open issues for bugs or support requests just yet.

## About

This project features the next-generation stack for building fullstack ai saas application. It's structured as a monorepo with a shared API using tRPC. Built on the new app router in Next.js 14 with React Server Components.

## Tech Stack

- Nextjs14
- Nextauth v5
- Drizzle ORM
- Fully Edge support
- TRPC
- ShadcnUI
- Postgresql
- Multitenant support with multi projects
- Monorepo
- React query
- Stripe (optional)
- Resend (optional)
- Tynibird (optional)

## Why this exists?

I started looking for some good templates with good DX for building my saas product. None of the OSS out there seems to have what I wanted, so I merged a bunch of opensources and create the template you see here, hopefully this also helps other people.

My main focus is build something that allows you to create great saas products with focus on AI and developer experience. Also a product that is API first and that you can iterate very quickly.

There are some points that you might wonder why? for example postgres. I think postgres is amazing, it's all you need for a saas. If you want to use some external vector db like pinecone you can easily add it to the template. I also avoid the use of server actions in the repo, simply because I believe nextjs is pushing to hard for it but the DX is not great yet. Although you can use it, and you will see some server actions where it makes sense in this repo, I use react-query for most of the data state management.

## Installation
