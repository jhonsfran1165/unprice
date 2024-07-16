// "use client"

// import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

// // TODO: use another chart library
// // TODO: delete later https://github.com/recharts/recharts/issues/3615#issuecomment-1636923358
// const error = console.error
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// console.error = (...args: any) => {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
//   if (/defaultProps/.test(args[0])) return
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//   error(...args)
// }

// const data = [
//   {
//     name: "Jan",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Feb",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Mar",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Apr",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "May",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Jun",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Jul",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Aug",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Sep",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Oct",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Nov",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
//   {
//     name: "Dec",
//     total: Math.floor(Math.random() * 5000) + 1000,
//   },
// ]

// export function Overview() {
//   return (
//     <ResponsiveContainer width="100%" height={400}>
//       <BarChart data={data}>
//         <XAxis
//           dataKey="name"
//           stroke="#888888"
//           fontSize={12}
//           tickLine={false}
//           axisLine={false}
//         />
//         <YAxis
//           stroke="#888888"
//           fontSize={12}
//           tickLine={false}
//           axisLine={false}
//           tickFormatter={(value) => `$${value}`}
//         />
//         <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
//       </BarChart>
//     </ResponsiveContainer>
//   )
// }
