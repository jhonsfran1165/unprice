import React from "react"
import dynamic from "next/dynamic"

import { Skeleton } from "@builderai/ui/skeleton"

import MaxWidthWrapper from "~/components/max-width-wrapper"

const SidebarNav = dynamic(() => import("~/components/sidebar"), {
  ssr: false,
  loading: () => (
    <div className="flex-col sm:flex sm:w-[250px]">
      <div className="grid items-start gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={"group flex items-center rounded-md px-3 py-2"}
          >
            <Skeleton className="mr-2 h-4 w-4 rounded-xl" />

            <span className={"text-background-textContrast"}>
              <Skeleton className="h-[20px] w-[50px]" />
            </span>
          </span>
        ))}
      </div>
    </div>
  ),
})

const Breadcrumbs = dynamic(() => import("~/components/breadcrumbs"), {
  ssr: false,
  loading: () => (
    <Skeleton className="mb-4 h-10 w-full rounded-md bg-muted p-1" />
  ),
})

const HeaderContext = dynamic(() => import("~/components/header-context"), {
  ssr: false,
  loading: () => (
    <div className="z-30 flex h-36 items-center border-b bg-background text-background-textContrast">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <Skeleton className="h-[40px] w-[200px]" />
      </MaxWidthWrapper>
    </div>
  ),
})

// TODO: add dashboard skeleton and try to pass parameters here to avoid import dynamic
export function DashboardShell(props: {
  title: string
  description: React.ReactNode
  breadcrumb?: boolean
  headerAction?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerTitle?: string
  sideBarNav?: boolean
}) {
  return (
    <>
      {props.headerTitle && <HeaderContext title={props.headerTitle} />}

      <MaxWidthWrapper className="my-10 max-w-screen-2xl">
        <div className="flex flex-col gap-12 sm:flex-1 sm:flex-row">
          {props.sideBarNav && <SidebarNav />}
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="font-cal text-xl font-semibold leading-none">
                  {props.title}
                </h1>
                {typeof props.description === "string" ? (
                  <h2 className="text-base text-muted-foreground">
                    {props.description}
                  </h2>
                ) : (
                  props.description
                )}
              </div>
              {props.headerAction}
            </div>
            {props.breadcrumb && <Breadcrumbs />}
            <div className={props.className}>{props.children}</div>
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  )
}
