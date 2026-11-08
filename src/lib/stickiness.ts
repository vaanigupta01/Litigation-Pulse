/**
 * Rolling DAU/MAU: for each day d in [from, to], users on d divided by distinct
 * users in the 30 days ending on d; averaged over the days. This is the standard
 * stickiness measure and the one the generator tunes against.
 */
export function rollingStickiness(userDays: Map<number, Set<string>>, from: number, to: number): number {
  let sum = 0;
  let n = 0;
  for (let d = from; d <= to; d++) {
    const mau = new Set<string>();
    for (let k = d - 29; k <= d; k++) userDays.get(k)?.forEach((u) => mau.add(u));
    const dau = userDays.get(d)?.size ?? 0;
    sum += mau.size ? dau / mau.size : 0;
    n++;
  }
  return n ? sum / n : 0;
}
