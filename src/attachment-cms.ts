import { ContentDto } from './types/content.dto'

export class AttachmentCMS {
  private url: string
  private token: string
  private contents: ContentDto[]

  constructor(token: string, baseUrl?: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const queryToken = urlParams.get('token')
    if (queryToken) {
      this.token = queryToken
      this.url = baseUrl ? `${baseUrl}/contents/limited` : 'https://attachment-cms.dev/contents/limited'
    } else {
      this.token = token
      this.url = baseUrl ? `${baseUrl}/contents` : 'https://attachment-cms.dev/contents'
    }
  }

  async run() {
    await this.fetchContents()
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        this.applyContents()
        this.observeElement()
      })
    } else {
      this.applyContents()
      this.observeElement()
    }
  }

  private async fetchContents() {
    const url = `${this.url}?token=${this.token}`
    const response = await fetch(url)
    const data: Record<'contents', Record<string, ContentDto[]>> = await response.json()
    this.contents = this.extractMatchedContents(data.contents)
  }

  private extractMatchedContents(data: Record<string, ContentDto[]>): ContentDto[] {
    const pathList = Object.keys(data)
    const currentPath = window.location.pathname
    return pathList
      .filter((path) => {
        const regex = new RegExp(String.raw`^${path}$`, 'i')
        return currentPath.match(regex)
      })
      .map((path) => data[path])
      .flat()
  }

  // https://developer.mozilla.org/ja/docs/Web/API/MutationRecord
  private observeElement() {
    const bodyElement: HTMLBodyElement = document.getElementsByTagName('body')[0]
    // document.querySelector('body')
    const mo = new MutationObserver((mutationsList: MutationRecord[]) => {
      console.log(mutationsList)
      this.applyContents()
    })
    const config: MutationObserverInit = {
      attributes: false,
      attributeOldValue: false,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    }
    mo.observe(bodyElement, config)
  }

  private applyContents() {
    this.contents.forEach((r) => {
      const el = document.querySelector(r.selector)
      if (!el) return
      switch (r.action) {
        case 'innerHTML':
          el.innerHTML = r.content
          break
        case 'remove':
          el.parentNode.removeChild(el)
          break
        case 'insertBefore':
          el.insertAdjacentHTML('beforebegin', r.content)
          break
        case 'insertChildAfterBegin':
          el.insertAdjacentHTML('afterbegin', r.content)
          break
        case 'insertChildBeforeEnd':
          el.insertAdjacentHTML('beforeend', r.content)
          break
        case 'insertAfter':
          el.insertAdjacentHTML('afterend', r.content)
          break
      }
    })
  }
}
