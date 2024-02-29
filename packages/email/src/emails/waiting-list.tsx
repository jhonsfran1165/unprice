import { Body, Head, Html, Link, Preview } from "@react-email/components"

const WaitingList = () => {
  return (
    <Html>
      <Head>
        <title>Thanks for joining builderai waiting list</title>
        <Preview>Thanks for joining builderai waiting list</Preview>
        <Body>
          Hello,
          <br />
          <br />
          We're working hard to get you access to builderai. You can track our
          progress on our{" "}
          <Link href="https://github.com/builderaihq/builderai">
            Github repository
          </Link>
          .
          <br />
          <br />
          If you have any questions, I'm more than happy to answer them.
          <br />
          <br />
          Thank you,
          <br />
          Sebastian
        </Body>
      </Head>
    </Html>
  )
}

export default WaitingList
