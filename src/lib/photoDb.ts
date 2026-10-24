export type StoredPhoto = {
  id: string
  sessionId: string
  ownerId: string
  createdAt: string
  blob: Blob
  width: number
  height: number
}

export type Capture = {
  blob: Blob
  url: string
  width: number
  height: number
}

const DB_NAME = 'nearbyhearts-photos'
const DB_VERSION = 2
const STORE_PHOTOS = 'photos'
const STORE_PARTNER = 'partner-photo'
const PARTNER_KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const store = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' })
        store.createIndex('sessionId', 'sessionId')
        store.createIndex('createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains(STORE_PARTNER)) {
        db.createObjectStore(STORE_PARTNER)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite')
    tx.objectStore(STORE_PHOTOS).put(photo)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error ?? new Error('savePhoto failed'))
  })
}

export async function listPhotos(): Promise<StoredPhoto[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly')
    const req = tx.objectStore(STORE_PHOTOS).getAll()
    req.onsuccess = () => {
      const all = req.result as StoredPhoto[]
      resolve(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite')
    const store = tx.objectStore(STORE_PHOTOS)
    const index = store.index('sessionId')
    const req = index.openCursor(IDBKeyRange.only(sessionId))
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite')
    tx.objectStore(STORE_PHOTOS).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error)
  })
}

export async function savePartnerPhoto(blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PARTNER, 'readwrite')
    tx.objectStore(STORE_PARTNER).put(blob, PARTNER_KEY)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error ?? new Error('savePartnerPhoto failed'))
  })
}

export async function getPartnerPhoto(): Promise<Blob | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PARTNER, 'readonly')
    const req = tx.objectStore(STORE_PARTNER).get(PARTNER_KEY)
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function clearPartnerPhoto(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PARTNER, 'readwrite')
    tx.objectStore(STORE_PARTNER).delete(PARTNER_KEY)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error)
  })
}