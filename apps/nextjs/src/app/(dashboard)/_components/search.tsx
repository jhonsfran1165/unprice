import { Input } from "@builderai/ui/input";

export function Search() {
  return (
    <div>
      <Input
        type="search"
        placeholder="Search..."
        className="h-9 md:w-[100px] lg:w-[300px] mr-3"
      />
    </div>
  );
}
