export function createUploadFile(
  contents: BlobPart | readonly BlobPart[],
  name: string,
  type: string,
): File {
  return new File(Array.isArray(contents) ? contents : [contents], name, { type });
}
