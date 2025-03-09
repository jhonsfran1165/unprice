import React from "react"

const stats = [
  {
    name: "Bandwith increase",
    value: "+162%",
  },
  {
    name: "Better storage efficiency",
    value: "2-3x",
  },
  {
    name: "Rows ingested / second",
    value: "Up to 9M",
  },
]

export default function Features() {
  return (
    <section aria-labelledby="features-title" className="mx-auto mt-44 w-full max-w-6xl px-3">
      <h2
        id="features-title"
        className="mt-2 inline-block bg-gradient-to-br from-gray-900 to-gray-800 bg-clip-text py-2 font-bold text-4xl text-transparent tracking-tighter sm:text-6xl md:text-6xl dark:from-gray-50 dark:to-gray-300"
      >
        Architected for speed and reliability
      </h2>
      <p className="mt-6 max-w-3xl text-gray-600 text-lg leading-7 dark:text-gray-400">
        Database&rsquo; innovative architecture avoids the central bottlenecks of traditional
        systems, enhancing system reliability. This design ensures high productivity and security,
        minimizing the risk of service disruptions and outages.
      </p>
      <dl className="mt-12 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:border-gray-200 md:border-y md:py-14 dark:border-gray-800">
        {stats.map((stat, index) => (
          <React.Fragment key={index.toString()}>
            <div className="border-indigo-100 border-l-2 pl-6 md:border-l md:text-center lg:border-gray-200 lg:first:border-none dark:border-indigo-900 lg:dark:border-gray-800">
              <dd className="inline-block bg-gradient-to-t from-indigo-900 to-indigo-600 bg-clip-text font-bold text-5xl text-transparent tracking-tight lg:text-6xl dark:from-indigo-700 dark:to-indigo-400">
                {stat.value}
              </dd>
              <dt className="mt-1 text-gray-600 dark:text-gray-400">{stat.name}</dt>
            </div>
          </React.Fragment>
        ))}
      </dl>
    </section>
  )
}
