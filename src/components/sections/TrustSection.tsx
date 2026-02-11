const TrustSection = () => {
  return (
    <section className="py-12 px-4">
      <div className="w-full text-center px-4 md:px-8">
        <div className="bg-gradient-to-br from-cub-teal-light to-cub-mint-light rounded-3xl p-8 shadow-sm">
          <h2 className="font-display text-xl md:text-2xl font-bold text-primary mb-4">
            Built for structure. Designed for peace.
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary">
            <span aria-hidden="true">🔒</span>
            <span>Secure & private</span>

            <span aria-hidden="true">📄</span>
            <span>Exportable documentation</span>

            <span aria-hidden="true">⚖️</span>
            <span>Mediation-ready tools</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
