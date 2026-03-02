import { WhatsApp } from './lib/WhatsApp.ts'
import { AI } from './lib/AI.ts'
import { z } from 'zod'
import * as C from './config.ts'

async function main() {
  //const wa = new WhatsApp()
  //await wa.connect()
  const ai = new AI(C.aiOpt)
  ai.model = 'gpt-4o-mini'

  const zodObj = z.object({
    reply: z.string(),
  })
  const r = await ai.genJSON({
    messages: 'who founded OpenAI',
    zodObj,
    name: 'reply',
  })
  console.log(r)
}

main()
