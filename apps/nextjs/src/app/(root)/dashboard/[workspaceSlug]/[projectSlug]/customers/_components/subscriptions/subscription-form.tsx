"use client"

import { HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useFieldArray } from "react-hook-form"

import type { RouterOutputs } from "@unprice/api"
import {
  COLLECTION_METHODS,
  START_CYCLES,
  START_CYCLE_MAP,
  SUBSCRIPTION_TYPES,
  WHEN_TO_BILLING,
} from "@unprice/db/utils"
import type { InsertSubscription, Subscription, SubscriptionItem } from "@unprice/db/validators"
import { createDefaultSubscriptionConfig, subscriptionInsertSchema } from "@unprice/db/validators"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Separator } from "@unprice/ui/separator"
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { z } from "zod"
import { ConfirmAction } from "~/components/confirm-action"
import PaymentMethodsFormField from "~/components/forms/payment-method-field"
import TimeZoneFormField from "~/components/forms/timezone-field"
import { InputWithAddons } from "~/components/input-addons"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"
import CustomerFormField from "./customer-field"
import DurationFormField from "./duration-field"
import EndDateFormField from "./enddate-field"

import ConfigItemsFormField from "~/components/forms/items-fields"
import SelectPlanFormField from "~/components/forms/select-plan-field"
import PlanNewVersionFormField from "./plan-new-version-field"

type PlanVersionResponse = RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]
type Customer = RouterOutputs["customers"]["listByActiveProject"]["customers"][0]

