export function setCorsHeaders(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Request-Method", "*")
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST")

  res.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, builderai-Telemetry-Platform builderai-Telemetry-Runtime builderai-Telemetry-SDK x-trpc-source"
  )
}

export function CorsOptions() {
  const response = new Response(null, {
    status: 204,
  })
  setCorsHeaders(response)
  return response
}
