"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { analytics } from "@unprice/analytics/client"
import { Badge } from "@unprice/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@unprice/ui/drawer"
import { Input } from "@unprice/ui/input"
import { Label } from "@unprice/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"

import { Button } from "@unprice/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { Separator } from "@unprice/ui/separator"
import { cn } from "@unprice/ui/utils"
import { ArrowUp, BarChart3, Eye, MousePointerClick, UserCheck2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { useMediaQuery } from "~/hooks/use-media-query"
import { formatDate } from "~/lib/dates"

type PlanConversion = Awaited<ReturnType<typeof analytics.getPlansConversion>>["data"][number]

export const columns: ColumnDef<PlanConversion>[] = [
  {
    id: "select",
    size: 5,
    header: () => <div className="w-4" />,
    cell: () => <div className="w-4" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{formatDate(row.original.date.getTime())}</div>
    ),
    enableResizing: true,
    size: 20,
  },
  {
    accessorKey: "page_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Page" />,
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "plan_version_id",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Version" />,
    cell: ({ row }) => <TableCellViewer item={row.original} isPlanVersion />,
    filterFn: (row, _id, value) => {
      if (value === undefined) return true
      // filter by page id and plan version id
      return (
        row.original.page_id.toLowerCase().includes(value.toLowerCase()) ||
        row.original.plan_version_id.toLowerCase().includes(value.toLowerCase())
      )
    },
    size: 20,
  },
  {
    accessorKey: "plan_views",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-sm">
        <Eye className="h-4 w-4 text-info" />
        {row.original.plan_views}
      </div>
    ),
    size: 20,
  },
  {
    accessorKey: "plan_clicks",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clicks" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-sm">
        <MousePointerClick className="h-4 w-4 text-info" />
        {row.original.plan_clicks}
      </div>
    ),
    size: 20,
  },
  {
    accessorKey: "plan_signups",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Signups" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-sm">
        <UserCheck2 className="h-4 w-4 text-info" />
        {row.original.plan_signups}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 20,
  },
  {
    accessorKey: "conversion",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Conversion" />,
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.conversion > 5 ? "success" : row.original.conversion > 1 ? "info" : "outline"
        }
        className={cn("flex w-fit items-center gap-2 px-1.5 text-muted-foreground", {
          "text-info": row.original.conversion > 1 && row.original.conversion < 5,
          "text-success": row.original.conversion > 5,
        })}
      >
        <BarChart3 className={"h-4 w-4"} />
        <div className="whitespace-nowrap text-sm">{row.original.conversion.toFixed(1)}%</div>
      </Badge>
    ),
    size: 20,
  },
]

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({
  item,
  isPlanVersion,
}: { item: PlanConversion; isPlanVersion?: boolean }) {
  const { isMobile } = useMediaQuery()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {isPlanVersion ? item.plan_version_id : item.page_id}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-screen w-full md:w-[500px]">
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.plan_version_id}</DrawerTitle>
          <DrawerDescription>Showing total visitors for the last 6 months</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 font-medium leading-none">
                  Trending up by 5.2% this month <ArrowUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just some random text to
                  test the layout. It spans multiple lines and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.plan_version_id} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.plan_version_id}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">Table of Contents</SelectItem>
                    <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                    <SelectItem value="Technical Approach">Technical Approach</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">Focus Documents</SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.plan_version_id}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input id="target" defaultValue={item.plan_version_id} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.plan_version_id} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={item.plan_version_id}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
