export type PasswordRule = {
  id: 'length' | 'upper' | 'number-or-symbol';
  label: string;
  met: boolean;
};

const RULES: { id: PasswordRule['id']; label: string; test: (password: string) => boolean }[] = [
  {
    id: 'length',
    label: 'At least 8 characters long',
    test: (password) => password.length >= 8,
  },
  {
    id: 'upper',
    label: 'Contains 1 uppercase character',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number-or-symbol',
    label: 'Contains 1 number or symbol',
    test: (password) => /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password),
  },
];

export function passwordRules(password: string): PasswordRule[] {
  return RULES.map((rule) => ({ id: rule.id, label: rule.label, met: rule.test(password) }));
}

/** Null when the password can be used to create an email account. */
export function passwordRequirementMessage(password: string): string | null {
  const missing = passwordRules(password).find((rule) => !rule.met);
  return missing ? `${missing.label}.` : null;
}
