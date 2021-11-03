import 'jest-fetch-mock'
import { AttachmentCMS as CMS } from '../src/attachment-cms'

type AttachmentConfigType = Record<'token' | 'url', string>

interface Window {
  AttachmentCMS: typeof CMS
  AttachmentConfig: AttachmentConfigType
}

declare global {
  const AttachmentCMS: typeof CMS
  const AttachmentConfig: AttachmentConfigType
}
