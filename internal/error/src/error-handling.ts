import type { BaseError } from "./errors/base"

type OkResult<V> = {
  val: V
  err?: never
}

type ErrResult<E extends BaseError> = {
  val?: never
  err: E
}

export type Result<V, E extends BaseError = BaseError> = OkResult<V> | ErrResult<E>

export function Ok(): OkResult<never>
export function Ok<V>(val: V): OkResult<V>
export function Ok<V>(val?: V): OkResult<V> {
  return { val } as OkResult<V>
}
export function Err<E extends BaseError>(err: E): ErrResult<E> {
  return { err }
}

/**
 * wrap catches thrown errors and returns a `Result`
 *
 * Example:
 *
  class OpenAiError extends BaseError {
    retry = false;
    name = OpenAiError.name;
  }

  const chatCompletion = await wrap(
    openai.chat.completions.create({ ...requestOptions, stream_options: { include_usage: true } }),
    (err) => new OpenAiError({ message: err.message }),
  );
  if (chatCompletion.err) {
    return c.text(chatCompletion.err.message, { status: 400 });
  }

 */
export async function wrapResult<T, E extends BaseError>(
  p: Promise<T>,
  errorFactory: (err: Error) => E
): Promise<Result<T, E>> {
  try {
    return Ok(await p)
  } catch (e) {
    return Err(errorFactory(e as Error))
  }
}
