/** Guest originals are in a server-only namespace, outside auth.uid() policies. */
export function productionReceiptAssetPath(receipt, assetId) {
  return `${receipt.owner_id ?? 'guest'}/${receipt.id}/${assetId}`;
}
