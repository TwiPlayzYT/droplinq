import { Redirect } from 'expo-router';

/** Kept so old links still work — first screen is Sign Up at /(auth). */
export default function SignUpAlias() {
  return <Redirect href="/(auth)" />;
}
