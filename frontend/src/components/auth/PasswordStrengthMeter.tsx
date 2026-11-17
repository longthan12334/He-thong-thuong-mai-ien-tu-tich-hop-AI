import { evaluatePasswordStrength } from '@/lib/password-strength';

export function PasswordStrengthMeter({ password, id }: { password: string; id: string }) {
  if (!password) return null;
  const strength = evaluatePasswordStrength(password);

  return (
    <div id={id} className="mt-2 space-y-1" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Độ mạnh mật khẩu</span>
        <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className="h-full origin-left rounded-full transition-transform duration-200 motion-reduce:transition-none"
          style={{ transform: 'scaleX(' + strength.level / 4 + ')', backgroundColor: strength.color }}
        />
      </div>
      <p className="text-xs text-slate-500">{strength.hint}</p>
    </div>
  );
}
