import type { NextRequest } from "next/server"
import { nanoid, OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

import { getAuth } from "@builderai/auth/server"

import { redis } from "~/lib/upstash"

export const runtime = "edge"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// TODO: pass this to TRPC streams
// https://github.com/trpc/trpc/pull/4911
export async function POST(req: NextRequest) {
  const json = await req.json()
  const { prompt } = json
  const { userId } = getAuth(req)

  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
    })
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    // a precise prompt is important for the AI to reply with the correct tokens
    messages: [
      {
        role: "user",
        content: `Given the following post content, detect if it has typo or not.
    Respond with a JSON array of typos ["typo1", "typo2", ...] or an empty [] if there's none. Only respond with an array. Post content:
    ${prompt}

    Output:\n`,
      },
    ],
    temperature: 0.7,
    stream: true,
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      const title = prompt.substring(0, 100)

      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/completion/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          {
            role: "user",
            content: `Given the following post content, detect if it has typo or not.
      Respond with a JSON array of typos ["typo1", "typo2", ...] or an empty [] if there's none. Only respond with an array. Post content:
      ${prompt}

      Output:\n`,
          },
          {
            content: completion,
            role: "assistant",
          },
        ],
      }
      await redis.hmset(`completion:${id}`, payload)
      await redis.zadd(`user:completion:${userId}`, {
        score: createdAt,
        member: `completion:${id}`,
      })
    },
  })

  return new StreamingTextResponse(stream)
}
