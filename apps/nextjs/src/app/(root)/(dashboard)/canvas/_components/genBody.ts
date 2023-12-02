import {
  OPEN_AI_SYSTEM_PROMPT,
  OPENAI_USER_PROMPT,
  OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN,
} from "./prompt"

export function getBodyCompletion({
  image,
  html,
  apiKey,
  text,
  theme = "light",
  includesPreviousDesign,
}: {
  image: string
  html: string
  apiKey: string
  text: string
  theme?: string
  includesPreviousDesign?: boolean
}) {
  const body: GPT4VCompletionRequest = {
    model: "gpt-4-vision-preview",
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: OPEN_AI_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `${
              includesPreviousDesign
                ? OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN
                : OPENAI_USER_PROMPT
            } Oh, and could you make it for the ${theme} theme?`,
          },
          {
            type: "text",
            text: html,
          },
          {
            type: "text",
            text: "Oh, it looks like there was not any text in this design!",
          },
        ],
      },
    ],
  }

  return body
}

type MessageContent =
  | string
  | (
      | string
      | {
          type: "image_url"
          image_url:
            | string
            | {
                url: string
                detail: "low" | "high" | "auto"
              }
        }
      | {
          type: "text"
          text: string
        }
    )[]

export interface GPT4VCompletionRequest {
  model: "gpt-4-vision-preview"
  messages: {
    role: "system" | "user" | "assistant" | "function"
    content: MessageContent
    name?: string | undefined
  }[]
  functions?: any[] | undefined
  function_call?: any | undefined
  stream?: boolean | undefined
  temperature?: number | undefined
  top_p?: number | undefined
  max_tokens?: number | undefined
  n?: number | undefined
  best_of?: number | undefined
  frequency_penalty?: number | undefined
  presence_penalty?: number | undefined
  logit_bias?: Record<string, number> | undefined
  stop?: (string[] | string) | undefined
}
