import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

const WelcomeEmail = ({
  firstName,
}: {
  firstName: string
}) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Welcome to Unprice - Create your first adaptive pricing plan</Preview>
        <Body className="bg-[#191918] font-sans py-[40px]">
          <Container className="bg-[#111110] rounded-[8px] px-[32px] py-[40px] max-w-[600px] mx-auto">
            {/* Logo */}
            <Section className="text-center mb-[32px]">
              <Img
                src="https://di867tnz6fwga.cloudfront.net/brand-kits/4eeedaec-95df-435b-a811-9054368784f0/primary/1f533c45-269c-4546-b4d3-ef7ae78c420a.png"
                alt="Unprice"
                className="w-full h-auto max-w-[200px] mx-auto"
              />
            </Section>

            {/* Main Content */}
            <Section>
              <Heading className="text-[#ffffff] text-[28px] font-bold mb-[24px] text-center">
                Welcome to Unprice, {firstName}!
              </Heading>

              <Text className="text-[#ffffff] text-[16px] leading-[24px] mb-[24px]">
                You've just broken free from the invisible chains of static pricing. No more rigid
                tiers that stifle growth or endless engineering overhauls.
              </Text>

              <Text className="text-[#ffffff] text-[16px] leading-[24px] mb-[32px]">
                With Unprice, you can launch adaptive models like usage-based billing with our
                simple TypeScript SDK—no rewrites required. Your pricing will scale seamlessly with
                your product, unlocking millions in potential.
              </Text>

              <Text className="text-[#ffffff] text-[16px] leading-[24px] mb-[24px] font-semibold">
                Ready to evolve from frustrated builder to revenue leader?
              </Text>

              {/* CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href="https://unprice.dev/dashboard/plans/new"
                  className="bg-[#ffc53d] text-[#111110] px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border"
                >
                  Create Your First Plan
                </Button>
              </Section>

              <Text className="text-[#ffffff] text-[14px] leading-[20px] text-center">
                Questions? Simply reply to this email—we're here to help you succeed.
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="border-[#333333] my-[32px]" />

            <Section>
              <Row>
                <Column className="text-center">
                  <Link href="https://github.com/jhonsfran1165/unprice" className="inline-block">
                    <Img
                      src="https://new.email/static/emails/social/social-github.png"
                      alt="GitHub"
                      className="w-[24px] h-[24px]"
                    />
                  </Link>
                </Column>
              </Row>

              <Text className="text-[#ffffff] text-[12px] leading-[16px] text-center mt-[16px] mb-[8px]">
                <Link href="https://unprice.dev" className="text-[#ffc53d] no-underline">
                  unprice.dev
                </Link>
              </Text>

              <Text className="text-[#ffffff] text-[12px] leading-[16px] text-center mb-[8px] m-0">
                Berlin, Germany
              </Text>

              <Text className="text-[#ffffff] text-[12px] leading-[16px] text-center mb-[8px]">
                <Link
                  href="https://unprice.dev/unsubscribe"
                  className="text-[#ffc53d] no-underline"
                >
                  Unsubscribe
                </Link>
              </Text>

              <Text className="text-[#ffffff] text-[12px] leading-[16px] text-center m-0">
                © 2025 Unprice, Inc.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: "John",
  setupUrl: "https://yourplatform.com/setup",
}

export default WelcomeEmail
