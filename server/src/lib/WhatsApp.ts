import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WAMessage,
  type WASocket,
} from '@whiskeysockets/baileys'
import qrCode from 'qrcode-terminal'
import pino from 'pino'

export class WhatsApp {
  path = 'data/WhatsApp'
  sock: WASocket | undefined

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(this.path)
    const { version } = await fetchLatestBaileysVersion()
    const logger = pino({ level: 'silent' })
    const sock = (this.sock = makeWASocket({ version, auth: state, logger }))
    sock.ev.on('connection.update', (x) => {
      if (x.qr) qrCode.generate(x.qr, { small: true })
      if (x.connection == 'close') this.connect()
      else if (x.connection == 'open') console.log('WhatsApp connected')
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (x) => {
      if (x.type == 'notify') {
        for (const m of x.messages) {
          await this.handleMsg(m)
        }
      }
    })
  }

  async handleMsg(m: WAMessage) {
    console.log(m)
  }
}
