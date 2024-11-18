import { ZodTypeAny, z } from "zod";

const validator = (schema: ZodTypeAny, source: "body" | "params" | "query") => {
  return async (ctx, next) => {
    try {
      await schema.parseAsync(ctx.request[source]);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = {
          message: `Invalid ${source} schema`,
          errors: err.errors,
        };
      } else {
        next(err);
      }
    }
  };
};

const body = (schema: ZodTypeAny) => validator(schema, "body");
const params = (schema: ZodTypeAny) => validator(schema, "params");
const query = (schema: ZodTypeAny) => validator(schema, "query");

export { body, params, query };
export default validator;
