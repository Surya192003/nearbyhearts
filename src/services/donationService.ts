import { apiPost } from '@/lib/api'
import type { DonationPayload, DonationReceipt } from '@/types'

export const donationService = {
  async submit(payload: DonationPayload): Promise<DonationReceipt> {
    return apiPost<DonationReceipt>('/donations', payload)
  },
}