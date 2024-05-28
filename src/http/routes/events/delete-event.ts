import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function deleteEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/events/:eventId',
      {
        schema: {
          tags: ['events'],
          summary: 'Delete an event',
          security: [{ bearerAuth: [] }],
          params: z.object({
            eventId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { eventId } = request.params

        const event = await prisma.event.findUnique({
          where: {
            id: eventId,
            authorId: userId,
          },
        })

        if (!event) {
          throw new BadRequestError('Event not found.')
        }

        await prisma.event.delete({
          where: {
            id: eventId,
            authorId: userId,
          },
        })

        return reply.status(204).send()
      },
    )
}
