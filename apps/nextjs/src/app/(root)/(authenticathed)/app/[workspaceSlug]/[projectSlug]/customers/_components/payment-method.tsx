import type Stripe from "stripe"

import { StripeLinkLogo } from "@builderai/ui/icons"

interface UserPaymentMethod {
  paymentMethod: Stripe.PaymentMethod
}

export function UserPaymentMethod({
  paymentMethod,
}: Partial<UserPaymentMethod>) {
  if (!paymentMethod) {
    return <MissingPaymentMethod />
  }

  if (paymentMethod.card) {
    return <CreditCard paymentMethod={paymentMethod} />
  }

  if (paymentMethod.link) {
    return <StripeLink paymentMethod={paymentMethod} />
  }

  return <FallbackPaymentMethod paymentMethod={paymentMethod} />
}

{
  /* <div className="aspect-[86/54] max-w-[320px] justify-between rounded-lg border border-gray-200 bg-gradient-to-tr from-gray-200/70 to-gray-100 p-8 shadow-lg dark:border dark:border-gray-800  dark:from-black dark:to-gray-900 ">
    <div className="text-content mt-16 whitespace-nowrap font-mono">
      •••• •••• •••• {paymentMethod.card?.last4}
    </div>
    <div className="text-content-subtle mt-2 font-mono text-sm">
      {paymentMethod.billing_details.name ?? "Anonymous"}
    </div>
    <div className="text-content-subtle mt-1 font-mono text-xs">
      Expires{" "}
      {paymentMethod.card?.exp_month.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
      })}
      /{paymentMethod.card?.exp_year}
    </div>
  </div> */
}

const CreditCard: React.FC<UserPaymentMethod> = ({ paymentMethod }) => (
  <div className="my-10 space-y-16">
    <div className="relative m-auto h-48 w-80 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-2xl transition-transform sm:h-56 sm:w-96 sm:hover:scale-110">
      <div className="absolute top-4 w-full px-8 sm:top-8">
        <div className="flex justify-between">
          <div className="">
            <p className="text-normal font-light">Name</p>
            <p className="font-medium tracking-widest">Carter Mullen</p>
          </div>
        </div>
        <div className="pt-1">
          <p className="text-normal font-light">Card Number</p>
          <p className="tracking-more-wider font-medium">4312 567 7890 7864</p>
        </div>
        <div className="pr-6 pt-4 sm:pt-6">
          <div className="flex justify-between">
            <div className="">
              <p className="text-xs font-light">Valid From</p>
              <p className="text-base font-medium tracking-widest">11/15</p>
            </div>
            <div className="">
              <p className="text-xs font-light">Expiry</p>
              <p className="text-base font-medium tracking-widest">03/25</p>
            </div>

            <div className="">
              <p className="text-xs font-light">CVV</p>
              <p className="tracking-more-wider text-sm font-bold">521</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const StripeLink: React.FC<UserPaymentMethod> = ({ paymentMethod }) => (
  <div className="max-w-[320px] justify-between rounded-lg border border-gray-200 bg-gradient-to-tr from-gray-200/70 to-gray-100 p-8 shadow-lg dark:border dark:border-gray-800  dark:from-black dark:to-gray-900 ">
    <StripeLinkLogo className="rounded" />
    <div className="text-content mt-6 whitespace-nowrap font-mono">
      {paymentMethod.link?.email ?? "ja@example.com"}
    </div>
    <div className="text-content-subtle mt-1 font-mono text-sm">
      {paymentMethod.billing_details.name ?? "Anonymous"}
    </div>
  </div>
)

const FallbackPaymentMethod: React.FC<UserPaymentMethod> = ({
  paymentMethod,
}) => (
  <div className="max-w-[320px] justify-between rounded-lg border border-gray-200 bg-gradient-to-tr from-gray-200/70 to-gray-100 p-8 shadow-lg dark:border dark:border-gray-800  dark:from-black dark:to-gray-900 ">
    <div className="text-content font-mono text-sm">
      {paymentMethod.billing_details.name ?? "Anonymous"}
    </div>
    <div className="text-x text-content-subtle z-50 mt-2 font-mono ">
      Saved payment method
    </div>
  </div>
)

const MissingPaymentMethod: React.FC = () => (
  <div className="relative aspect-[86/54] max-w-[320px] justify-between rounded-lg border border-gray-200 bg-gradient-to-tr from-gray-200/70 to-gray-100 p-8 shadow-lg dark:border dark:border-gray-800  dark:from-black dark:to-gray-900">
    <div className="text-content z-50 mt-16 whitespace-nowrap font-mono blur-sm">
      •••• •••• •••• ••••
    </div>
    <div className="text-content-subtle z-50 mt-2 font-mono text-sm ">
      No credit card on file
    </div>
    <div className="text-content-subtle mt-1 font-mono text-xs blur-sm">
      Expires{" "}
      {(new Date().getUTCMonth() - 1).toLocaleString("en-US", {
        minimumIntegerDigits: 2,
      })}
      /{new Date().getUTCFullYear()}
    </div>
  </div>
)
