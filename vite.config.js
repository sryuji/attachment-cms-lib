import * as path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'AttachmentCMS',
      fileName: (format) => `attachment-cms-lib.${format}.js`,
    },
  },
})
