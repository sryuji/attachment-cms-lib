import { AttachmentCMS } from './attachment-cms'

if (window.AttachmentConfig) {
  const { url, token } = window.AttachmentConfig
  new AttachmentCMS(token, url).run()
}

export { AttachmentCMS }
