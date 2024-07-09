interface UserPaymentMethod {
  paymentMethod?: {
    name: string | null
    last4?: string
    expMonth?: number
    expYear?: number
  }
}

export function UserPaymentMethod(data: UserPaymentMethod) {
  if (data?.paymentMethod) {
    return <CreditCard paymentMethod={data.paymentMethod} />
  }

  return <MissingPaymentMethod />
}

const CreditCard: React.FC<UserPaymentMethod> = ({ paymentMethod }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="aspect-[86/54] w-full max-w-[350px] rounded-xl bg-gradient-to-r from-secondary to-primary p-[1px]">
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

const MissingPaymentMethod: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="aspect-[86/54] w-full max-w-[350px] rounded-xl">
      <div className="relative m-auto aspect-[86/54] space-y-4 rounded-xl border bg-gradient-to-r from-background-bgSubtle to-background-line p-8 text-background-text shadow-lg transition-transform">
        <div>
          <div className="font-light text-xs">Name</div>
          <div className="font-medium text-base tracking-wide blur-sm">{"Anonymous"}</div>
        </div>
        <div>
          <div className="font-light text-xs">Card Number</div>
          <div className="line-clamp-1 font-medium text-base tracking-widest blur-sm">
            •••• •••• •••• ••••
          </div>
        </div>
        <div>
          <div className="font-medium text-base tracking-wide">No payment method configured</div>
        </div>
      </div>
    </div>
  </div>
)
