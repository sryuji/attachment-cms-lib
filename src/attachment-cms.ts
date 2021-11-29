import { ContentDto } from './types/content.dto'
import { AttachmentConfigType, ContentsPerPath, ContentsResponse } from './types/global'
import throttle from 'lodash.throttle'
import { extendHistoryEvent } from './lib/history'

export const BASE_HTML_ID = 'acms-content'
const CONTENT_TYPES = ['PluginContentHistory', 'ReleaseContentHistory']

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
    this.throttleApplyContents = throttle(this.applyContents, (options && options.throttleMs) || 200)
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
    const content = `<div id="${BASE_HTML_ID}-limited-mark" style="position: fixed; bottom: 20px; right: 30px;background-color: #46F28D; box-shadow: 0 10px 25px 0 rgba(0, 0, 0, .5); border-radius: 6px;">
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
    const currentPath = window.location.pathname.replace(/\/$/, '')
    return pathList
      .filter((path) => {
        path = path.replace(/\/$/, '')
        const regex = new RegExp(String.raw`^${path}$`, 'i')
        return currentPath.match(regex)
      })
      .map((path) => data[path])
      .flat()
      .sort((x, y) => this.calcContentIndex(x.type) - this.calcContentIndex(y.type))
  }

  private calcContentIndex(type: string) {
    let index = CONTENT_TYPES.indexOf(type)
    index = index === -1 ? 999 : index
    return index
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
    mo.observe(el, config)
  }

  private applyContents() {
    this.contents.forEach((r) => {
      const target: Element = document.querySelector(r.selector)
      if (!target) return

      const htmlId = `${BASE_HTML_ID}-${r.id}`
      const processed = document.getElementById(htmlId)
      if (processed) return

      switch (r.action) {
        case 'innerHTML':
          target.innerHTML = r.content
          break
        case 'remove':
          this.removeElement(target, htmlId)
          break
        case 'insertBefore':
          this.insertBeforeElement(target, r.content)
          break
        case 'insertChildAfterBegin':
          this.insertFirstChildToElement(target, r.content)
          break
        case 'insertChildBeforeEnd':
          this.insertLastChildToElement(target, r.content)
          break
        case 'insertAfter':
          this.insertAfterElement(target, r.content)
          break
      }
    })
  }

  private removeElement(el: Element, htmlId: string): void {
    // NOTE: 実際に削除すると、次のapplyContents時に別のElementがselectされる可能性が残るため、DON構成が変わらないようにdisplay: noneなinnnerHTMLを挿入してmarker代わりにし対処
    el.id = htmlId
    el.setAttribute('style', 'display: none;')
  }

  private insertBeforeElement(el: Element, content: string): void {
    el.insertAdjacentHTML('beforebegin', content)
  }

  private insertFirstChildToElement(el: Element, content: string): void {
    el.insertAdjacentHTML('afterbegin', content)
  }

  private insertLastChildToElement(el: Element, content: string): void {
    el.insertAdjacentHTML('beforeend', content)
  }

  private insertAfterElement(el: Element, content: string): void {
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
