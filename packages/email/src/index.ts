import { Alert, EmailDataSchema } from "./emails/alert"
import SubscribeEmail from "./emails/subscribe"
import WaitingList from "./emails/waiting-list"
import WelcomeEmail from "./emails/welcome"

export { Alert, EmailDataSchema, SubscribeEmail, WaitingList, WelcomeEmail }

export { sendEmail, sendEmailHtml } from "./emails/send"
