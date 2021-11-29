import { AttachmentCMS } from './attachment-cms'
import fetch, { enableFetchMocks } from 'jest-fetch-mock'
import { attachWindowMock, restoreWindow } from '../test/modules/window-mock'
import { ContentsPerPath } from './types/global'

enableFetchMocks()

describe('AttachmentCMS', () => {
  const service: any = new AttachmentCMS({ token: 'token' })

  describe('#run', () => {
    const data = { contents: { '/news': [{ selector: '#id', content: 'test', action: 'innerHTML' }] } }
    let observeElementMock: jest.SpyInstance
    let observeHistoryStateMock: jest.SpyInstance
    beforeEach(() => {
      fetch.mockResponseOnce(JSON.stringify(data))
      attachWindowMock(`http://localhost:3002/news`, '<html><head></head><body><div><p>abc</p></div></body></html>')
      observeElementMock = jest.spyOn(service, 'observeElement').mockReturnValue(undefined)
      observeHistoryStateMock = jest.spyOn(service, 'observeHistoryState').mockReturnValue(undefined)
    })
    afterEach(() => {
      restoreWindow()
      observeElementMock.mockClear()
      observeHistoryStateMock.mockClear()
    })

    test('run', async () => {
      await service.run()
      expect(service.contentsResponse).toEqual(data)
      expect(service.contents).toEqual(data.contents['/news'])
      expect(observeElementMock).toBeCalledTimes(1)
      expect(observeHistoryStateMock).toBeCalledTimes(1)
    })
  })

  describe('#constructor', () => {
    test('ブラウザのURLにtoken指定されていない場合', () => {
      const baseUrl = 'http://localhost:3000'
      const token = 'token'
      const target: any = new AttachmentCMS({ token, baseUrl })
      expect(target.url).toEqual(`${baseUrl}/contents`)
      expect(target.token).toEqual(token)
    })

    test('ブラウザのURLにtoken指定している場合', () => {
      const baseUrl = 'http://localhost:3000'
      const token = 'token'
      const querytoken = 'querytoken'
      attachWindowMock(`http://localhost:3002?acmst=${querytoken}`)
      const target: any = new AttachmentCMS({ token, baseUrl })
      expect(target.url).toEqual(`${baseUrl}/contents`)

      target.queryToken = target.getQueryToken()
      expect(target.url).toEqual(`${baseUrl}/contents/limited`)
      expect(target.token).toEqual(querytoken)
      restoreWindow()
    })
  })

  describe('#fetchContents', () => {
    const data = { contents: { '/news': [{ id: 1, selector: '', content: '', action: '' }] } }
    beforeEach(() => {
      fetch.mockResponseOnce(JSON.stringify(data))
    })

    test('fetching', async () => {
      const contentsResponse = await service.fetchContents()
      expect(contentsResponse).toEqual(data)
    })
  })

  describe('#extractMatchedContents', () => {
    beforeEach(() => {
      attachWindowMock(`http://localhost:3002/news/15`)
    })
    afterEach(() => {
      restoreWindow()
    })
    const data: ContentsPerPath = {
      '/news': [{ id: 1, type: 'ReleaseContentHistory', selector: '', content: '', action: '' }],
      '/news/1': [{ id: 2, type: 'ReleaseContentHistory', selector: '', content: '', action: '' }],
      '/news/15': [{ id: 3, type: 'ReleaseContentHistory', selector: '', content: '<span>テスト</span>', action: '' }],
      '/news/20': [{ id: 4, type: 'ReleaseContentHistory', selector: '', content: '', action: '' }],
    }

    test('マッチするpathが１つある', () => {
      const contents = service.extractMatchedContents(data)
      expect(contents.length).toEqual(1)
      expect(contents[0].content).toEqual('<span>テスト</span>')
    })
    test('マッチするpathが２つある', () => {
      data['/news/15'] = [
        { id: 5, type: 'ReleaseContentHistory', selector: '', content: '<span>テスト</span>', action: '' },
        { id: 6, type: 'PluginContentHistory', selector: '', content: '<span>テスト2</span>', action: '' },
      ]
      const contents = service.extractMatchedContents(data)
      expect(contents.length).toEqual(2)
      expect(contents[0].content).toEqual('<span>テスト2</span>')
      expect(contents[1].content).toEqual('<span>テスト</span>')
    })
    test('マッチするpathがない', () => {
      delete data['/news/15']
      const contents = service.extractMatchedContents(data)
      expect(contents.length).toEqual(0)
    })
  })

  describe('#applyContents', () => {
    test('対象Elementがない', () => {
      attachWindowMock(`http://localhost:3002/news/15`, `<div><div id="description"></div></div>`)
      service.contents = [{ id: 1, selector: '#description > p', content: '<span>テスト</span>', action: 'innerHTML' }]
      service.applyContents()
      expect(document.body.innerHTML).toEqual(`<div><div id="description"></div></div>`)
      restoreWindow()
    })
    describe('対象Elementがある', () => {
      beforeEach(() => {
        attachWindowMock(
          `http://localhost:3002/news/15`,
          `<div><div id="description"><p><span>1</span><span>999</span></p></div></div>`,
        )
      })
      afterEach(() => {
        restoreWindow()
      })

      test('action is innerHTML', () => {
        service.contents = [
          {
            id: 1,
            selector: '#description > p',
            content: '<span id="acms-content-1">テスト</span>',
            action: 'innerHTML',
          },
        ]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><p><span id="acms-content-1">テスト</span></p></div></div>`,
        )
      })
      test('action is remove', () => {
        service.contents = [{ id: 1, selector: '#description > p', content: null, action: 'remove' }]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><p id="acms-content-1" style="display: none;"><span>1</span><span>999</span></p></div></div>`,
        )
      })
      test('action is insertBefore', () => {
        service.contents = [
          {
            id: 1,
            selector: '#description > p',
            content: '<span id="acms-content-1">テスト</span>',
            action: 'insertBefore',
          },
        ]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><span id="acms-content-1">テスト</span><p><span>1</span><span>999</span></p></div></div>`,
        )
      })
      test('action is insertChildAfterBegin', () => {
        service.contents = [
          {
            id: 1,
            selector: '#description > p',
            content: '<span id="acms-content-1">テスト</span>',
            action: 'insertChildAfterBegin',
          },
        ]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><p><span id="acms-content-1">テスト</span><span>1</span><span>999</span></p></div></div>`,
        )
      })
      test('action is insertChildBeforeEnd', () => {
        service.contents = [
          {
            id: 1,
            selector: '#description > p',
            content: '<span id="acms-content-1">テスト</span>',
            action: 'insertChildBeforeEnd',
          },
        ]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><p><span>1</span><span>999</span><span id="acms-content-1">テスト</span></p></div></div>`,
        )
      })
      test('action is insertAfter', () => {
        service.contents = [
          {
            id: 1,
            selector: '#description > p',
            content: '<span id="acms-content-1">テスト</span>',
            action: 'insertAfter',
          },
        ]
        service.applyContents()
        expect(document.body.innerHTML).toEqual(
          `<div><div id="description"><p><span>1</span><span>999</span></p><span id="acms-content-1">テスト</span></div></div>`,
        )
      })
    })
  })

  describe('#observeElement', () => {
    test('監視開始する', () => {
      // NOTE: MutationObserverの動き自体は確認できないのでエラーが無ければOK
      expect(() => {
        service.observeElement()
      }).not.toThrow()
    })
  })

  describe('#observeHistoryState', () => {
    test('監視開始する', () => {
      // NOTE: MutationObserverの動き自体は確認できないのでエラーが無ければOK
      expect(() => {
        service.observeHistoryState()
      }).not.toThrow()
    })
  })
})
