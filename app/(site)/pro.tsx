import { Redirect } from 'expo-router';

/** Pro billing is temporarily paused — send visitors to the marketing home. */
export default function MarketingPro() {
  return <Redirect href="/" />;
}
