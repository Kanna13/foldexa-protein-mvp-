"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { HeroVisual } from "@/components/ui/HeroVisual";
import { ArrowRight, Play, ChevronsDown, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { PricingSection } from "@/components/marketing/PricingSection";
import Image from "next/image";
import { BenchmarksSection } from "@/components/marketing/BenchmarksSection";
import { StorySection } from "@/components/marketing/StorySection";

// ... (skipping to Vision Section)

{/* --- SECTION 5: OUR VISION --- */ }
<section className="bg-white py-32 border-t border-neutral-100/50">
  <div className="max-w-4xl mx-auto px-6 text-center">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100/50 border border-neutral-200 mb-8">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Our Vision</span>
    </div>

    <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-neutral-900 leading-tight mb-8">
      To democratize protein engineering and make cutting-edge AI tools accessible to researchers worldwide.
    </h2>

    <div className="w-24 h-px bg-neutral-200 mx-auto mb-8" />

    <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
      We believe that breakthrough discoveries shouldn't be limited by computational barriers. we built Foldexa to bridge the gap between biology and software.
    </p>
  </div>
</section>

{/* --- SECTION 6: PRICING --- */ }
<PricingSection />

{/* --- SECTION 7: CONTACT (Premium) --- */ }
<section id="contact" className="bg-gradient-to-b from-white to-neutral-50 py-32 border-t border-neutral-200 relative overflow-hidden">
  {/* Subtle DNA/Particle effect placeholder - minimal and static for performance */}
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

  <div className="max-w-5xl mx-auto px-6 relative z-10">
    <div className="text-center mb-16">
      <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-4 block">
        Contact
      </span>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-6 leading-tight">
        Let’s build the future of <br /> protein engineering together.
      </h2>
      <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
        Interested in partnering with Foldexa or learning more about our platform?
        We’re always open to research collaborations, partnerships, and early adopters.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
      {/* Card 1: LinkedIn */}
      <a
        href="https://www.linkedin.com/company/foldexa"
        target="_blank"
        rel="noopener noreferrer"
        className="group p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 bg-[#0077b5]/10 rounded-xl flex items-center justify-center text-[#0077b5] mb-6 group-hover:scale-110 transition-transform">
          <Linkedin className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Connect on LinkedIn</h3>
        <p className="text-neutral-500 mb-8 flex-grow">
          Follow Foldexa and message us for partnerships and updates.
        </p>
        <span className="text-[#0077b5] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
          Open LinkedIn <ArrowRight className="w-4 h-4" />
        </span>
      </a>

      {/* Card 2: Email */}
      <a
        href="mailto:contact@foldexa.com"
        className="group p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Email Us</h3>
        <p className="text-neutral-500 mb-8 flex-grow">
          Reach out directly for collaboration, research access, or questions.
        </p>
        <span className="text-emerald-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
          Send Email <ArrowRight className="w-4 h-4" />
        </span>
      </a>
    </div>

    <div className="text-center">
      <p className="text-sm text-neutral-400 font-medium bg-white/50 inline-block px-4 py-2 rounded-full border border-neutral-100 backdrop-blur-sm">
        Typically respond within 24–48 hours.
      </p>
    </div>
  </div>
</section>

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Natural Scroll - No forced sticky overlap for the white section
  // The hero just fades out slightly as we scroll past it
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative bg-background">
      <Navbar />

      {/* --- SECTION 1: DARK HERO (Sticky Effect) --- */}
      {/* Reduced height to 200vh for snappier scroll */}
      <div className="h-[200vh]">
        <section className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center relative bg-black">

          {/* Background Visual (Covers Everything) */}
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, willChange: "transform, opacity" }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <HeroVisual />
          </motion.div>

          {/* Content (Centered on top) */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-primary-dark text-xs font-mono uppercase tracking-[0.2em] opacity-90"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse" />
              v1.0 Public Beta
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.1] text-[#FFFFF0] drop-shadow-2xl"
            >
              Engineering <br />
              <span className="text-[#FFFFF0] font-bold tracking-tight">Life. </span>
              <span className="text-neutral-300 font-bold tracking-tight">Digitally.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-neutral-300 max-w-2xl leading-relaxed font-light tracking-wide"
            >
              An accurate and intelligent protein structure prediction platform.
              Accelerate drug discovery with next-generation AI models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link href="/app/new">
                <Button variant="primary" size="lg" className="min-w-[200px] transition-all duration-500 h-12 px-8 text-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold border-0">
                  Start Folding <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="min-w-[200px] h-12 px-8 text-lg bg-black/20 hover:bg-emerald-950/20 border-white/10 hover:border-emerald-500/20 text-emerald-100/80 hover:text-emerald-400 transition-all duration-300 backdrop-blur-sm">
                <Play className="mr-2 w-4.5 h-4.5 fill-current opacity-80" /> Watch Demo
              </Button>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            style={{ opacity: heroOpacity }}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 z-20"
          >
            <span className="text-xs uppercase tracking-widest font-mono">Explore</span>
            <ChevronsDown className="w-4 h-4" />
          </motion.div>
        </section>
      </div>

      {/* --- SECTION 2: ABOUT & PARTNERSHIPS --- */}
      <section id="about" className="relative z-20 bg-white text-black py-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-20 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-5xl font-bold tracking-tight leading-tight">From the Lab<br />to the Clone.</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Foldexa was created by three enthusiasts: <strong className="text-black">Azamat, Kanat, and Issabek</strong> — with a vision to democratize protein science.
              </p>
              <p className="text-lg text-gray-500 leading-relaxed">
                We combine state-of-the-art diffusion models (DiffAb, RFdiffusion) with AlphaFold2 to create a seamless pipeline for de novo protein design.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-10 border border-gray-200"
            >
              <h3 className="text-2xl font-bold mb-6">Our AI Models</h3>

              <div className="space-y-4">
                {[
                  {
                    name: "DiffAb",
                    desc: "Antibody CDR Design",
                    color: "bg-emerald-500",
                  },
                  {
                    name: "RFdiffusion",
                    desc: "Scaffold Generation",
                    color: "bg-cyan-500",
                  },
                  {
                    name: "AlphaFold2",
                    desc: "Structure Validation",
                    color: "bg-amber-500",
                  },
                ].map((model) => (
                  <div
                    key={model.name}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-200"
                  >
                    <span className={`w-3 h-3 rounded-full ${model.color}`} />

                    <div>
                      <p className="font-semibold">{model.name}</p>
                      <p className="text-sm text-gray-500">{model.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Partnerships Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="border-t border-gray-200 pt-16"
          >
            <h3 className="text-3xl font-bold tracking-tight text-black mb-12 text-center">Our Partners</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  name: "Solbridge",
                  desc: "International School of Business",
                  logo: "/logos/SOLBRIDGE-logo.png",
                  height: 60
                },
                {
                  name: "KAIST",
                  desc: "Korea Advanced Institute of Science",
                  logo: "/logos/Kaist.png",
                  height: 50
                }
              ].map((partner, idx) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center h-full"
                >
                  <div className="h-24 flex items-center justify-center mb-6 w-full">
                    <div className="relative w-full h-full max-w-[200px] flex items-center justify-center">
                      <Image
                        src={partner.logo}
                        alt={`${partner.name} Logo`}
                        width={200}
                        height={100}
                        className="object-contain max-h-full w-auto"
                      />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-gray-900">{partner.name}</h4>
                  <p className="text-sm text-gray-500 font-medium">{partner.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Partnership CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 mx-auto max-w-2xl bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center"
            >
              <h3 className="text-3xl font-bold text-neutral-900 mb-3 tracking-tight">Become a Partner</h3>
              <p className="text-lg text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
                Join KAIST, Solbridge, and other leading institutions in advancing the future of protein engineering.
              </p>

              <Link href="#contact">
                <Button className="min-w-[200px] bg-transparent border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white h-12 px-8 text-lg font-bold transition-all duration-300 rounded-full shadow-sm hover:shadow-md">
                  Partner With Us <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 3: HOW IT WORKS (Premium Grid) --- */}
      <section id="platform" className="bg-neutral-50/50 pt-20 pb-32 border-t border-neutral-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl font-mono font-bold tracking-tighter mb-4 text-neutral-900">Simple. Powerful. Fast.</h2>
            <p className="text-xl text-neutral-600 font-medium">Four steps to breakthrough protein designs</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                title: "Upload Structure",
                desc: "Drop your PDB file or paste sequence",
                detail: "Supports PDB, FASTA, and custom formats"
              },
              {
                step: "02",
                title: "Choose Pipeline",
                desc: "Select DiffAb, RFdiffusion, or full pipeline",
                detail: "AI automatically recommends optimal model"
              },
              {
                step: "03",
                title: "Generate",
                desc: "Our AI models create optimized variants",
                detail: "Real-time progress tracking and ETA"
              },
              {
                step: "04",
                title: "Analyze Results",
                desc: "Interactive 3D viewer with quality metrics",
                detail: "Download PDB, sequences, and reports"
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                className="group relative bg-white p-8 rounded-3xl border border-neutral-100 hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-700 shadow-sm shadow-emerald-500/10 border border-emerald-500/20">
                    <span className="font-mono text-sm font-bold">{item.step}</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-neutral-900 group-hover:text-black transition-colors">{item.title}</h3>
                  <p className="text-lg text-neutral-600 mb-4 group-hover:text-neutral-700 transition-colors">{item.desc}</p>

                  <div className="flex items-center text-sm font-medium text-neutral-400">
                    {item.detail}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href="/app/new">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="primary" size="lg" className="shadow-xl">
                  Try It Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 3.5: BENCHMARKS --- */}
      <BenchmarksSection />

      {/* --- SECTION 4: OUR STORY --- */}
      <StorySection />

      {/* --- SECTION 5: OUR VISION --- */}
      <section className="bg-white py-32 border-t border-neutral-100 relative overflow-hidden">
        {/* Static CSS-only ambient glow - lightweight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/5 to-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full border border-neutral-200 bg-white/50 backdrop-blur-sm text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-8">
            Our Vision
          </span>

          <h2 className="text-3xl md:text-5xl font-medium leading-tight tracking-tight text-neutral-900 mb-8 font-sans">
            To democratize protein engineering and make cutting-edge AI tools accessible to researchers worldwide.
          </h2>

          <div className="w-16 h-px bg-neutral-200 mx-auto mb-8" />

          <p className="text-lg md:text-xl text-neutral-500 font-light max-w-2xl mx-auto">
            We believe that breakthrough discoveries shouldn't be limited by computational barriers.
          </p>
        </div>
      </section>

      {/* --- SECTION 6: PRICING --- */}
      <PricingSection />

      {/* --- SECTION 7: CONTACT --- */}
      <section id="contact" className="bg-black py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-4 block">
            Get in Touch
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-6">
            Interested in partnering with us?
          </h2>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto mb-10 font-light">
            Whether you want to learn more or explore collaboration opportunities, we'd love to connect.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://www.linkedin.com/company/foldexa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#0077b5] text-white text-sm font-medium rounded-full hover:bg-[#006396] transition-colors min-w-[160px]"
            >
              LinkedIn
            </a>
            <a
              href="mailto:contact@foldexa.com"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-neutral-200 transition-colors min-w-[160px]"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
