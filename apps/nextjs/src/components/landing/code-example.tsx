import { StepBack } from "lucide-react"
import Code from "./code"
import CodeExampleTabs from "./code-example-tabs"

const code = `import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

// verify if the customer has access to the feature
const { result } = await unprice.customers.can({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  featureSlug: "feature-slug",
})

if (!result.access) {
  return {
    error: result.deniedReason,
    message: result.message,
  }
}
`

const code2 = `async function fetchCustomerOrders() {
    const result = await prisma.orders.findMany({
        where: {
            customer: {
                name: 'Jack Beanstalk'
            },
            segmentation: {
                type: 'young professional',
                joinedYear: 2024,
                region: 'us-west-01',
            }
        },
        include: {
            customer: true,
            order_items: {
                include: {
                    item: true
                }
            }
        }
    });
    return result;
}`

const features = [
  {
    name: "Use Database with your stack",
    description: "We offer client and server libraries in everything from React and Ruby to iOS.",
    icon: StepBack,
  },
  {
    name: "Try plug & play options",
    description: "Customize and deploy data infrastructure directly from the Database Dashboard.",
    icon: StepBack,
  },
  {
    name: "Explore pre-built integrations",
    description:
      "Connect Database to over a hundred tools including Stripe, Salesforce, or Quickbooks.",
    icon: StepBack,
  },
  {
    name: "Security & privacy",
    description:
      "Database supports PII data encrypted with AES-256 at rest or explicit user consent flows.",
    icon: StepBack,
  },
]

export default function CodeExample() {
  return (
    <section aria-labelledby="code-example-title" className="mx-auto mt-28 w-full max-w-6xl px-3">
      <h2
        id="features-title"
        className="mt-2 inline-block bg-gradient-to-br from-gray-900 to-gray-800 bg-clip-text py-2 font-bold text-4xl text-transparent tracking-tighter sm:text-6xl md:text-6xl dark:from-gray-50 dark:to-gray-300"
      >
        Built by developers, <br /> for developers
      </h2>
      <p className="mt-6 max-w-2xl text-lg">
        Rich and expressive query language that allows you to filter and sort by any field, no
        matter how nested it may be.
      </p>
      <CodeExampleTabs
        tab1={<Code code={code} lang="typescript" copy={true} className="h-[31rem]" />}
        tab2={<Code code={code2} lang="javascript" copy={true} className="h-[31rem]" />}
      />
      <dl className="mt-24 grid grid-cols-4 gap-10">
        {features.map((item) => (
          <div key={item.name} className="col-span-full sm:col-span-2 lg:col-span-1">
            <div className="w-fit rounded-lg p-2 shadow-indigo-400/30 shadow-md ring-1 ring-black/5 dark:shadow-indigo-600/30 dark:ring-white/5">
              <item.icon
                aria-hidden="true"
                className="size-6 text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <dt className="mt-6 font-semibold text-gray-900 dark:text-gray-50">{item.name}</dt>
            <dd className="mt-2 text-gray-600 leading-7 dark:text-gray-400">{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
