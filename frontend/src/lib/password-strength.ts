export function evaluatePasswordStrength(password: string) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^\p{L}\p{N}\s]/u.test(password),
  ].filter(Boolean).length;
  const labels = ['Yếu', 'Yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const colors = ['#ef4444', '#ef4444', '#ef4444', '#b45309', '#2563eb', '#047857'];
  return {
    label: labels[score],
    color: colors[score],
    transform: 'scaleX(' + (password ? Math.max(1, score) / 5 : 0) + ')',
    hint: password.length < 8 ? 'Dùng ít nhất 8 ký tự.' :
      'Ưu tiên mật khẩu dài, riêng cho tài khoản này.',
  };
}
