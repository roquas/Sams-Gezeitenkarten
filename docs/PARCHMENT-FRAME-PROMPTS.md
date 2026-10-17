# Imagegen-Prompts, 14.10.2026

Eingabe jeweils: unveränderte `assets/seekarte/meer-pergament.webp` aus main
4d9913c. Eingebautes Imagegen-Werkzeug, kein CLI/API-Fallback. Ausgaben wurden
mit ImageMagick nach WebP konvertiert, ohne Größenänderung.

## Rahmen (transparent_background: true)

Create a standalone raster parchment FRAME asset using the supplied nautical watercolor map as style reference. High resolution about 2252 x 1892, landscape aspect 563:473. Flat overhead antique warm cream parchment, fine crisp irregular torn outer and inner edges, subtle fibers and restrained brown ink contour like reference. A thin continuous rectangular frame band around all four sides: about 5 percent of canvas width on left/right and 5 percent of height top/bottom. Entire large rectangular interior completely transparent, exterior transparent. No sea, no islands, no objects, no text, no symbols, no grid, no drop shadow, no curled rolls, no broad dark burn marks. Band should stay narrow and consistent, beautiful delicate original watercolor quality, not blurry. This will overlay a separate water image and SVG coordinates.

Ausgabe: `assets/seekarte/pergament-rahmen-prototyp.webp`.

## Wasser (transparent_background: false)

Edit target: supplied watercolor nautical chart. Produce ONLY the painted teal blue sea texture, edge-to-edge across the entire rectangular image. Remove ALL parchment border and replace with matching sea. Remove small object/island bottom left and all other objects. Preserve closely original teal turquoise palette, watercolor brush scale and restrained small white wave accents. No islands, landmarks, rocks, ships, text, grid, frame or shadows. Flat top-down sea background for existing game illustrations, landscape aspect 563:473, high resolution.

Ausgabe: `assets/seekarte/meer-ohne-objekte-prototyp.webp`.
