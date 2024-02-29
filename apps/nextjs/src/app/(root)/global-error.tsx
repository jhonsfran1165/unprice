"use client"

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    // eslint-disable-next-line jsx-a11y/html-has-lang
    <html>
      <body>
        <h2>Something went wrong! {}</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
