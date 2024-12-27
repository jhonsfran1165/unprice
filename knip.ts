import type { KnipConfig } from "knip"

const config: KnipConfig = {
  ignoreDependencies: ["cz-conventional-changelog"],
  project: ["apps/**/*.{js,ts}"],
}

export default config
