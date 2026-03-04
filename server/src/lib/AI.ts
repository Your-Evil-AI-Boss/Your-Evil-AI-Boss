import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

export type Messages = string | OpenAI.ChatCompletionMessageParam[]

export class AI extends OpenAI {
  model: string

  async genJSON<T extends z.ZodType>({
    model = '',
    messages,
    zodObj,
    name,
  }: {
    model?: string
    messages: Messages
    zodObj: T
    name: string
  }): Promise<z.infer<T>> {
    // logic
    if (typeof messages == 'string') {
      messages = [{ role: 'user', content: messages }]
    }
    const c = await this.chat.completions.parse({
      model: model || this.model,
      messages,
      response_format: zodResponseFormat(zodObj, name),
    })
    return c.choices[0].message.parsed as z.infer<T>
  }
}
