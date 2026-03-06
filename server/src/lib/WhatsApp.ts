import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  proto,
  type WAMessage,
  type WASocket,
  type AnyMessageContent,
} from '@whiskeysockets/baileys'
import qrCode from 'qrcode-terminal'
import pino from 'pino'

export interface MyMsg {
  chatId: string
  sender: string
  //isMe?: boolean
  txt?: string
  quote?: string
}

export class WhatsApp {
  path = 'data/WhatsApp'
  sock: WASocket
  myId: string

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(this.path)
    const { version } = await fetchLatestBaileysVersion()
    const logger = pino({ level: 'silent' })
    const sock = (this.sock = makeWASocket({ version, auth: state, logger }))
    sock.ev.on('connection.update', (x) => {
      if (x.qr) qrCode.generate(x.qr, { small: true })
      if (x.connection == 'close') this.connect()
      else if (x.connection == 'open') {
        console.log('WhatsApp connected')
        this.myId = this.toId(sock.user.id.split(':')[0])
        this.send(this.myId, { text: '⚠️ Bot connected' })
      }
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (x) => {
      if (x.type == 'notify') {
        x.messages.forEach((m) => this._handleMsg(m))
      }
    })
  }

  async _handleMsg(m: WAMessage) {
    const m2 = m.message
    if (!m2) return
    const chatId = m.key.remoteJidAlt
    const sender = m.pushName
    const isMe = m.key.fromMe
    const txt = this._getTxt(m2)
    const quote = this._getTxt(
      m2.extendedTextMessage?.contextInfo?.quotedMessage,
    )
    const m3 = { chatId, sender, isMe, txt, quote }
    await this.handleMsg(m3)
  }

  _getTxt(m: proto.IMessage) {
    if (!m) return
    return (
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption
    )
  }

  async handleMsg(m: MyMsg) {
    console.log(m)
    return {}
  }

  async send(chatId: string, data: AnyMessageContent) {
    await this.sock.sendMessage(chatId, data)
  }

  toId(phone: string) {
    return phone.replace(/\D/g, '') + '@s.whatsapp.net'
  }
}
