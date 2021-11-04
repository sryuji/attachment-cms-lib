import { AttachmentCMS as CMS } from '../attachment-cms'

type AttachmentConfigType = Record<'token' | 'url', string>

declare global {
  interface Window {
    AttachmentCMS: typeof CMS
    AttachmentConfig: AttachmentConfigType
  }
}
