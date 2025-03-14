import { Tinybird } from '@chronark/zod-bird';
import { z } from 'zod';

export const createTinyClient = (token: string, url: string) => {
  return new Tinybird({
    token,
    baseUrl: url,
  })
}

export const eventSchema = z.object({
  id: z.number(),
  customerId: z.string(),
  featureSlug: z.string(),
  timestamp: z.number(),
  usage: z.number(),
});
