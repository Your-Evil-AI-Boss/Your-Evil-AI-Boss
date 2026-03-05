import { WhatsApp, type MyMsg } from './lib/WhatsApp.ts'
import { AI, type Messages } from './lib/AI.ts'
import { z } from 'zod'
import * as C from './config.ts'
import { saveJSON } from './lib/utils.ts'

const summaryItem = (id_sample: string) => {
  return z.object({
    goal: z.string(),
    progress: z.string(),
    id: z.string().describe(`example: ${id_sample}`),
  })
}

const zodObjects = {
  basicReply: z.object({ reply: z.string() }),

  aiBossResponse: z.object({
    summaries: z.object({
      life: summaryItem('life'),
      this_year: summaryItem('year_2026'),
      this_month: summaryItem('month_2026-03'),
      today: summaryItem('day_2026-03-05'),
      tomorrow: summaryItem('day_2026-03-06'),
    }),
    message: z.string(),
    sleep_hours: z.number().min(0.1).max(10),
  }),
}

class AIBot {
  chatApp: WhatsApp
  ai: AI
  ai_sign = '\u200B\u200C\u200B'
  sys_msg = `
You are the Evil AI Boss (Supervisor)
1. ask the user questions to understand their life's goal and progress
2. design goals and concrete tasks, find progress for these time scales: 
  - life, this_year, this_month, today, tomorrow
3. guide the user to live a healthy and productive life
4. talk like human, be concise, try to save tokens

INPUT:
1. necessary past summaries (goal, progress)
2. recent chat history (last 2 days)

OUTPUT:
1. updated summaries. for each, put "NULL" if **unclear yet** or unchanged
  - NEVER hallucinate or invent stuff, generate only based on INPUT!
2. message/reply to user
3. sleep duration (in hours) to generate the next proactive message (assigning tasks, checking progress etc.)
  `

  async loop() {
    const { chatApp, ai, ai_sign } = this
    const messages: Messages = [{ role: 'system', content: this.sys_msg }]

    chatApp.handleMsg = async (m: MyMsg) => {
      console.log('handleMsg:', m)
      if (m.txt.startsWith(ai_sign)) return
      messages.push({ role: 'user', content: m.txt })

      const r = await ai.genJSON({
        messages,
        zodObj: zodObjects.aiBossResponse,
        name: 'aiBossResponse',
      })
      const emo = m.isMe ? '👻 ' : ''
      const text = ai_sign + emo + r.message

      await chatApp.send(m.chatId, { text })
      messages.push({ role: 'assistant', content: text })
      saveJSON({ r, messages }, 'data/messages.json')
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
