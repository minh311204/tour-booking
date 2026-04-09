export function formatVnd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) {
    return "Liên hệ";
  }
  return `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
}

export function errorMessage(body: unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return "Đã có lỗi xảy ra";
}
