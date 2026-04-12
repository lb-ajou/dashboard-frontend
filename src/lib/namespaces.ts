export const NAMESPACE_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function isValidNamespaceName(value: string) {
  return NAMESPACE_NAME_PATTERN.test(value);
}

export const INVALID_NAMESPACE_MESSAGE =
  "Namespace must contain only letters, numbers, dots, underscores, or hyphens.";
