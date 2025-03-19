import type { Database } from "@unprice/db"
import type { CustomerEntitlement } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "~/cache"
import type { Metrics } from "~/metrics/interface"
import type { DurableObjectUsagelimiter } from "./do"
import type {
  ReportUsageRequest,
  ReportUsageResponse,
  RevalidateRequest,
  UsageLimiter,
} from "./interface"
import { isValidEntitlement } from "./util"

export class DurableUsageLimiter implements UsageLimiter {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly logger: Logger
  private readonly metrics: Metrics
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly db: Database
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void

  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    requestId: string
    domain?: string
    logger: Logger
    metrics: Metrics
    analytics: Analytics
    cache: Cache
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    db: Database
  }) {
    this.namespace = opts.namespace
    this.logger = opts.logger
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.cache = opts.cache
    this.waitUntil = opts.waitUntil
    this.db = opts.db
  }

  private getStub(
    name: string,
    locationHint?: DurableObjectLocationHint
  ): DurableObjectStub<DurableObjectUsagelimiter> {
    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  private getDurableCustomerFeatureId(customerId: string, featureSlug: string): string {
    return `${customerId}:${featureSlug}`
  }

  private async getEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string,
    opts: {
      skipCache?: boolean
    }
  ): Promise<Result<CustomerEntitlement, FetchError>> {
    if (opts.skipCache) {
      const entitlement = await this.db.query.customerEntitlements
        .findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.customerId, customerId),
              operators.eq(fields.featureSlug, featureSlug),
              operators.eq(fields.projectId, projectId)
            )
          },
        })
        .then((entitlement) => {
          if (!entitlement) {
            return null
          }

          return entitlement
        })

      if (!entitlement) {
        return Err(
          new FetchError({
            message: "entitlement not found",
            retry: false,
          })
        )
      }

      return Ok(entitlement)
    }

    const { val, err } = await this.cache.featureByCustomerId.swr(
      this.getDurableCustomerFeatureId(customerId, featureSlug),
      async () => {
        const entitlement = await this.db.query.customerEntitlements
          .findFirst({
            where(fields, operators) {
              return operators.and(
                operators.eq(fields.customerId, customerId),
                operators.eq(fields.featureSlug, featureSlug),
                operators.eq(fields.projectId, projectId)
              )
            },
          })
          .then((entitlement) => {
            return entitlement ?? null
          })

        return entitlement
      }
    )

    if (err) {
      this.logger.error("error getting entitlement", {
        error: err.message,
        customerId,
        featureSlug,
        projectId,
      })

      return Err(
        new FetchError({
          message: err.message,
          retry: true,
          cause: err,
        })
      )
    }

    // cache miss, get from db
    if (!val) {
      // log cache miss
      const entitlement = await this.db.query.customerEntitlements
        .findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.customerId, customerId),
              operators.eq(fields.featureSlug, featureSlug),
              operators.eq(fields.projectId, projectId)
            )
          },
        })
        .then((entitlement) => {
          return entitlement ?? null
        })

      if (!entitlement) {
        return Err(
          new FetchError({
            message: "entitlement not found",
            retry: false,
          })
        )
      }

      return Ok(entitlement)
    }

    return Ok(val)
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    try {
      // Good to know: DO is generally in the same region as the customer

      // Fast path: check if the limit is reached in the cache
      // Fast path: check if the event is already sent to the DO

      // Next path: get the entitlement from cache which is revalidated with the DO

      // Next path: send the usage to the DO

      // Next path: get the entitlement from DB

      // cache the responses

      const { err, val: entitlement } = await this.getEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId,
        {
          skipCache: false,
        }
      )

      if (err) {
        return { valid: false, message: err.message }
      }

      // validate entitlement dates
      if (!isValidEntitlement(entitlement, data.date)) {
        return { valid: false, message: "entitlement dates are invalid, please contact support." }
      }

      const threshold = 80 // notify when the usage is 80% or more
      const currentUsage = entitlement.usage ?? 0
      const limit = entitlement.limit
      let message = ""
      let notifyUsage = false

      // check flat features
      if (entitlement.featureType === "flat") {
        return { valid: true }
      }

      // check limit
      if (limit) {
        const usagePercentage = (currentUsage / limit) * 100

        if (currentUsage >= limit) {
          // Usage has reached or exceeded the limit
          message = `Your feature ${entitlement.featureSlug} has reached or exceeded its usage limit of ${limit}. Current usage: ${usagePercentage.toFixed(
            2
          )}% of its usage limit. This is over the limit by ${currentUsage - limit}`
          notifyUsage = true
        } else if (usagePercentage >= threshold) {
          // Usage is at or above the threshold
          message = `Your feature ${entitlement.featureSlug} is at ${usagePercentage.toFixed(
            2
          )}% of its usage limit`
          notifyUsage = true
        }
      }

      const durableObjectFeatureId = this.getDurableCustomerFeatureId(
        data.customerId,
        data.featureSlug
      )

      const durableObject = this.getStub(durableObjectFeatureId)

      // broadcast the usage to the project and the customer if any user is connected
      this.waitUntil(
        Promise.all([
          // TODO: send the usage to the analytics
          // TODO: broadcast the usage to the project and the customer if any user is connected
          // report the usage to analytics db
          // TODO: add notification to email, slack?
          notifyUsage &&
            durableObject.broadcast(
              JSON.stringify({
                customerId: data.customerId,
                featureSlug: data.featureSlug,
                usage: data.usage,
                date: data.date,
              })
            ),
          this.analytics
            .ingestFeaturesUsage({
              idempotenceKey: data.idempotenceKey,
              planVersionFeatureId: entitlement.featurePlanVersionId,
              subscriptionItemId: entitlement.subscriptionItemId,
              projectId: entitlement.projectId,
              usage: data.usage,
              timestamp: Date.now(),
              createdAt: Date.now(),
              entitlementId: entitlement.id,
              featureSlug: data.featureSlug,
              customerId: data.customerId,
              subscriptionPhaseId: entitlement.subscriptionPhaseId!,
              subscriptionId: entitlement.subscriptionId!,
              requestId: "",
              // TODO: add metadata to the usage
              metadata: {
                prompt: "test",
              },
            })
            .then((res) => {
              if (res.successful_rows <= 0) {
                this.logger.error("Error reporting usage to analytics ingestFeaturesUsage", {
                  ...res,
                  entitlement: entitlement,
                  usage: data.usage,
                })
              }
            })
            .catch((error) => {
              this.logger.error("Error reporting usage to analytics ingestFeaturesUsage", {
                error: JSON.stringify(error),
                entitlement: entitlement,
                usage: data.usage,
              })
            }),
        ])
      )

      return { valid: true, message, remaining: limit ? limit - currentUsage : undefined }
    } catch (e) {
      console.error("usagelimit failed", {
        customerId: data.customerId,
        error: (e as Error).message,
      })
      return { valid: false }
    } finally {
    }
  }

  public async revalidate(req: RevalidateRequest): Promise<void> {
    const obj = this.namespace.get(this.namespace.idFromName(req.customerId))
    await obj.revalidate()
  }
}
