import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class AI extends OpenAI {
  model: string

  async genJSON({ model = '', messages, zodObj, name }) {
    if (typeof messages == 'string') {
      messages = [{ role: 'user', content: messages }]
    }
    const c = await this.chat.completions.parse({
      model: model || this.model,
      messages,
      response_format: zodResponseFormat(zodObj, name),
    })
    return c.choices[0].message.parsed
  }
}