export function SubscriptionForm({
  setDialogOpen,
  defaultValues,
  isChangePlanSubscription,
  readOnly,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues:
    | (InsertSubscription & { items?: SubscriptionItem[] })
    | (Subscription & { items?: SubscriptionItem[] })
  isChangePlanSubscription?: boolean
  readOnly?: boolean
}) {
  const router = useRouter()
  const [selectedPlanVersion, setSelectedPlanVersion] = useState<PlanVersionResponse>()
  const [selectedNewPlanVersion, setSelectedNewPlanVersion] = useState<PlanVersionResponse>()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>()

  const defaultValuesData = useMemo(() => {
    if (isChangePlanSubscription) {
      // we have to delete endDate and other fields that are not the same when the user is trying to change the plan
      defaultValues.endDateAt = undefined
      defaultValues.nextPlanVersionTo = undefined
    }
    return defaultValues
  }, [defaultValues.id])

  // this schema is a bit complex because we need to validate the payment method depending on the plan version
  const generateFormSchema = () => {
    if (isChangePlanSubscription) {
      return subscriptionInsertSchema
        .extend({
          endDate: z.number(),
          nextPlanVersionTo: z.string().min(1),
        })
        .required({
          id: true,
          customerId: true,
          nextPlanVersionTo: true,
        })
        .superRefine((data, ctx) => {
          // validate that the end date is after the start date
          if (data.endDateAt && data.startDateAt && data.endDateAt < data.startDateAt) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "End date must be after start date",
              path: ["endDate"],
              fatal: true,
            })
          }

          // validate that the new plan version is not the same as the current plan version
          if (data.nextPlanVersionTo === data.planVersionId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "New plan version cannot be the same as the current plan version",
              path: ["nextPlanVersionTo"],
              fatal: true,
            })
          }

          // payment method is validated against the plan version
          // to check if payment method is required for the plan
          const paymentMethodRequired = selectedNewPlanVersion?.metadata?.paymentMethodRequired

          if (paymentMethodRequired && !data.defaultPaymentMethodId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Default payment method is required for this plan",
              path: ["defaultPaymentMethodId"],
              fatal: true,
            })
          }
        })
    }

    return subscriptionInsertSchema.superRefine((data, ctx) => {
      // payment method is validated against the plan version
      // to check if payment method is required for the plan
      const paymentMethodRequired = selectedPlanVersion?.metadata?.paymentMethodRequired

      if (paymentMethodRequired && !data.defaultPaymentMethodId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Default payment method is required for this plan",
          path: ["defaultPaymentMethodId"],
          fatal: true,
        })
      }
    })
  }

  const formSchema = useMemo(
    () => generateFormSchema(),
    [isChangePlanSubscription, selectedPlanVersion?.id, selectedNewPlanVersion?.id]
  )

  const form = useZodForm({
    schema: formSchema,
    defaultValues: defaultValuesData,
  })

  const items = useFieldArray({
    control: form.control,
    name: "config",
  })

  const { data, isLoading } = api.planVersions.listByActiveProject.useQuery({
    enterprisePlan: true,
    published: true,
    // we want to query inactive plans as well because it might be the case that the user is still subscribed to a legacy plan
    active: !isChangePlanSubscription && !readOnly,
  })

  const subscriptionPlanId = form.watch("planVersionId")
  const subscriptionNewPlanId = form.watch("nextPlanVersionTo")

  // customer lists
  const { data: customers, isLoading: isCustomersLoading } =
    api.customers.listByActiveProject.useQuery(
      {
        search: null,
        from: null,
        to: null,
        page: 1,
        page_size: 100,
      },
      {
        enabled: defaultValues.customerId === "",
      }
    )

  // set the proper plan version on loading the form
  useMemo(() => {
    let planVersion = selectedPlanVersion
    let newPlanVersion = selectedNewPlanVersion

    // if the plan version id comes from default values, we need to find it in the data
    if (!planVersion && subscriptionPlanId) {
      planVersion = data?.planVersions.find((version) => version.id === subscriptionPlanId)
      setSelectedPlanVersion(planVersion)
    }

    // if the new plan version id comes from default values, we need to find it in the data
    if (!newPlanVersion && subscriptionNewPlanId) {
      newPlanVersion = data?.planVersions.find((version) => version.id === subscriptionNewPlanId)
      setSelectedNewPlanVersion(newPlanVersion)
    }

    // depending on which type of action we are doing, we need to set the items config
    // for the create subscription action
    if (planVersion && subscriptionPlanId && !isChangePlanSubscription) {
      const { err, val: itemsConfig } = createDefaultSubscriptionConfig({
        planVersion: planVersion,
        items: defaultValues.items,
      })

      if (err) {
        console.error(err)
        return
      }

      items.replace(itemsConfig)
    }

    // for the change plan action
    if (newPlanVersion && subscriptionNewPlanId && isChangePlanSubscription) {
      const { err, val: itemsConfig } = createDefaultSubscriptionConfig({
        planVersion: newPlanVersion,
        items: defaultValues.items,
      })

      if (err) {
        console.error(err)
        return
      }

      items.replace(itemsConfig)
    }
  }, [subscriptionPlanId, subscriptionNewPlanId, isLoading])

  // keep in sync with the customer timezone
  useEffect(() => {
    if (selectedCustomer?.timezone) {
      form.setValue("timezone", selectedCustomer.timezone)
    }
  }, [selectedCustomer?.id])

  const createSubscription = api.subscriptions.create.useMutation({
    onSuccess: ({ subscription }) => {
      form.reset(subscription)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const changeSubscriptionPlan = api.subscriptions.changePlan.useMutation({
    onSuccess: ({ message }) => {
      form.reset()
      toastAction("success", message)
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const onSubmitForm = async (data: z.infer<typeof formSchema>) => {
    if (!defaultValues.id && !isChangePlanSubscription) {
      await createSubscription.mutateAsync(data as InsertSubscription)
    }

    if (defaultValues.id && isChangePlanSubscription && data.endDateAt && data.nextPlanVersionTo) {
      await changeSubscriptionPlan.mutateAsync({
        ...data,
        endDateAt: data.endDateAt,
        nextPlanVersionTo: data.nextPlanVersionTo,
        id: defaultValues.id,
      })
    }

    setDialogOpen?.(false)
  }

  return (
    <Form {...form}>
      <form
        id={"subscription-form"}
        onSubmit={form.handleSubmit(onSubmitForm)}
        className="space-y-6"
      >
        <div className="space-y-8">
          {defaultValues.customerId === "" && (
            <CustomerFormField
              form={form}
              customers={customers?.customers ?? []}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isDisabled={readOnly || isCustomersLoading}
              isLoading={isCustomersLoading}
            />
          )}

          <SelectPlanFormField
            form={form}
            isDisabled={readOnly || isLoading || isChangePlanSubscription}
            isChangePlanSubscription={isChangePlanSubscription}
          />

          {isChangePlanSubscription && (
            <PlanNewVersionFormField
              form={form}
              // here we filter only active plans and status is published
              planVersions={
                data?.planVersions.filter((plan) => plan.active && plan.status === "published") ??
                []
              }
              selectedPlanVersion={selectedNewPlanVersion}
              setSelectedPlanVersion={setSelectedNewPlanVersion}
              isDisabled={readOnly || isLoading}
              isLoading={isLoading}
            />
          )}

          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          Type of subscription
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="w-32 bg-background-bg font-normal text-xs"
                          align="center"
                          side="right"
                        >
                          Whether the subscription is for a plan or an addon.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger disabled={readOnly}>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collectionMethod"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          Collection Method
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="w-32 bg-background-bg font-normal text-xs"
                          align="center"
                          side="right"
                        >
                          First unit for the tier range. For the first tier, this should be 0.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger disabled={readOnly}>
                        <SelectValue placeholder="Select a collection method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLLECTION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <FormField
              control={form.control}
              name="startCycle"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          Start Cycle
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="w-32 bg-background-bg font-normal text-xs"
                          align="center"
                          side="right"
                        >
                          The day the customer will be billed. Which means receiving an invoice.
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger disabled={readOnly}>
                        <SelectValue placeholder="Select a start of billing cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {START_CYCLES.filter(
                        (cycle) =>
                          START_CYCLE_MAP[cycle].billingPeriod ===
                          selectedPlanVersion?.billingPeriod
                      ).map((cycle) => (
                        <SelectItem
                          value={cycle}
                          key={cycle}
                          description={START_CYCLE_MAP[cycle].label}
                        >
                          {cycle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whenToBill"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex justify-between">
                    <FormLabel>
                      <Tooltip>
                        <div className="flex items-center gap-2">
                          When to bill Subscription
                          <span>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 font-light" />
                            </TooltipTrigger>
                          </span>
                        </div>

                        <TooltipContent
                          className="w-32 bg-background-bg font-normal text-xs"
                          align="center"
                          side="right"
                        >
                          <ul className="list-inside list-disc">
                            <li>At the start of the billing period</li>
                            <li>At the end of the billing period</li>
                          </ul>
                          <TooltipArrow className="fill-background-bg" />
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger disabled={readOnly}>
                        <SelectValue placeholder="Select when to bill" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WHEN_TO_BILLING.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isChangePlanSubscription && (
            <Fragment>
              <Separator />

              <TimeZoneFormField form={form} isDisabled={readOnly} />
            </Fragment>
          )}

          {!isChangePlanSubscription && (
            <Fragment>
              <Separator />
              <DurationFormField form={form} isDisabled={readOnly} />
              <FormField
                control={form.control}
                name="trialDays"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Trial Days</FormLabel>
                    <div className="flex w-full flex-col lg:w-1/2">
                      <FormControl className="w-full">
                        <InputWithAddons
                          {...field}
                          trailing={"days"}
                          value={field.value ?? ""}
                          disabled={readOnly}
                        />
                      </FormControl>

                      <FormMessage className="self-start pt-1" />
                    </div>
                  </FormItem>
                )}
              />
            </Fragment>
          )}

          {isChangePlanSubscription && (
            <Fragment>
              <Separator />
              <EndDateFormField form={form} isDisabled={readOnly} />
            </Fragment>
          )}

          <Separator />
          <PaymentMethodsFormField
            form={form}
            isChangePlanSubscription={isChangePlanSubscription}
            isDisabled={readOnly}
          />

          <ConfigItemsFormField
            form={form}
            isDisabled={readOnly}
            isChangePlanSubscription={isChangePlanSubscription}
            withSeparator
          />
        </div>

        {isChangePlanSubscription && (
          <div className="mt-8 flex justify-end space-x-4">
            <ConfirmAction
              message="When you change the plan, the current subscription will be cancelled and a new one will be created. Are you sure you want to change the plan?"
              confirmAction={() => {
                form.handleSubmit(onSubmitForm)()
              }}
            >
              <SubmitButton
                form="subscription-form"
                isSubmitting={form.formState.isSubmitting}
                isDisabled={form.formState.isSubmitting || isLoading}
                label={"Change Plan Subscription"}
              />
            </ConfirmAction>
          </div>
        )}

        {!readOnly && !isChangePlanSubscription && (
          <div className="mt-8 flex justify-end space-x-4">
            <SubmitButton
              form="subscription-form"
              onClick={() => form.handleSubmit(onSubmitForm)()}
              isSubmitting={form.formState.isSubmitting}
              isDisabled={form.formState.isSubmitting || isLoading}
              label={"Create Subscription"}
            />
          </div>
        )}
      </form>
    </Form>
  )
}
