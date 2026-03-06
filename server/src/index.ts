import { WhatsApp, type MyMsg } from './lib/WhatsApp.ts'
import { AI, type Messages } from './lib/AI.ts'
import { z } from 'zod'
import * as C from './config.ts'
import { saveJSON } from './lib/utils.ts'
import { setTimeout } from 'timers/promises'

const summaryItem = (time_id_sample: string) => {
  return z.object({
    goal: z.string(),
    progress: z.string(),
    time_id: z.string().describe(`example: ${time_id_sample}`),
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
    sleep_hours: z.number().min(0.1).max(1),
  }),
}

class AIBot {
  chatApp: WhatsApp
  ai: AI
  aiSign = '\u200B\u200C\u200B'
  sysMsg = `
You are the Evil AI Boss (Supervisor)
1. ask the user questions to understand their life's goal and progress
2. design goals and concrete tasks, find progress for these time scales: 
  - life, this_year, this_month, today, tomorrow
3. guide the user to live a healthy and productive life
4. talk like human, make the message very short, try to save tokens
5. if the last message is from assistant (yourself),
  that means the user hasn't replied, ask "why no reply?",
  keep asking until user replies

INPUT:
1. necessary past summaries (goal, progress)
2. recent chat history (last 2 days)

OUTPUT:
1. updated summaries. for each, put "NULL" if **unclear yet** or unchanged
  - NEVER hallucinate or invent stuff, generate only based on INPUT!
2. message/reply to user
3. sleep duration (in hours) to generate the next proactive message (assigning tasks, checking progress etc.)
  `
  users = [{ name: 'Ruiqi Ding', phone: '86 166 1977 1943', sleepUntil: 0 }]

  async loop() {
    const { chatApp, ai, aiSign, users } = this
    const messages: Messages = [{ role: 'system', content: this.sysMsg }]

    const handleMsg = async (m: MyMsg) => {
      console.log('handleMsg:', m)
      if (m.txt?.startsWith(aiSign)) return
      if (m.txt) messages.push({ role: 'user', content: m.txt })

      const r = await ai.genJSON({
        messages,
        zodObj: zodObjects.aiBossResponse,
        name: 'aiBossResponse',
      })
      const emo = m.chatId == chatApp.myId ? '👻 ' : ''
      const text = aiSign + emo + r.message

      await chatApp.send(m.chatId, { text })
      messages.push({ role: 'assistant', content: text })
      saveJSON({ r, messages }, 'data/messages.json')
      return r
    }

    chatApp.handleMsg = handleMsg
    chatApp.connect()

    while (true) {
      await setTimeout(1000)
      users.forEach(async (u) => {
        if (Date.now() > u.sleepUntil) {
          u.sleepUntil = Infinity
          const chatId = chatApp.toId(u.phone)
          const r = await handleMsg({ chatId, sender: u.name })
          //u.sleepUntil = Date.now() + r.sleep_hours * 60 * 60e3
          u.sleepUntil = Date.now() + 10e3
        }
      })
    }
  }
}

async function main() {
  const bot = new AIBot()
  bot.chatApp = new WhatsApp()
  bot.ai = new AI(C.aiOpt)
  bot.ai.model = 'gpt-5-mini-2025-08-07'
  await bot.loop()
}

main()
