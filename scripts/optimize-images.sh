#!/bin/bash
# Optimizes images in src/content/bakes/ using sips (built into macOS).
# Resizes to max 1200px wide and converts HEIC/PNG to JPEG.
# Run before committing: ./scripts/optimize-images.sh
#
# Skips files that have already been optimized (under 500KB).

DIR="src/content/bakes"

find "$DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.heic" \) | while read -r file; do
  size=$(stat -f%z "$file")

  # Skip files already under 500KB
  if [ "$size" -lt 512000 ]; then
    continue
  fi

  # Convert HEIC/PNG to JPEG
  ext=$(echo "${file##*.}" | tr '[:upper:]' '[:lower:]')
  if [[ "$ext" != "jpg" && "$ext" != "jpeg" ]]; then
    newfile="${file%.*}.jpeg"
    sips -s format jpeg -s formatOptions 80 "$file" --out "$newfile" >/dev/null 2>&1
    rm "$file"
    file="$newfile"
    echo "Converted: ${file}"
  fi

  # Resize if wider than 1200px
  width=$(sips -g pixelWidth "$file" 2>/dev/null | tail -1 | awk '{print $2}')
  if [ "$width" -gt 1200 ] 2>/dev/null; then
    sips --resampleWidth 1200 "$file" >/dev/null 2>&1
    echo "Resized: ${file}"
  fi

  # Compress JPEG quality
  sips -s formatOptions 80 "$file" >/dev/null 2>&1
  echo "Optimized: ${file}"
done

echo "Done."
