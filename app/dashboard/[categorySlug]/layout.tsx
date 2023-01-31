import { PageProps, fetchCategoryBySlug } from "@/lib/getCategories"

export default async function Layout({ children, params }: PageProps) {
  const category = await fetchCategoryBySlug(params.categorySlug)
  if (!category) return null

  return (
    <div className="space-y-9">
      <div>{children}</div>
    </div>
  )
}
