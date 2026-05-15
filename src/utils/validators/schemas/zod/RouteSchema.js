import { z } from 'zod';
import { BaseRouteSchema } from './BaseRouteSchema.js';

const RouteSchema = BaseRouteSchema.extend({
  active: z.boolean().default(true),
  get: z.boolean().default(false),
  post: z.boolean().default(false),
  put: z.boolean().default(false),
  patch: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const RouteUpdateSchema = RouteSchema.partial();

export { RouteSchema, RouteUpdateSchema };
