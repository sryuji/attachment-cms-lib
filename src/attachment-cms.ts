import { ContentDto } from './types/content.dto'
import { AttachmentConfigType, ContentsPerPath, ContentsResponse } from './types/global'

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

    const baseUrl = (options && options.baseUrl) || 'https://attachment-cms.dev'
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

    const mo = new MutationObserver(() => this.applyContents())
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

  private observeHistoryState() {
    window.onpopstate = () => {
      this.contents = this.extractMatchedContents(this.contentsResponse.contents)
      this.applyContents()
    }
  }
}
