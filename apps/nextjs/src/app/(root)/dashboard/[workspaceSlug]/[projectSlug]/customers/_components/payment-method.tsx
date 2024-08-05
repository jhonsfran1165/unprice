import { cn } from "@unprice/ui/utils"

interface UserPaymentMethod {
  paymentMethod?: {
    name: string | null
    last4?: string
    expMonth?: number
    expYear?: number
  }
  isLoading?: boolean
}

export function UserPaymentMethod(data: UserPaymentMethod) {
  if (data?.paymentMethod) {
    return <CreditCard paymentMethod={data.paymentMethod} />
  }

  return <MissingPaymentMethod isLoading={data.isLoading} />
}

const CreditCard: React.FC<UserPaymentMethod> = ({ paymentMethod }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="aspect-[86/54] w-full max-w-[350px] rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px]">
      <div className="relative m-auto aspect-[86/54] space-y-4 rounded-xl bg-gradient-to-r from-background-bgSubtle to-background-line p-8 text-background-text shadow-lg transition-transform sm:hover:scale-110 sm:hover:border">
        <div>
          <div className="font-light text-xs">Name</div>
          <div className="font-medium text-base tracking-wide">
            {paymentMethod?.name ?? "Anonymous"}
          </div>
        </div>
        <div>
          <div className="font-light text-xs">Card Number</div>
          <div className="line-clamp-1 font-medium text-base tracking-widest">
            •••• •••• •••• {paymentMethod?.last4}
          </div>
        </div>
        <div>
          <div className="font-light text-xs">Expiry</div>
          <div className="font-medium text-base tracking-wide">
            {paymentMethod?.expMonth?.toLocaleString("en-US", {
              minimumIntegerDigits: 2,
            })}
            /{paymentMethod?.expYear}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const MissingPaymentMethod: React.FC<{
  isLoading?: boolean
}> = ({ isLoading }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="aspect-[86/54] w-full max-w-[350px] rounded-xl">
      <div className="relative m-auto aspect-[86/54] space-y-4 rounded-xl border bg-gradient-to-r from-background-bgSubtle to-background-line p-8 text-background-text shadow-lg transition-transform">
        <div>
          <div className="font-light text-xs">Name</div>
          <div
            className={cn("font-medium text-base tracking-wide", {
              "animate-pulse bg-accent": isLoading,
              "blur-sm": !isLoading,
            })}
          >
            {"Anonymous"}
          </div>
        </div>
        <div>
          <div className="font-light text-xs">Card Number</div>
          <div
            className={cn("line-clamp-1 font-medium text-base tracking-widest", {
              "animate-pulse bg-accent": isLoading,
              "blur-sm": !isLoading,
            })}
          >
            •••• •••• •••• ••••
          </div>
        </div>
        <div>
          <div className="font-medium text-base tracking-wide">
            {isLoading ? "Loading..." : "No payment method configured"}
          </div>
        </div>
      </div>
    </div>
  </div>
)
