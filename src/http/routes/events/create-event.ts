import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/events',
      {
        schema: {
          tags: ['events'],
          summary: 'Create an event',
          security: [{ bearerAuth: [] }],
          body: z.object({
            title: z.string(),
            photoUrl: z.string().nullable(),
            capacity: z.number().int().positive(),
            price: z.string(),
            dateBegin: z.string(),
            dateEnd: z.string(),
            hasSessions: z.boolean(),
            hasGiveaway: z.boolean(),
          }),
          response: {
            201: z.object({
              eventId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const {
          title,
          capacity,
          dateBegin,
          dateEnd,
          hasGiveaway,
          hasSessions,
          photoUrl,
          price,
        } = request.body

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        const slug = createSlug(title)

        const eventWithSameSlug = await prisma.event.findUnique({
          where: {
            slug,
          },
        })

        if (eventWithSameSlug) {
          throw new BadRequestError('Event with this slug already exists.')
        }

        const event = await prisma.event.create({
          data: {
            title,
            slug,
            capacity,
            dateBegin,
            dateEnd,
            hasGiveaway,
            hasSessions,
            price,
            photoUrl,
            authorId: userId,
          },
        })

        return reply.status(201).send({ eventId: event.id })
      },
    )
}
