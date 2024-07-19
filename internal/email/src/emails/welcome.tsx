import { Body, Head, Html, Link, Preview } from "@react-email/components"

const WelcomeEmail = () => {
  return (
    <Html>
      <Head>
        <title>Welcome to unprice 👋</title>
        <Preview>Welcome to unprice 👋</Preview>
        <Body>
          Hey!
          <br />
          <br />
          Welcome to unprice! We're excited to have you on board.
          <br /> I hope you will enjoy using our product as much as we enjoyed building it.
          <br />
          <br />
          What kind of apps are going to monitor?
          <br />
          How do you handle your incidents?
          <br />
          <br />
          Thank you,
          <br />
          <br />
          Sebastian,
          <br />
          <br />⭐ Star us on <Link href="https://github.com/jhonsfran1165/unprice">GitHub</Link>
          <br />🚀 Login here{" "}
          <Link href="https://unprice-git-main-jhonsfran.vercel.app/">unprice</Link>
        </Body>
      </Head>
    </Html>
  )
}

export default WelcomeEmail
