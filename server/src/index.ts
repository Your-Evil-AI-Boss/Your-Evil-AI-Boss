import { WhatsApp } from './lib/WhatsApp.ts'

async function main() {
  const wa = new WhatsApp()
  await wa.connect()
}

main()
