import 'jest-fetch-mock'
import { AttachmentCMS as CMS } from '../src/attachment-cms'

type AttachmentConfigType = Record<'token' | 'url', string>

interface Window {
  AttachmentCMS: typeof CMS
  AttachmentConfig: AttachmentConfigType
}

declare global {
  var AttachmentCMS: typeof CMS
  var AttachmentConfig: AttachmentConfigType
}
