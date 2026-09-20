import type { AppConfig, BiliUploadLineStrategy } from "@biliLive-tools/types";

export const BILI_UPLOAD_ACTIVE_LINE_SELECTORS = [
  "cs-bda2",
  "cs-bldsa",
  "cs-tx",
  "cs-qn",
  "cs-cnbldsa",
  "cs-akbd",
  "cs-estx",
  "cs-cnbd",
  "cs-cntx",
  "cs-andsa",
  "cs-anbd",
  "cs-antx",
  "cs-atdsa",
  "cs-atbd",
  "cs-attx",
] as const;

export const BILI_UPLOAD_LEGACY_LINE_SELECTORS = [
  "cs-txa",
  "cs-alia",
  "jd-bldsa",
  "jd-bd",
  "jd-tx",
  "jd-txa",
  "jd-alia",
] as const;

export const BILI_UPLOAD_LINE_SELECTORS = [
  "auto",
  ...BILI_UPLOAD_ACTIVE_LINE_SELECTORS,
  ...BILI_UPLOAD_LEGACY_LINE_SELECTORS,
] as const;

export type BiliUploadLineSelector = (typeof BILI_UPLOAD_LINE_SELECTORS)[number];

type UploadRouteConfig = Pick<AppConfig["biliUpload"], "line" | "lines" | "lineStrategy">;
type NormalizedUploadRouteConfig<T> = Omit<T, keyof UploadRouteConfig> & {
  line: BiliUploadLineSelector;
  lines: BiliUploadLineSelector[];
  lineStrategy: BiliUploadLineStrategy;
};

const allowedSelectors = new Set<string>(BILI_UPLOAD_LINE_SELECTORS);

export function isBiliUploadLineSelector(value: unknown): value is BiliUploadLineSelector {
  return typeof value === "string" && allowedSelectors.has(value);
}

export function normalizeBiliUploadLines(
  lines: readonly unknown[] | undefined,
  legacyLine: unknown = "auto",
): BiliUploadLineSelector[] {
  const fallback = isBiliUploadLineSelector(legacyLine) ? legacyLine : "auto";
  const source = Array.isArray(lines) && lines.length > 0 ? lines : [fallback];
  const uniqueLines = [...new Set(source.filter(isBiliUploadLineSelector))];

  if (uniqueLines.length === 0) {
    return [fallback];
  }

  // Malformed persisted values are resolved deterministically: the first valid
  // selector wins when it is auto; otherwise auto is removed from the fixed pool.
  if (uniqueLines[0] === "auto") {
    return ["auto"];
  }

  const fixedLines = uniqueLines.filter((line) => line !== "auto");
  return fixedLines.length > 0 ? fixedLines : ["auto"];
}

export function normalizeBiliUploadRouteConfig<T extends Partial<UploadRouteConfig>>(
  config: T,
): NormalizedUploadRouteConfig<T> {
  const lines = normalizeBiliUploadLines(config.lines, config.line);
  const lineStrategy: BiliUploadLineStrategy =
    lines.length === 1
      ? "fixed"
      : config.lineStrategy === "random" || config.lineStrategy === "round-robin"
        ? config.lineStrategy
        : "round-robin";

  return {
    ...config,
    line: lines[0],
    lines,
    lineStrategy,
  };
}

export type RouteSelectionContext = {
  accountId: string;
  taskId: string;
  lines: readonly string[];
  strategy: BiliUploadLineStrategy;
};

export type RouteSelection = {
  selector: BiliUploadLineSelector;
  zone: string;
  line: string;
};

export function parseBiliUploadRouteSelector(selector: string): RouteSelection {
  const normalizedSelector = isBiliUploadLineSelector(selector) ? selector : "auto";
  if (normalizedSelector === "auto") {
    return { selector: normalizedSelector, zone: "", line: "auto" };
  }

  const separatorIndex = normalizedSelector.indexOf("-");
  return {
    selector: normalizedSelector,
    zone: normalizedSelector.slice(0, separatorIndex),
    line: normalizedSelector.slice(separatorIndex + 1),
  };
}

export function getSanitizedUploadEndpointHost(url: string): string {
  try {
    return new URL(url).hostname || "unknown";
  } catch {
    return "unknown";
  }
}

export class BiliUploadRouteScheduler {
  private readonly cursors = new Map<string, number>();

  constructor(private readonly rng: () => number = Math.random) {}

  select(context: RouteSelectionContext): RouteSelection {
    const lines = normalizeBiliUploadLines(context.lines);
    const strategy = lines.length === 1 ? "fixed" : context.strategy;
    let index = 0;

    if (strategy === "round-robin") {
      const cursor = this.cursors.get(context.accountId) ?? 0;
      index = cursor % lines.length;
      this.cursors.set(context.accountId, cursor + 1);
    } else if (strategy === "random") {
      const randomIndex = Math.floor(this.rng() * lines.length);
      index = Math.min(Math.max(randomIndex, 0), lines.length - 1);
    }

    return parseBiliUploadRouteSelector(lines[index]);
  }

  reset() {
    this.cursors.clear();
  }
}

export const biliUploadRouteScheduler = new BiliUploadRouteScheduler();
