#!/usr/bin/env bash
set -e

VERSION=$1

directory="datasources/fixtures"
extensions=("csv" "ndjson")

absolute_directory=$(realpath "$directory")

for extension in "${extensions[@]}"; do
  file_list=$(find "$absolute_directory" -type f -name "*.$extension")

  if [ -z "$file_list" ]; then
    echo "⚠️ Warning: No files with .$extension extension found in $absolute_directory"
  else
    for file_path in $file_list; do
      file_name=$(basename "$file_path")
      file_name_without_extension="${file_name%.*}"

      command="tb datasource append $file_name_without_extension datasources/fixtures/$file_name"
      echo $command
      $command
    done
  fi
done