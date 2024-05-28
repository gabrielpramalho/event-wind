import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function updateEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/events/:eventId',
      {
        schema: {
          tags: ['events'],
          summary: 'Update an event',
          security: [{ bearerAuth: [] }],
          params: z.object({
            eventId: z.string().uuid(),
          }),
          body: z.object({
            title: z.string(),
            photoUrl: z.string().nullable(),
            capacity: z.number().int().positive(),
            price: z.string().nullable(),
            dateBegin: z.string(),
            dateEnd: z.string(),
            hasSessions: z.boolean(),
            hasGiveaway: z.boolean(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { eventId } = request.params

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

        const event = await prisma.event.findUnique({
          where: {
            id: eventId,
            authorId: userId,
          },
        })

        if (!event) {
          throw new BadRequestError('Event not found.')
        }

        const isEnded = dayjs().isAfter(event.dateEnd)

        if (isEnded) {
          throw new BadRequestError('This event is already ended!')
        }

        const dateEndIsBeforeDateBegin = dayjs(dateEnd).isBefore(dateBegin)

        if (dateEndIsBeforeDateBegin) {
          throw new BadRequestError('Date is invalid')
        }

        const dateBeginIsInvalid = dayjs(dateBegin).isBefore()

        if (dateBeginIsInvalid) {
          throw new BadRequestError('Date is invalid')
        }

        const dateEndIsInvalid = dayjs(dateEnd).isBefore()

        if (dateEndIsInvalid) {
          throw new BadRequestError('Date is invalid')
        }

        await prisma.event.update({
          where: {
            id: eventId,
            authorId: userId,
          },
          data: {
            title,
            capacity,
            dateBegin,
            dateEnd,
            hasGiveaway,
            hasSessions,
            photoUrl,
            price,
          },
        })

        return reply.status(204).send()
      },
    )
}
