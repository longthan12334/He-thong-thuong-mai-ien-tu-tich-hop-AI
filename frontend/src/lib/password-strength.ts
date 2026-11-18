export function evaluatePasswordStrength(password: string) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^\p{L}\p{N}\s]/u.test(password),
  ].filter(Boolean).length;
  const level = password.length < 8 ? 1 : Math.max(1, score - 1);
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const colors = ['#b91c1c', '#b45309', '#1d4ed8', '#047857'];
  return {
    level,
    label: labels[level - 1],
    color: colors[level - 1],
    hint: password.length < 8 ? 'Dùng ít nhất 8 ký tự.' :
      'Ưu tiên mật khẩu dài, riêng cho tài khoản này.',
  };
}
