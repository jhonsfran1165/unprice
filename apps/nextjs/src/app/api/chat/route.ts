import type { NextRequest } from "next/server"
import { nanoid, OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

import { getAuth } from "@builderai/auth/server"

import { OPEN_AI_SYSTEM_PROMPT_HTML } from "~/app/(root)/(dashboard)/canvas/_components/prompt"
import { redis } from "~/lib/upstash"

export const runtime = "edge"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// TODO: pass this to TRPC streams
// https://github.com/trpc/trpc/pull/4911
export async function POST(req: NextRequest) {
  const json = await req.json()
  const { messages, html } = json
  const { userId } = getAuth(req)

  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
    })
  }

  const initialMessages = messages.slice(0, -1)
  const currentMessage = messages[messages.length - 1]

  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: OPEN_AI_SYSTEM_PROMPT_HTML,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: html,
          },
        ],
      },
      ...initialMessages,
      {
        ...currentMessage,
        content: [{ type: "text", text: currentMessage.content }],
      },
    ],
    temperature: 0.7,
    stream: true,
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: "assistant",
          },
        ],
      }
      await redis.hmset(`chat:${id}`, payload)
      await redis.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`,
      })
    },
  })

  return new StreamingTextResponse(stream)
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  const { userId } = getAuth(req)

  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
    })
  }

  const data = await redis.hgetall(`chat:${id}`)

  if (!data) {
    return new Response("Not found", {
      status: 404,
    })
  }

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  })
}
