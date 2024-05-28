import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:slug',
    {
      schema: {
        tags: ['events'],
        summary: 'Get an event details',
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string().uuid(),
              slug: z.string(),
              title: z.string(),
              photoUrl: z.string().nullable(),
              capacity: z.number().int(),
              price: z.string().nullable(),
              dateBegin: z.date(),
              dateEnd: z.date(),
              isEnded: z.boolean(),
              author: z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string().email(),
              }),
            }),
          }),
        },
      },
    },
    async (request) => {
      const { slug } = request.params

      const event = await prisma.event.findUnique({
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
        where: {
          slug,
        },
      })

      if (!event) {
        throw new BadRequestError('Event not found')
      }

      const isEnded = dayjs().isAfter(event.dateEnd)

      return {
        event: {
          ...event,
          isEnded,
        },
      }
    },
  )
}
