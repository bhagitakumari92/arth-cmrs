export default function FormInput({ label, type = 'text', value, onChange, error, required, hint, ...props }) {
  return (
    <div>
      <label className="input-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'input-field-error' : ''}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
