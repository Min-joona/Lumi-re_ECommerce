export default function Shipping() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-4xl mb-8 text-center">Shipping Information</h1>
      <div className="space-y-8 text-ink/80 leading-relaxed bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">Delivery Options</h2>
          <p>
            We offer nationwide delivery across Ethiopia. Depending on your location, you can choose from the following delivery options during checkout:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Standard Delivery:</strong> 3-5 business days. Free for orders over 100 ETB.</li>
            <li><strong>Express Delivery:</strong> 1-2 business days (Addis Ababa only). Costs vary based on distance.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">Order Processing</h2>
          <p>
            Orders are processed within 24 hours. Orders placed on weekends or public holidays will be processed on the next business day. You will receive an email and an SMS notification with a tracking number once your order is on its way.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">International Shipping</h2>
          <p>
            Currently, Lumière E-Commerce is designed to serve customers within Ethiopia. We do not offer international shipping at this time.
          </p>
        </section>
      </div>
    </div>
  );
}
