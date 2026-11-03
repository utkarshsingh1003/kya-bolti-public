import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Returns only campaigns that are explicitly active AND payment-verified.
 * Contact details are never included in the public response.
 */
export async function GET() {
  const repo = await getRepository();
  const ads = await repo.listActiveAds();
  return noStore({
    ok: true,
    ads: ads.map((ad) => ({
      id: ad.id,
      advertiserName: ad.advertiserName,
      placement: ad.placement,
      destinationUrl: ad.destinationUrl,
      creativeUrl: ad.creativeUrl,
      campaignEnd: ad.campaignEnd,
    })),
  });
}
