"use client"

import { useMemo, useState } from "react"
import type { ColumnFiltersState, VisibilityState } from "@tanstack/react-table"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { TRPCClientError } from "@trpc/client"
import { format, formatRelative } from "date-fns"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Checkbox } from "@builderai/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import * as Icons from "@builderai/ui/icons"
import { Eye, EyeOff } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { Skeleton } from "@builderai/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"
import { useToast } from "@builderai/ui/use-toast"

import { apiRQ } from "~/trpc/client"

export type ApiKeyColumn = RouterOutputs["apikey"]["listApiKeys"][number]

const columnHelper = createColumnHelper<ApiKeyColumn>()

const columns = (projectSlug: string) => [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        disabled={
          table.getRowModel().rows.length === 0 ||
          table
            .getRowModel()
            .rows.every((row) => row.original.revokedAt !== null)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={row.original.revokedAt !== null}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("name", {
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
    header: "Name",
  }),
  columnHelper.accessor("key", {
    cell: function Key(t) {
      const [show, setShow] = useState(false)
      const [copied, setCopied] = useState(false)

      const key = t.getValue()

      const displayText = show ? key : "sk_live_****************"
      return (
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-mono",
              t.row.original.revokedAt !== null && "line-through"
            )}
          >
            {displayText}
          </span>
          <div className="invisible flex items-center gap-2 group-hover:visible">
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 opacity-50"
              disabled={show}
              onClick={() => {
                setShow(true)
                setTimeout(() => {
                  setShow(false)
                }, 1500)
              }}
            >
              <span className="sr-only">Toggle key visibility</span>
              {show ? <EyeOff /> : <Eye />}
            </Button>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 opacity-50"
              onClick={async () => {
                setCopied(true)
                await Promise.all([
                  navigator.clipboard.writeText(key),
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                ])
                setCopied(false)
              }}
            >
              <span className="sr-only">Copy key</span>
              {copied ? <Icons.CopyDone /> : <Icons.Copy />}
            </Button>
          </div>
        </div>
      )
    },
    header: "Key",
  }),
  columnHelper.accessor("createdAt", {
    cell: (t) => format(t.getValue(), "yyyy-MM-dd"),
    header: "Created At",
  }),
  columnHelper.accessor("expiresAt", {
    filterFn: (rows, id, filterValue) => {
      if (filterValue === "all") {
        return true
      }
      return rows.original.revokedAt === filterValue
    },
    cell: (t) => {
      if (t.row.original.revokedAt !== null) {
        return (
          <div className="flex flex-col text-destructive">
            <span>Revoked</span>
            <span>{format(t.row.original.revokedAt, "yyyy-MM-dd")}</span>
          </div>
        )
      }

      const value = t.getValue()
      if (value === null) {
        return "Never expires"
      }

      if (value < new Date()) {
        return (
          <div className="flex flex-col text-destructive">
            <span>Expired</span>
            <span>{format(value, "yyyy-MM-dd")}</span>
          </div>
        )
      }
      return format(value, "yyyy-MM-dd")
    },
    header: "Expires At",
  }),
  columnHelper.accessor("lastUsed", {
    cell: (t) => {
      const value = t.getValue()
      if (value === null) {
        return "Never used"
      }
      return formatRelative(value, new Date())
    },
    header: "Last Used At",
  }),
  columnHelper.display({
    enableSorting: false,
    enableHiding: false,
    id: "actions",
    header: function ActionsHeader(t) {
      const toaster = useToast()
      const apiUtils = apiRQ.useContext()
      const { rows } = t.table.getSelectedRowModel()
      const projectId = t.table.getRowModel().rows[0]?.original.projectId
      const ids = rows.map((row) => row.original.id)

      const revokeApiKeys = apiRQ.apikey.revokeApiKeys.useMutation({
        onSettled: async () => {
          await apiUtils.apikey.listApiKeys.refetch({ projectSlug })
        },
        onSuccess: (data) => {
          toaster.toast({
            title: `Revoked ${data.numRevoked} API keys`,
          })
          t.table.toggleAllRowsSelected(false)
        },
        onError: (err) => {
          if (err instanceof TRPCClientError) {
            toaster.toast({
              title: err.message,
              variant: "destructive",
            })
          } else {
            toaster.toast({
              title: "Failed to revoke API Keys",
              variant: "destructive",
            })
          }
        },
      })

      if (!projectId) return null

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={ids.length < 1}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                revokeApiKeys.mutate({
                  ids,
                  projectId: projectId,
                })
              }}
              className="text-destructive"
            >
              Revoke {ids.length} API key{ids.length > 1 ? "s" : ""}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    cell: function Actions(t) {
      const apiKey = t.row.original
      const apiUtils = apiRQ.useContext()
      const toaster = useToast()
      const projectId = t.table.getRowModel().rows[0]?.original.projectId

      const revokeApiKeys = apiRQ.apikey.revokeApiKeys.useMutation({
        onSettled: async () => {
          await apiUtils.apikey.listApiKeys.refetch({ projectSlug })
        },
        onSuccess: () => {
          toaster.toast({
            title: "API key revoked",
          })
          t.table.toggleAllRowsSelected(false)
        },
        onError: (err) => {
          if (err instanceof TRPCClientError) {
            toaster.toast({
              title: err.message,
              variant: "destructive",
            })
          } else {
            toaster.toast({
              title: "Failed to revoke API Keys",
              variant: "destructive",
            })
          }
        },
      })

      const rollApiKey = apiRQ.apikey.rollApiKey.useMutation({
        onSettled: async () => {
          await apiUtils.apikey.listApiKeys.refetch({ projectSlug })
        },
        onSuccess: () => {
          toaster.toast({
            title: "API key rolled",
          })
          t.table.toggleAllRowsSelected(false)
        },
        onError: (err) => {
          if (err instanceof TRPCClientError) {
            toaster.toast({
              title: err.message,
              variant: "destructive",
            })
          } else {
            toaster.toast({
              title: "Failed to rolled API Key",
              variant: "destructive",
            })
          }
        },
      })

      if (!projectId) return null

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                revokeApiKeys.mutate({
                  ids: [apiKey.id],
                  projectId: projectId,
                })
              }}
              className="text-destructive"
            >
              Revoke Key
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={async () => {
                rollApiKey.mutate({
                  id: apiKey.id,
                })
              }}
              className="text-destructive"
            >
              Roll Key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }),
]

