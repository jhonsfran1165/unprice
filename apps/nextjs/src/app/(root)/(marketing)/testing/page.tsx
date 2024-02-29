import { Client } from "./_components/client"

export default function Page() {
  return (
    <>
      <h1 className="font-satoshi mt-5 text-5xl font-extrabold leading-[1.15] sm:text-6xl sm:leading-[1.15]">
        This is s Page from client
      </h1>
      <div className="italic">Papi voy solo</div>

      <Client />
    </>
  )
}
