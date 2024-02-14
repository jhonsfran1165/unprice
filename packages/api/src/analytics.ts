// import { analytics, trackAnalytics } from "@builderai/analytics";
// import { User } from "@builderai/db/src/schema";

// export async function trackNewPage(user: User, config: { slug: string }) {
//   await analytics.identify(user.id, {
//     userId: user.id,
//     email: user.email,
//   });
//   await trackAnalytics({
//     event: "Page Created",
//     ...config,
//   });
// }

// export async function trackNewMonitor(
//   user: User,
//   config: { url: string; periodicity: string },
// ) {
//   await analytics.identify(user.id, {
//     userId: user.id,
//     email: user.email,
//   });
//   await trackAnalytics({
//     event: "Monitor Created",
//     ...config,
//   });
// }

// export async function trackNewUser() {}

// export async function trackNewWorkspace() {}

// export async function trackNewNotification(
//   user: User,
//   config: { provider: string },
// ) {
//   await analytics.identify(user.id, {
//     userId: user.id,
//     email: user.email,
//   });
//   await trackAnalytics({
//     event: "Notification Created",
//     ...config,
//   });
// }

// export async function trackNewStatusReport() {}

// export async function trackNewInvitation() {}
