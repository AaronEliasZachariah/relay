/**
 * In-app purchases via RevenueCat.
 *
 * RevenueCat wraps Apple's and Google's subscription APIs (trials, renewals,
 * receipts) and tells the app who is "Pro". Real wiring uses
 * `react-native-purchases`:
 *
 *   Purchases.configure({ apiKey, appUserID: businessId });
 *   const offerings = await Purchases.getOfferings();
 *   await Purchases.purchasePackage(pkg);
 *   const info = await Purchases.getCustomerInfo();
 *   const isPro = info.entitlements.active['pro'] != null;
 *
 * RevenueCat also calls our backend webhook (/v1/webhooks/revenuecat) so the
 * server's plan stays authoritative. Mocked here so the app runs without the
 * native SDK or an account.
 */
import { useStore } from '@/data/store';

export type OfferingId = 'annual' | 'monthly';

export const OFFERINGS: { id: OfferingId; price: string; note: string }[] = [
  { id: 'annual', price: '$99/yr', note: '2 months free' },
  { id: 'monthly', price: '$12/mo', note: 'Billed monthly' },
];

/** Purchase Pro. Mock grants it locally; real flow goes through RevenueCat. */
export async function purchasePro(_offering: OfferingId): Promise<boolean> {
  useStore.getState().setPlan('pro');
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  return useStore.getState().plan === 'pro';
}