export function DataTable(props: {
  data: ApiKeyColumn[]
  projectSlug: string
  loading: boolean
}) {
  const [rowSelection, setRowSelection] = useState({})
  const [showRevoked, setShowRevoked] = useState(true)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isFetching } = apiRQ.apikey.listApiKeys.useQuery(
    {
      projectSlug: props.projectSlug,
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      initialData: props.data,
    }
  )

  const loadingData = props.loading || isFetching

  const columnsData = useMemo(
    () => columns(props.projectSlug),
    [props.projectSlug]
  )

  const table = useReactTable({
    data: data,
    columns: columnsData,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="flex w-1/2 bg-background-base"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-5">
              <Icons.Settings className="mr-2 h-4 w-4" /> Show Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mb-2 flex items-center justify-end gap-2 py-2">
        <Label>Show revoked keys</Label>
        <Checkbox
          checked={showRevoked}
          onCheckedChange={(c) => {
            const checked = !!c
            table.getColumn("expiresAt")?.setFilterValue(checked ? "all" : null)
            setShowRevoked(checked)
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-background-base">
            {loadingData ? (
              <DataTableSkeleton />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  disabled={(() => {
                    if (row.original.revokedAt !== null) {
                      return true
                    }
                    if (row.original.expiresAt !== null) {
                      return row.original.expiresAt < new Date()
                    }
                    return false
                  })()}
                  className={cn("group")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex-1 py-4 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

const DataTableSkeleton = () =>
  Array.from({ length: 4 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell>
        <Skeleton className="my-1 h-[20px] w-[20px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-[20px] w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-[20px] w-[300px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-[20px] w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-[20px] w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-[20px] w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="mx-3 h-[20px] w-[5px]" />
      </TableCell>
    </TableRow>
  ))
