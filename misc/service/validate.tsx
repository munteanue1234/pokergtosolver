import { ZodError, ZodSchema } from "zod";


type ActionError<T> = Partial<Record<keyof T, string>>;
export type RequestBody = {
  [k: string]: FormDataEntryValue;
};

export async function validateActionInput<ActionInput>({
                                                  request,
                                                  body,
                                                  schema,
                                                }: {
  request?: Request;
  body?: RequestBody;
  schema: ZodSchema;
}) {
  let dataBody: RequestBody = {};

  if (request) {
    dataBody = Object.fromEntries(await request.formData());
  }
  if (body) {
    dataBody = body;
  }
  try {
    const formData = schema.parse(dataBody) as ActionInput;
    return {
      formData,
      errors: null,
    };
  } catch (error) {
    const errors = error as ZodError<ActionInput>;
    return {
      formData: body,
      errors: errors.issues.reduce((acc: ActionError<ActionInput>, curr) => {
        const key = curr.path[0] as keyof ActionInput;
        acc[key] = curr.message;
        return acc;
      }, {}),
    };
  }
}