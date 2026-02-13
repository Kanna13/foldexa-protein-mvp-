"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { HeroVisual } from "@/components/ui/HeroVisual";
import { ArrowRight, Play, ChevronsDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { PricingSection } from "@/components/marketing/PricingSection";
import Image from "next/image";

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
              <span className="w-2.0 h-2.0 rounded-full bg-primary animate-pulse" />
              v1.0 Public Beta
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] text-white/90 drop-shadow-2xl"
            >
              Engineering <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-400 font-bold">Life. Digitally.</span>
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
                <Button variant="primary" size="lg" className="min-w-[200px] shadow-[0_0_20px_rgba(0,217,126,0.15)] hover:shadow-[0_0_30px_rgba(0,217,126,0.3)] transition-shadow duration-500 h-14 px-8 text-lg">
                  Start Folding <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="min-w-[200px] h-13 px-8 text-lg bg-black/40 hover:bg-black/60 border-white/20">
                <Play className="mr-2 w-4.5 h-4.5 fill-current" /> Watch Demo
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
                Foldexa was created by three students: <strong className="text-black">Azamat, Kanat, and Issabek</strong> — with a vision to democratize protein science.
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
                ].map((model, idx) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <span className={`w-3 h-3 rounded-full ${model.color}`} />

                    <div>
                      <p className="font-semibold">{model.name}</p>
                      <p className="text-sm text-gray-500">{model.desc}</p>
                    </div>
                  </motion.div>
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
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-8 text-center">Our Partners</h3>
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
              className="mt-20 text-center"
            >
              <div className="inline-block relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl transform group-hover:scale-105 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                <motion.div
                  className="relative bg-white px-12 py-10 rounded-3xl border border-neutral-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50" />

                  <h3 className="text-3xl font-bold text-neutral-900 mb-3 tracking-tight">Become a Partner</h3>
                  <p className="text-lg text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
                    Join KAIST, Solbridge, and other leading institutions in advancing the future of protein engineering.
                  </p>

                  <Link href="#contact">
                    <Button variant="primary" size="lg" className="min-w-[200px] shadow-lg hover:shadow-emerald-500/20">
                      Partner With Us <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 3: HOW IT WORKS (Minimalist) --- */}
      <section id="platform" className="bg-white py-32">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-4 text-black">Simple. Powerful. Fast.</h2>
            <p className="text-xl text-gray-500">Four steps to breakthrough protein designs</p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Upload Structure",
                desc: "Drop your PDB file or paste sequence",
                detail: "Supports PDB, FASTA, and custom formats"
              },
              {
                step: "2",
                title: "Choose Pipeline",
                desc: "Select DiffAb, RFdiffusion, or full pipeline",
                detail: "AI automatically recommends optimal model"
              },
              {
                step: "3",
                title: "Generate",
                desc: "Our AI models create optimized variants",
                detail: "Real-time progress tracking and ETA"
              },
              {
                step: "4",
                title: "Analyze Results",
                desc: "Interactive 3D viewer with quality metrics",
                detail: "Download PDB, sequences, and reports"
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="group"
              >
                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-6 p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 border-l-4 border-transparent hover:border-emerald-500"
                >
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    >
                      {item.step}
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                    <p className="text-lg text-gray-700 mb-1">{item.desc}</p>
                    <p className="text-sm text-gray-500">{item.detail}</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="flex-shrink-0"
                  >
                    <ArrowRight className="w-6 h-6 text-emerald-500" />
                  </motion.div>
                </motion.div>
                {idx < 3 && (
                  <div className="flex justify-center my-2">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.15 + 0.3 }}
                      viewport={{ once: true }}
                      className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent origin-top"
                    />
                  </div>
                )}
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

      {/* --- SECTION 4: OUR STORY --- */}
      <section className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">Our Story</h2>
          <div className="space-y-12">
            {[
              {
                name: "Azamat",
                age: "",
                role: "Bioengineer",
                education: "Studied Bioengineering at KAIST, one of South Korea's top universities",
                color: "bg-blue-500"
              },
              {
                name: "Kanat Tilekov",
                age: "22 years old",
                role: "Software Developer & Data Analyst",
                education: "Studied at Solbridge International School of Business (South Korea) and gained knowledge in Spain",
                color: "bg-purple-500"
              },
              {
                name: "Sarzmuza Issabek",
                age: "21 years old",
                role: "Sales Person & Business Developer",
                education: "Studied at Solbridge University in Korea, later moved to Seoul and worked in car export business",
                color: "bg-orange-500"
              }
            ].map((member) => (
              <div key={member.name} className="flex items-start gap-6 p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold">{member.name} {member.age && <span className="text-gray-400 text-lg">({member.age})</span>}</h3>
                  <p className="text-lg text-gray-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-500">{member.education}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: OUR VISION --- */}
      <section className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">Our Vision</h2>
          <p className="text-2xl text-gray-300 leading-relaxed">
            To democratize protein engineering and make cutting-edge AI tools accessible to researchers worldwide.
            We believe that breakthrough discoveries shouldn't be limited by computational barriers.
          </p>
        </div>
      </section>

      {/* --- SECTION 6: PRICING --- */}
      <PricingSection />

      {/* --- SECTION 7: CONTACT --- */}
      <section id="contact" className="bg-white py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">Get in Touch</h2>
          <p className="text-xl text-gray-600 mb-12">
            Interested in partnering with us or want to learn more? Let's connect!
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://www.linkedin.com/company/foldexa"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="mailto:contact@foldexa.com"
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
