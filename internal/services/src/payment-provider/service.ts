import { type Dinero, toStripeMoney } from "@unprice/db/utils"
import type { Currency, Customer, PaymentProvider } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type Stripe from "stripe"
import type { UnPricePaymentProviderError } from "./errors"
import type {
  AddInvoiceItemOpts,
  CreateInvoiceOpts,
  CreateSessionOpts,
  GetStatusInvoice,
  InvoiceProviderStatus,
  PaymentMethod,
  PaymentProviderCreateSession,
  PaymentProviderInterface,
  PaymentProviderInvoice,
  SignUpOpts,
  UpdateInvoiceItemOpts,
  UpdateInvoiceOpts,
} from "./interface"
import { StripePaymentProvider } from "./stripe"

export class PaymentProviderService implements PaymentProviderInterface {
  private readonly logger: Logger
  private readonly paymentProviderId: PaymentProvider
  private readonly stripe: StripePaymentProvider

  constructor(opts: {
    token?: string
    customer?: Customer
    logger: Logger
    paymentProviderId: PaymentProvider
  }) {
    this.logger = opts.logger
    this.paymentProviderId = opts.paymentProviderId

    switch (this.paymentProviderId) {
      case "stripe": {
        const providerCustomerId = opts.customer?.stripeCustomerId

        this.stripe = new StripePaymentProvider({
          token: opts.token,
          providerCustomerId: providerCustomerId,
          logger: this.logger,
        })
        break
      }
      default:
        throw new Error("Payment provider not supported")
    }
  }

  public async createSession(
    opts: CreateSessionOpts
  ): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        const result = await this.stripe.createSession(opts)
        return result
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async signUp(opts: SignUpOpts): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.signUp(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public formatAmount(
    price: Dinero<number>
  ): Result<{ amount: number; currency: Currency }, FetchError> {
    switch (this.paymentProviderId) {
      case "stripe": {
        const result = toStripeMoney(price)
        return Ok(result)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async upsertProduct(
    props: Stripe.ProductCreateParams & { id: string }
  ): Promise<Result<{ productId: string }, FetchError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.upsertProduct(props)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async listPaymentMethods(opts: { limit?: number }): Promise<
    Result<PaymentMethod[], FetchError | UnPricePaymentProviderError>
  > {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.listPaymentMethods(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async createInvoice(
    opts: CreateInvoiceOpts
  ): Promise<Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.createInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async updateInvoice(
    opts: UpdateInvoiceOpts
  ): Promise<Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.updateInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async addInvoiceItem(
    opts: AddInvoiceItemOpts
  ): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.addInvoiceItem(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async updateInvoiceItem(
    opts: UpdateInvoiceItemOpts
  ): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.updateInvoiceItem(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async getDefaultPaymentMethodId(): Promise<
    Result<{ paymentMethodId: string }, FetchError | UnPricePaymentProviderError>
  > {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.getDefaultPaymentMethodId()
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async finalizeInvoice(opts: {
    invoiceId: string
  }): Promise<Result<{ invoiceId: string }, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.finalizeInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async sendInvoice(opts: {
    invoiceId: string
  }): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.sendInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async collectPayment(opts: {
    invoiceId: string
    paymentMethodId: string
  }): Promise<
    Result<
      { invoiceId: string; status: InvoiceProviderStatus },
      FetchError | UnPricePaymentProviderError
    >
  > {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.collectPayment(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async getStatusInvoice(opts: {
    invoiceId: string
  }): Promise<Result<GetStatusInvoice, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.getStatusInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }

  public async getInvoice(opts: {
    invoiceId: string
  }): Promise<Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>> {
    switch (this.paymentProviderId) {
      case "stripe": {
        return await this.stripe.getInvoice(opts)
      }
      default: {
        return Err(new FetchError({ message: "Payment provider not supported", retry: false }))
      }
    }
  }
}
