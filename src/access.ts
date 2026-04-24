export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {}
  return {
    canAdmin: Boolean(currentUser?.is_admin),
  }
}
