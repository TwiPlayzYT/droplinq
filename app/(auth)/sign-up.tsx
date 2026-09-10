import { Redirect } from 'expo-router';

/** Kept so old links still work — first screen is Sign Up at /start. */
export default function SignUpAlias() {
  return <Redirect href={'/start' as never} />;
}
