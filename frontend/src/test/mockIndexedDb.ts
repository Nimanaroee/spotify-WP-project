const idbStore = new Map<string, string>()

export function resetMockIndexedDb(): void {
  idbStore.clear()
}

export function installMockIndexedDb(): void {
  vi.stubGlobal('indexedDB', {
    open: (_name: string, _version?: number) => {
      const request = {
        result: null as IDBDatabase | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onupgradeneeded: null as ((event: Event) => void) | null,
      }

      queueMicrotask(() => {
        const db = {
          objectStoreNames: {
            contains: (name: string) => name === 'blobs',
          },
          transaction: (_storeName: string, mode: IDBTransactionMode) => {
            const tx = {
              oncomplete: null as (() => void) | null,
              onerror: null as (() => void) | null,
              objectStore: () => ({
                put: (value: string, key: string) => {
                  if (mode === 'readwrite') {
                    idbStore.set(key, value)
                  }
                  return { onsuccess: null, onerror: null }
                },
                delete: (key: string) => {
                  idbStore.delete(key)
                  return { onsuccess: null, onerror: null }
                },
                openCursor: () => {
                  const keys = [...idbStore.keys()]
                  let index = 0
                  const cursorRequest = {
                    result: null as
                      | { key: string; value: string; continue: () => void }
                      | null,
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                  }

                  const advance = (): void => {
                    if (index >= keys.length) {
                      cursorRequest.result = null
                    } else {
                      const key = keys[index]
                      cursorRequest.result = {
                        key,
                        value: idbStore.get(key) as string,
                        continue: () => {
                          index += 1
                          advance()
                          cursorRequest.onsuccess?.()
                        },
                      }
                    }
                    cursorRequest.onsuccess?.()
                  }

                  queueMicrotask(advance)
                  return cursorRequest
                },
              }),
            }
            queueMicrotask(() => tx.oncomplete?.())
            return tx
          },
        } as unknown as IDBDatabase

        request.result = db
        request.onsuccess?.({} as Event)
      })

      return request
    },
  })
}
