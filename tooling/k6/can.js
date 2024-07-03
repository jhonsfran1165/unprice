// @ts-nocheck
import { check, sleep } from "k6"
import http from "k6/http"

export const options = {
  stages: [{ duration: "120s", target: 10 }],

  thresholds: {
    http_req_duration: ["p(50)<25", "p(90)<100", "p(99)<300"],
  },
}

export default function () {
  const endpoint = "http://host.docker.internal:3000/api/trpc/edge/customers.can"

  // pick randomly one of the following elements in the array
  const features = ["apikeys", "seats", "basic-access", "verifications", "customers", "pro-access"]

  const payload = {
    customerId: "cus_2GGH1GE4864s4GrX6ttkjbStDP3k",
    featureSlug: features[Math.floor(Math.random() * features.length)],
  }

  const trpcData = encodeURIComponent(JSON.stringify({ 0: { json: payload } }))

  const res = http.get(`${endpoint}?batch=1&input=${trpcData}`, {
    headers: {
      "x-builderai-api-key": "builderai_live_2gqw6y4APfPrAoRFRz2EvkW3veHX",
    },
  })

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time is < 500ms": (r) => r.timings.duration < 500,
  })

  sleep(1) // Wait for 1 second before the next iteration
}
