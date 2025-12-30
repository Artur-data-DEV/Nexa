import Image from "next/image";

export const WhyNexaSection = () => {
  return (
    <section className="relative py-12 md:py-24 overflow-hidden bg-white dark:bg-[#121212]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[500px] w-[500px] rounded-full bg-purple-600/3:dark:bg-purple-600/5-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-pink-500/3 dark:bg-pink-500/5 blur-[120px] pointer-events-none" />

      {/* Subtle Grid Pattern (Optional but adds texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 md:px-8">
          <div className="relative order-last lg:order-first">
            {/* Image Wrapper with Glassmorphism effect */}
            <div className="relative p-2 md:p-3 rounded-[2.5rem] bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-2xl backdrop-blur-sm">
              <div className="w-full aspect-square rounded-[2rem] overflow-hidden relative shadow-inner">
                <Image
                  src="/assets/landing/why-nexa.png"
                  alt="Why NEXA UGC"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
              </div>

              {/* Floating Decorative Elements */}
              <div className="absolute -bottom-5 -right-1 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-white/10 animate-bounce transition-all duration-3000">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">+10k Criadores</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8 text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                Nossa História
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white leading-[1.1] tracking-tighter">
                Por que criei a <span className="bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">NEXA</span>?
              </h2>
            </div>

            <div className="space-y-4 md:space-y-6 text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              <p>
                Há 5 anos, comecei a <span className="text-zinc-900 dark:text-white font-bold underline decoration-purple-500/30">criar conteúdo para marcas</span> sem saber que isso se tornaria minha carreira.
                O que começou como um hobby se transformou em uma fonte de renda que <span className="text-zinc-900 dark:text-white font-bold">mudou completamente minha vida financeira.</span>
              </p>

              <p>
                Durante essa jornada, percebi que muitos creators talentosos não sabiam como <span className="text-purple-600 dark:text-purple-400 font-bold">monetizar adequadamente seu conteúdo</span> ou como se conectar com marcas dispostas a pagar valores justos.
              </p>

              <p>
                Percebi a falta de uma plataforma brasileira que realmente entendesse nossa realidade e oferecesse <span className="text-pink-500 font-bold">oportunidades reais</span>, um problema que eu mesma enfrentei.
              </p>

              <p className="p-4 md:p-6 bg-zinc-100/50 dark:bg-white/5 border-l-4 border-purple-600 rounded-r-2xl italic">
                "Foi então que criei a <span className="font-light text-chart-4">NEXA</span> - para ser a ponte definitiva entre <span className="text-chart-4 font-bold">creators autênticos</span> e marcas que valorizam <span className="text-chart-4 font-bold">conteúdo genuíno</span>, garantindo <span className="text-chart-4 font-bold">pagamentos justos</span>, processos transparentes e proteção total para ambos os lados."
              </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed tracking-wider">
              Minha missão é construir <span className="text-chart-4 font-bold">o maior ecossistema de UGC do Brasil</span>, onde creators podem prosperar financeiramente, aprender continuamente e crescer em uma comunidade de alta performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
