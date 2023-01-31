import { fetchSubCategory, type PageProps } from "@/lib/getCategories"

export default async function Page({ params }: PageProps) {
  const category = await fetchSubCategory(
    params.categorySlug,
    params.subCategorySlug
  )
  if (!category) return null

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-medium text-gray-400/80">{category.name}</h1>
    </div>
  )
}
