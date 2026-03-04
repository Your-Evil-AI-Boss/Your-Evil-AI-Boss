import { WhatsApp, type MyMsg } from './lib/WhatsApp.ts'
import { AI, type Messages } from './lib/AI.ts'
import { z } from 'zod'
import * as C from './config.ts'
import { saveJSON } from './lib/utils.ts'

const zodObjects = {
  basicReply: z.object({ reply: z.string() }),
}

class AIBot {
  chatApp: WhatsApp
  ai: AI
  ai_sign = '\u200B\u200C\u200B'

  async loop() {
    const { chatApp, ai, ai_sign } = this
    const messages: Messages = []

    chatApp.handleMsg = async (m: MyMsg) => {
      console.log('handleMsg:', m)
      if (m.txt.startsWith(ai_sign)) return
      messages.push({ role: 'user', content: m.txt })

      const r = await ai.genJSON({
        messages,
        zodObj: zodObjects.basicReply,
        name: 'basicReply',
      })
      const emo = m.isMe ? '👻 ' : ''
      const text = ai_sign + emo + r.reply

      await chatApp.send(m.chatId, { text })
      messages.push({ role: 'assistant', content: text })
      saveJSON(messages, 'data/messages.json')
    }

    await chatApp.connect()
  }
}

async function main() {
  const bot = new AIBot()
  bot.chatApp = new WhatsApp()
  bot.ai = new AI(C.aiOpt)
  bot.ai.model = 'gpt-4o-mini'
  await bot.loop()
}

main()
