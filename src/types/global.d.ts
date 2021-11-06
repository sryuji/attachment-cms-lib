import { AttachmentCMS as CMS } from '../attachment-cms'
import { ContentDto } from './content.dto'

type AttachmentConfigType = {
  token: string
  baseUrl?: string
  id?: string
}
type ContentsPerPath = Record<string, ContentDto[]>
type ContentsResponse = {
  contents: ContentsPerPath
}

declare global {
  interface Window {
    AttachmentCMS: typeof CMS
    AttachmentConfig: AttachmentConfigType
  }
}
