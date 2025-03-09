import { Logos } from "./brands"

export default function LogoCloud() {
  return (
    <section
      id="logo cloud"
      aria-label="Company logos"
      className="mt-24 flex animate-slide-up-fade flex-col items-center justify-center gap-y-6 text-center sm:mt-32"
      style={{ animationDuration: "1500ms" }}
    >
      <p className="font-semibold text-xl tracking-tighter">
        Made with ❤️ using the best tools for the job
      </p>
      <br />
      <div className="grid grid-cols-2 gap-10 gap-y-6 md:grid-cols-4 md:gap-x-20">
        {Object.entries(Logos).map(([key, Logo]) => (
          <Logo key={key} className="size-10" />
        ))}
      </div>
    </section>
  )
}
