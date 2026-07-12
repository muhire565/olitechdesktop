import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socket from "../lib/socket";

export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const onSaleNew = () => {
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["sales-recent"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sales-last"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["eod-preview"] });
    };

    const onInventoryUpdate = () => {
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["pos-products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    };

    const onExpenseNew = () => {
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["eod-preview"] });
    };

    const onDashboardRefresh = () => {
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["sales-recent"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["eod"] });
      qc.invalidateQueries({ queryKey: ["eod-preview"] });
      qc.invalidateQueries({ queryKey: ["savings"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sales-last"] });
      qc.invalidateQueries({ queryKey: ["sale"] });
    };

    const onNotificationNew = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["payment-notifications"] });
    };

    const onEodSubmitted = () => {
      qc.invalidateQueries({ queryKey: ["eod"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["eod-preview"] });
    };

    const onProductUpdated = () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["pos-products"] });
    };

    const onCreditsUpdated = () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    };

    const onCustomersUpdated = () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    };

    socket.on("sale:new", onSaleNew);
    socket.on("inventory:update", onInventoryUpdate);
    socket.on("expense:new", onExpenseNew);
    socket.on("dashboard:refresh", onDashboardRefresh);
    socket.on("notification:new", onNotificationNew);
    socket.on("eod:submitted", onEodSubmitted);
    socket.on("product:updated", onProductUpdated);
    socket.on("credits:updated", onCreditsUpdated);
    socket.on("customers:updated", onCustomersUpdated);

    return () => {
      socket.off("sale:new", onSaleNew);
      socket.off("inventory:update", onInventoryUpdate);
      socket.off("expense:new", onExpenseNew);
      socket.off("dashboard:refresh", onDashboardRefresh);
      socket.off("notification:new", onNotificationNew);
      socket.off("eod:submitted", onEodSubmitted);
      socket.off("product:updated", onProductUpdated);
      socket.off("credits:updated", onCreditsUpdated);
      socket.off("customers:updated", onCustomersUpdated);
    };
  }, [qc]);
}
