import Image from "next/image";

export const WhyNexaSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center px-4 md:px-6">
          <div className="relative order-last lg:order-first">
            <div className="w-full aspect-square max-w-xl mx-auto rounded-3xl overflow-hidden relative">
              <Image
                src="/assets/landing/why-nexa.png"
                alt="Why NEXA UGC"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="space-y-4 md:space-y-6 text-left leading-relaxed tracking-wider">
            <h2 className="text-2xl text-center! sm:text-3xl lg:text-4xl font-bold text-foreground">
              Por que criei a NEXA
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Há 5 anos, comecei a <span className="text-chart-4 font-bold">criar conteúdo para marcas</span> sem saber que isso se tornaria minha carreira.

              O que começou como um hobby se transformou em uma fonte de renda que<span className="text-chart-4 font-bold"> mudou completamente minha vida financeira.</span>
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Durante essa jornada, percebi que muitos creators talentosos não sabiam como <span className="text-chart-4 font-bold">monetizar adequadamente seu conteúdo</span> ou como se <span className="text-chart-4 font-bold">conectar com marcas</span> dispostas a pagar valores justos.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Percebi a falta de uma plataforma brasileira que realmente entendesse nossa realidade e oferecesse  <span className="text-chart-4 font-bold">oportunidades reais</span>, um problema que eu mesma enfrentei.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Foi então que criei a <span className="font-light text-chart-4">NEXA</span> -  para ser a ponte definitiva entre <span className="text-chart-4 font-bold">creators autênticos</span> e marcas que valorizam <span className="text-chart-4 font-bold">conteúdo genuíno</span>, garantindo <span className="text-chart-4 font-bold">pagamentos justos</span>, processos transparentes e proteção total para ambos os lados.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Minha missão é construir <span className="text-chart-4 font-bold">o maior ecossistema de UGC do Brasil</span>, onde creators podem prosperar financeiramente, aprender continuamente e crescer em uma comunidade de alta performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
