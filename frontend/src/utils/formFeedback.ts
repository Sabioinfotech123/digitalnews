/** Minimal shape of Ant Design Form `onFinishFailed` info (avoids deep rc-field-form imports). */
export type FormValidationInfo = {
  errorFields?: Array<{ name: Array<string | number>; errors: string[] }>
}

/** Toast copy for Ant Design form validation failures (field errors stay under inputs). */
export function getFormValidationMessage(errorInfo: FormValidationInfo): string {
  const first = errorInfo.errorFields?.[0]?.errors?.[0]
  if (first) return first
  return 'Please fix the highlighted fields'
}
