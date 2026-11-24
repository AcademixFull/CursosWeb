interface LocationParts {
  pathname: string;
  search: string;
  hash: string;
}

export function locationPath(location: LocationParts): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function safeReturnTo(value: unknown, fallback: string): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
