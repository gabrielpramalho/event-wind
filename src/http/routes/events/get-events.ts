import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function getEvents(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events',
    {
      schema: {
        tags: ['events'],
        summary: 'Get all events',
        response: {
          200: z.object({
            events: z.array(
              z.object({
                id: z.string().uuid(),
                slug: z.string(),
                title: z.string(),
                photoUrl: z.string().nullable(),
                capacity: z.number().int(),
                price: z.string().nullable(),
                dateBegin: z.date(),
                dateEnd: z.date(),
                author: z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  email: z.string().email(),
                }),
              }),
            ),
          }),
        },
      },
    },
    async () => {
      const events = await prisma.event.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          photoUrl: true,
          capacity: true,
          dateBegin: true,
          dateEnd: true,
          price: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return { events }
    },
  )
}
