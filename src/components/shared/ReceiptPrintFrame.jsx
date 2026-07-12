const RECEIPT_STORE_NAME = "OlitechHub";
const RECEIPT_STORE_PHONE = "0788308035";
const RECEIPT_STORE_LOCATION = "Kimironko, Kigali, Rwanda";

const RECEIPT_PAY_LABEL = {
  CASH: "Cash",
  MOMO_CODE: "MoMo code",
  PHONE_NUMBER: "Phone pay",
  POS: "POS card",
  CREDIT: "Credit",
};

export const enrichReceiptForDisplay = (receipt) => {
  if (!receipt) return null;
  return {
    ...receipt,
    store_name: receipt.store_name || RECEIPT_STORE_NAME,
    store_phone: receipt.store_phone || RECEIPT_STORE_PHONE,
    store_address: receipt.store_address || RECEIPT_STORE_LOCATION,
  };
};

export default function ReceiptPrintFrame({ receipt: rawReceipt }) {
  const receipt = enrichReceiptForDisplay(rawReceipt);
  if (!receipt) return null;

  const isDraft = receipt.receipt_number === "DRAFT";
  const items = receipt.items || [];
  const payments = receipt.payments || [];
  const displayReceiptNo = isDraft
    ? "DRAFT"
    : receipt.receipt_number?.startsWith("OLH-")
      ? receipt.receipt_number
      : `OLH-${receipt.receipt_number}`;

  const amountPaid = Math.round(
    receipt.totalPaid ?? Number(receipt.total || 0) + Number(receipt.change_due || 0)
  );

  return (
    <div className="receipt-print-area">
      <header className="receipt__header">
        <p className="receipt__eyebrow">Sales Receipt</p>
        <h2>{receipt.store_name}</h2>
        <p className="receipt__tagline">Smart Retail &amp; POS Services</p>
        <p>{receipt.store_address}</p>
        <p>Tel: {receipt.store_phone}</p>
        <p className="receipt__rule">------------------------------------------</p>
      </header>

      <section className="receipt__meta">
        <div>
          <span>Receipt No:</span>
          <strong>{displayReceiptNo}</strong>
        </div>
        <div>
          <span>Date:</span>
          <span>{receipt.date}</span>
        </div>
        <div>
          <span>Time:</span>
          <span>{receipt.time}</span>
        </div>
        <div>
          <span>Cashier:</span>
          <span>{receipt.cashier_name}</span>
        </div>
        <p className="receipt__rule">------------------------------------------</p>
      </section>

      <section>
        <table className="receipt__table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th>QTY</th>
              <th>UNIT</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  <span className="receipt__item-name">{it.product_name}</span>
                  <span className="receipt__item-as">
                    ({it.sold_as === "package" ? "box/pkg" : "units"})
                  </span>
                </td>
                <td>{it.quantity}</td>
                <td>{Math.round(it.unit_price || 0).toLocaleString()}</td>
                <td>{Math.round(it.line_total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="receipt__rule">------------------------------------------</p>
      </section>

      <section className="receipt__summary">
        <div>
          <span>Subtotal:</span>
          <span>RWF {Math.round(receipt.subtotal ?? 0).toLocaleString()}</span>
        </div>
        <div>
          <span>Discount:</span>
          <span>RWF {Math.round(receipt.discount_amount ?? 0).toLocaleString()}</span>
        </div>
        <div className="receipt__total">
          <span>Total:</span>
          <span>RWF {Math.round(receipt.total ?? 0).toLocaleString()}</span>
        </div>
        <p className="receipt__rule">------------------------------------------</p>
      </section>

      <section className="receipt__summary">
        <div>
          <span>Payment Method:</span>
          <strong>{RECEIPT_PAY_LABEL[payments[0]?.method] || payments[0]?.method || "CASH"}</strong>
        </div>
        <div>
          <span>Amount Paid:</span>
          <span>RWF {amountPaid.toLocaleString()}</span>
        </div>
        <div>
          <span>Change:</span>
          <strong>RWF {Math.round(receipt.change_due ?? 0).toLocaleString()}</strong>
        </div>
      </section>

      <footer className="receipt__footer">
        <p>Thank you for shopping with us!</p>
        <p>{receipt.store_name} – Reliable Retail Technology</p>
      </footer>
    </div>
  );
}
