# Sample D CMYK print repair

These six PDFs replace only the exact source hashes listed in `manifest.json` for Sample D (`8fab8b4c-6164-42cc-8cb8-9cff61ca39d0`). The original PDFs remain available in the original source package. The cover was included after inspection found the same embedded RGB profile; the planner also contained RGB vector paint and an RGB page blending group.

Ghostscript pdfwrite converted paint and images to CMYK using the original Japan Color 2001 Coated output profile, with image downsampling disabled. Page boxes were restored exactly afterward. The planner's page blending group was set to DeviceCMYK after converting its actual paint operations. All 28 pages retain their original vector path counts, including all 1,326 planner paths; they are not full-page raster images.

Run `python scripts/sample-d/audit-cmyk.py` with pypdf installed to verify hashes, dimensions, nested color spaces, ICC profiles and RGB paint operators. The authenticated `/sample-d-print-repair.html` flow registers new immutable PDF documents and replaces known references in the latest saved template only. It preserves school data, images, placement and template state. It rejects a template version changed since the operation started and verifies the saved revision afterward. This does not mutate an existing frozen print package or failed job: create a new print inspection after saving the repaired template.

Original conversion: Ghostscript `pdfwrite`, PDF 1.6, `ColorConversionStrategy=CMYK`, `ProcessColorModel=/DeviceCMYK`, `OutputICCProfile=<original CMYK output profile>`, `AutoRotatePages=/None`, and all three `Downsample*Images=false`. Restored MediaBox/CropBox/TrimBox/BleedBox/ArtBox values with pypdf. The final print PDF/X checks remain the responsibility of the existing print worker.

Version 2 expands the four CMYK Indexed palette images into direct DeviceCMYK images. Before/after rendered pixel bytes compare identically, and vector path counts are unchanged. Replacement accepts both original source hashes and the distinct v1 hashes, so an already-applied v1 repair can be upgraded while preserving authored content.

The three remaining gradient Pattern wrappers in month backgrounds are replaced by direct DeviceCMYK vector Shading operations. Unused palette and pattern resource definitions are removed. All pages retain identical rendered pixel bytes and vector path counts. The audit now rejects Indexed, Pattern, DeviceN, Separation and Lab as well as RGB, including nested resources.
