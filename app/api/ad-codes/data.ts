// Shared in-memory storage for AdCodes
export const providers: Array<{
  id: number;
  userId: number;
  domainId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}> = [];

export const codes: Array<{
  id: number;
  providerId: number;
  name: string;
  format: string;
  htmlCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}> = [];

// eslint-disable-next-line prefer-const
export let nextProviderId = 1;
// eslint-disable-next-line prefer-const
export let nextCodeId = 1;
