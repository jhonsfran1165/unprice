export const runtime = "edge"

export default function Page(props: { params: { siteId: string } }) {
  return (
    <h1 className="font-satoshi mt-5 text-5xl font-extrabold leading-[1.15] text-black sm:text-6xl sm:leading-[1.15]">
      This is the Site <span className="italic">{props.params.siteId}</span>
    </h1>
  )
}
