// @ts-nocheck
import { check, sleep } from "k6"
import http from "k6/http"

export const options = {
  stages: [
    { duration: "10s", target: 1 },
    { duration: "2m", target: 1 },
    { duration: "10s", target: 2 },
    { duration: "2m", target: 2 },
    { duration: "10s", target: 3 },
    { duration: "2m", target: 3 },
    { duration: "10s", target: 4 },
    { duration: "2m", target: 4 },
    { duration: "10s", target: 5 },
    { duration: "2m", target: 5 },
  ],

  thresholds: {
    http_req_duration: ["p(50)<25", "p(90)<100", "p(99)<300"],
  },
}

export default function () {
  const endpoint = "http://host.docker.internal:3000/api/trpc/edge/customers.reportUsage"

  // create ramdom uuid for requestId
  const idempotencyKey = Math.floor(Math.random() * 10000000000).toString()

  const payload = {
    customerId: "cus_ukrj1U1nsLyrNfXjycuzcTjtZc3",
    featureSlug: "apikeys",
    usage: Math.floor(Math.random() * 100),
    idempotencyKey: idempotencyKey,
  }

  const trpcData = encodeURIComponent(JSON.stringify({ 0: { json: payload } }))

  const res = http.get(`${endpoint}?batch=1&input=${trpcData}`, {
    headers: {
      "x-builderai-api-key": "builderai_live_vixDq46bdgtm18Ztzh1XHefkSfs",
    },
  })

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time is < 500ms": (r) => r.timings.duration < 500,
  })

  sleep(1) // Wait for 1 second before the next iteration
}
