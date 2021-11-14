import { ContentDto } from './types/content.dto'
import { AttachmentConfigType, ContentsPerPath, ContentsResponse } from './types/global'
import throttle from 'lodash.throttle'
import { extendHistoryEvent } from './lib/history'

export class AttachmentCMS {
  private baseUrl: string
  private defaultToken: string
  private queryToken: string
  private contents: ContentDto[]
  private id: string
  private contentsResponse: ContentsResponse
  private throttleApplyContents: Function

  /**
   *
   * @param {Object} options
   * @param {string} options.token Scope単位に発行されるtoken
   * @param {string} options.baseUrl
   * @param {string} options.id html tagのid. このtag配下で機能が有効になる. 未指定ではbody tag.
   */
  constructor(options: AttachmentConfigType) {
    if (!options || !options.token) throw new Error('Required acmst query parameter as token.')
    this.baseUrl = (options && options.baseUrl) || 'https://api.attachment-cms.dev'
    this.defaultToken = options.token
    this.id = (options && options.id) || null
    this.throttleApplyContents = throttle(this.applyContents, 200)
  }

  get isClient(): boolean {
    return typeof window === 'undefined'
  }

  get url() {
    return this.queryToken ? `${this.baseUrl}/contents/limited` : `${this.baseUrl}/contents`
  }

  get token() {
    return this.queryToken || this.defaultToken
  }

  async run() {
    if (this.isClient) return

    this.queryToken = this.getQueryToken()
    this.showLimitedMode()
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

  private getQueryToken(): string {
    let qtoken = sessionStorage.getItem('acmst')
    if (qtoken) return qtoken

    const urlParams = new URLSearchParams(window.location.search)
    qtoken = urlParams.get('acmst')
    if (qtoken) sessionStorage.setItem('acmst', qtoken)
    return qtoken
  }

  private showLimitedMode(): void {
    if (!this.queryToken) return

    const el = document.getElementsByTagName('body')[0]
    const content = `<div style="position: fixed; bottom: 20px; right: 30px;background-color: #46F28D; box-shadow: 0 10px 25px 0 rgba(0, 0, 0, .5); border-radius: 6px;">
    <p style="padding: 10px; font-weight: 600;">限定公開<br/>by attachment CMS</p>
    </div>`
    this.insertLastChildToElement(el, content)
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
      throw new Error('No found observed element.')
    }

    const mo = new MutationObserver(() => {
      this.throttleApplyContents()
    })
    const config: MutationObserverInit = {
      attributes: false,
      characterData: true,
      childList: true,
      subtree: true,
    }
    mo.observe(document, config)
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
    extendHistoryEvent()
    const callback = () => {
      this.contents = this.extractMatchedContents(this.contentsResponse.contents)
    }
    window.addEventListener('popstate', callback)
    window.addEventListener('pushstate', callback)
    window.addEventListener('replacestate', callback)
  }
}
