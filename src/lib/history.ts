export function extendHistoryEvent() {
  window.history.pushState = new Proxy(window.history.pushState, {
    apply: (target: any, thisArg: any, argArray?: any) => {
      const event = new Event('pushstate')
      const result = target.apply(thisArg, argArray)
      window.dispatchEvent(event)
      return result
    },
  })

  window.history.replaceState = new Proxy(window.history.replaceState, {
    apply: (target: any, thisArg: any, argArray?: any) => {
      const event = new Event('replacestate')
      const result = target.apply(thisArg, argArray)
      window.dispatchEvent(event)
      return result
    },
  })
}
