export function invalidateSalesRelatedQueries(queryClient) {
  const prefixes = [
    ["daily"],
    ["sales-recent"],
    ["sales-last"],
    ["sales"],
    ["dashboard-summary"],
    ["pay-methods"],
    ["low-stock"],
    ["products"],
    ["inventory"],
    ["product"],
    ["notifications"],
    ["customers"],
    ["credits"],
    ["eod"],
    ["eod-preview"],
    ["payment-notifs-active"],
  ];
  prefixes.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
