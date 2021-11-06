import { ContentDto } from './types/content.dto'
import { AttachmentConfigType, ContentsPerPath, ContentsResponse } from './types/global'
import throttle from 'lodash.throttle'

export class AttachmentCMS {
  private url: string
  private token: string
  private contents: ContentDto[]
  private id: string
  private contentsResponse: ContentsResponse

  /**
   *
   * @param {Object} options
   * @param {string} options.token Scope単位に発行されるtoken
   * @param {string} options.baseUrl
   * @param {string} options.id html tagのid. このtag配下で機能が有効になる. 未指定ではbody tag.
   */
  constructor(options: AttachmentConfigType) {
    if (!options || !options.token) throw new Error('Required token.')

    const baseUrl = (options && options.baseUrl) || 'https://api.attachment-cms.dev'
    const urlParams = new URLSearchParams(window.location.search)
    const queryToken = urlParams.get('token')
    if (queryToken) {
      this.token = queryToken
      this.url = `${baseUrl}/contents/limited`
    } else {
      this.token = options.token
      this.url = `${baseUrl}/contents`
    }
    this.id = (options && options.id) || null
  }

  async run() {
    this.contentsResponse = await this.fetchContents()
    this.contents = this.extractMatchedContents(this.contentsResponse.contents)

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        this.applyContents()
        this.observeElement()
        this.observeHistoryState()
      })
    } else {
      this.applyContents()
      this.observeElement()
      this.observeHistoryState()
    }
  }

  private async fetchContents(): Promise<ContentsResponse> {
    const url = `${this.url}?token=${this.token}`
    const response = await fetch(url)
    return response.json()
  }

  private extractMatchedContents(data: ContentsPerPath): ContentDto[] {
    if (!data) return []
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
    const el: HTMLElement = this.id ? document.getElementById(this.id) : document.getElementsByTagName('body')[0]
    if (!el) {
      this.id && console.warn(`No exists html element. id: ${this.id}`)
      return
    }

    const mo = new MutationObserver(() => {
      throttle(this.applyContents, 1000)
    })
    const config: MutationObserverInit = {
      attributes: false,
      attributeOldValue: false,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    }
    mo.observe(el, config)
  }

  private applyContents() {
    this.contents.forEach((r) => {
      const el: Element = document.querySelector(r.selector)
      if (!el) return

      if (r.content && !r.content.startsWith('<')) {
        r.content = `<div>${r.content}</div>`
      }
      switch (r.action) {
        case 'innerHTML':
          if (el.innerHTML === r.content) return
          el.innerHTML = r.content
          break
        case 'remove':
          el.parentNode.removeChild(el)
          break
        case 'insertBefore':
          this.insertBeforeElement(el, r.content)
          break
        case 'insertChildAfterBegin':
          this.insertFirstChildToElement(el, r.content)
          break
        case 'insertChildBeforeEnd':
          this.insertLastChildToElement(el, r.content)
          break
        case 'insertAfter':
          this.insertAfterElement(el, r.content)
          break
      }
    })
  }

  private insertBeforeElement(el: Element, content: string): void {
    const prevNode = el.previousSibling as Element
    if (prevNode && prevNode.innerHTML === content) return
    el.insertAdjacentHTML('beforebegin', content)
  }

  private insertFirstChildToElement(el: Element, content: string): void {
    const firstChild = el.firstChild as Element
    if (firstChild && firstChild.innerHTML === content) return
    el.insertAdjacentHTML('afterbegin', content)
  }

  private insertLastChildToElement(el: Element, content: string): void {
    const lastChild = el.lastChild as Element
    if (lastChild && lastChild.innerHTML === content) return
    el.insertAdjacentHTML('beforeend', content)
  }

  private insertAfterElement(el: Element, content: string): void {
    const lastChild = el.lastChild as Element
    if (lastChild && lastChild.innerHTML === content) return
    el.insertAdjacentHTML('afterend', content)
  }

  private observeHistoryState() {
    window.onpopstate = () => {
      this.contents = this.extractMatchedContents(this.contentsResponse.contents)
      this.applyContents()
    }
  }
}
