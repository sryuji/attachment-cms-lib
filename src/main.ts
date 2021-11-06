import { AttachmentCMS } from './attachment-cms'

if (typeof window !== 'undefined' && window.AttachmentConfig) {
  new AttachmentCMS(window.AttachmentConfig).run()
}

export { AttachmentCMS }
