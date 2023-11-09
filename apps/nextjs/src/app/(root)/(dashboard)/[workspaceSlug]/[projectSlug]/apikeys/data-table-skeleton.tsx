import { Button } from "@builderai/ui/button"
import { Checkbox } from "@builderai/ui/checkbox"
import { Settings } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { Skeleton } from "@builderai/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"

export const DataTableSkeleton = () =>
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

export function ApiKeysSkeleton() {
  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          disabled
          className="flex w-1/2 bg-background-base"
        />
        <Button variant="outline" size="sm" className="ml-5">
          <Settings className="mr-2 h-4 w-4" /> Show Columns
        </Button>
      </div>
      <div className="mb-2 flex items-center justify-end gap-2 py-2">
        <Label>Show revoked keys</Label>
        <Checkbox disabled className="max-w-sm" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-background"></TableHeader>
          <TableBody className="bg-background-base">
            <DataTableSkeleton />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
