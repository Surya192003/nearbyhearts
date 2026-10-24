import {
  clearAllPhotos,
  clearPartnerPhoto,
  deleteSession,
  getPartnerPhoto,
  listPhotos,
  savePartnerPhoto,
  savePhoto,
  type StoredPhoto,
} from '@/lib/photoDb'

/**
 * LOCAL-ONLY SERVICE. No network. Every method reads/writes IndexedDB.
 * This intentionally does not follow the "swap for backend" convention,
 * because the privacy spec forbids server storage of photos.
 */
export const photoboothService = {
  async save(photos: StoredPhoto[]): Promise<void> {
    for (const photo of photos) {
      await savePhoto(photo)
    }
  },

  async list(): Promise<StoredPhoto[]> {
    return listPhotos()
  },

  async deleteSession(sessionId: string): Promise<void> {
    await deleteSession(sessionId)
  },

  async wipeAll(): Promise<void> {
    await clearAllPhotos()
  },

  async savePartnerPhoto(blob: Blob): Promise<void> {
    await savePartnerPhoto(blob)
  },

  async getPartnerPhoto(): Promise<Blob | null> {
    return getPartnerPhoto()
  },

  async clearPartnerPhoto(): Promise<void> {
    await clearPartnerPhoto()
  },
}