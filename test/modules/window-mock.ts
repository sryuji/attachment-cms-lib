import { JSDOM } from 'jsdom'

let windowSpy = jest.spyOn(global, 'window', 'get')
let documentSpy = jest.spyOn(global, 'document', 'get')

export function attachWindowMock(url: string, html = '') {
  windowSpy = jest.spyOn(global, 'window', 'get')
  documentSpy = jest.spyOn(global, 'document', 'get')

  const originalWindow = Object.create(window)
  const jsdom = new JSDOM(html, { url })
  const jsdomWindow = jsdom.window
  windowSpy.mockImplementation(() => ({
    ...originalWindow,
    location: {
      ...jsdomWindow.location,
    },
  }))
  documentSpy.mockImplementation(() => jsdomWindow.document)
}

export function restoreWindow() {
  windowSpy.mockRestore()
  documentSpy.mockRestore()
}
