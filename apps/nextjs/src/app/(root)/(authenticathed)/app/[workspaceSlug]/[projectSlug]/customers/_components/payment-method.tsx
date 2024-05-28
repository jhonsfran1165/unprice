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
  <div className="my-4 space-y-16">
    <div className="relative m-auto aspect-[86/54] max-w-[350px] rounded-xl border bg-gradient-to-r from-background-bgSubtle to-background-line text-white shadow-lg transition-transform sm:hover:scale-110">
      <div className="absolute top-8 w-full px-8">
        <div className="flex justify-between">
          <div className="">
            <p className="text-normal font-light">Name</p>
            <p className="text-base font-medium tracking-wide">
              {paymentMethod?.name ?? "Anonymous"}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <p className="text-normal font-light">Card Number</p>
          <p className="text-base font-medium tracking-widest">
            •••• •••• •••• {paymentMethod?.last4}
          </p>
        </div>
        <div className="pr-6 pt-6">
          <div className="flex justify-between">
            <div className="">
              <p className="text-xs font-light">Expiry</p>
              <p className="text-base font-medium tracking-widest">
                {paymentMethod?.expMonth?.toLocaleString("en-US", {
                  minimumIntegerDigits: 2,
                })}
                /{paymentMethod?.expYear}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const MissingPaymentMethod: React.FC = () => (
  <div className="my-4 space-y-16">
    <div className="relative m-auto aspect-[86/54] max-w-[350px] rounded-xl border bg-gradient-to-r from-background-bgSubtle to-background-line text-white shadow-lg transition-transform sm:hover:scale-110">
      <div className="absolute top-8 w-full px-8">
        <div className="flex justify-between">
          <div className="">
            <p className="text-normal font-light">Name</p>
            <p className="text-base font-medium tracking-wide blur-sm">
              {"Anonymous"}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <p className="text-normal font-light">Card Number</p>
          <p className="text-base font-medium tracking-widest blur-sm">
            •••• •••• •••• ••••
          </p>
        </div>
        <div className="pr-6 pt-6">
          <div className="flex justify-between">
            <div className="">
              <p className="text-base font-medium tracking-wide">
                No payment method configured
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
