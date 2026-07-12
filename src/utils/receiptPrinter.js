const MODE_CLASS = "print-receipt-mode";

/** Opens the print dialog for `.receipt-print-area`. */
export const printReceipt = () => {
  const html = document.documentElement;
  html.classList.add(MODE_CLASS);

  const cleanup = () => {
    html.classList.remove(MODE_CLASS);
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 8000);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
};
