import {
  isBiliUploadLineSelector,
  normalizeBiliUploadLines,
  type BiliUploadLineSelector,
} from "@biliLive-tools/shared/biliUploadRoute.js";

export function resolveBiliUploadLineSelection(
  nextLines: readonly string[],
  currentLines: readonly string[],
): BiliUploadLineSelector[] {
  const validNextLines = [...new Set(nextLines.filter(isBiliUploadLineSelector))];
  const validCurrentLines = normalizeBiliUploadLines(currentLines);

  if (validNextLines.length === 0) {
    return validCurrentLines;
  }

  const addedLine = validNextLines.find((line) => !validCurrentLines.includes(line));
  if (addedLine === "auto") {
    return ["auto"];
  }

  const fixedLines = validNextLines.filter((line) => line !== "auto");
  return fixedLines.length > 0 ? fixedLines : ["auto"];
}
