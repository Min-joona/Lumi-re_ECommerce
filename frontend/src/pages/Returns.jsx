export default function Returns() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-4xl mb-8 text-center">Returns & Refunds</h1>
      <div className="space-y-8 text-ink/80 leading-relaxed bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">Our Policy</h2>
          <p>
            We want you to be completely satisfied with your purchase. If you are not entirely happy, we offer a hassle-free return policy within 14 days of delivery. 
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">Conditions for Return</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>The item must be unused, in its original packaging, and in the same condition that you received it.</li>
            <li>A receipt or proof of purchase is required.</li>
            <li>Perishable goods, intimates, and personalized items are exempt from being returned.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4 text-ink">Refund Process</h2>
          <p>
            Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed and automatically applied to your original method of payment (Telebirr, CBE Birr, Chapa) within 5-7 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
