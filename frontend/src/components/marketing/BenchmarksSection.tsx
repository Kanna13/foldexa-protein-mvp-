"use client";

import { motion } from "framer-motion";
import React from 'react';

export function BenchmarksSection() {
    return (
        <section className="bg-[#0A0A0A] text-[#E5E5E5] py-32 font-sans w-full overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Header */}
                <div className="mb-20">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-16 border-b border-[#262626] pb-8">
                        <div className="flex items-center gap-1 text-[40px] font-bold tracking-tight text-white mb-6 md:mb-0">
                            Foldexa<span className="text-[#10B981]">.bio</span>
                        </div>
                        <div className="hidden md:block px-7 py-2.5 border border-[#262626] rounded-full text-[#525252] text-lg font-semibold tracking-[0.12em] uppercase">
                            Computational Antibody Design
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-[50px] font-extrabold tracking-tight text-white mb-4 leading-[1.2]">
                        Pipeline Benchmark vs.<br className="hidden md:block" /> World-Class Platforms
                    </h2>
                    <p className="text-2xl text-[#525252] mt-2.5 mb-16">
                        Anti-Tie2 CDR redesign · AF2-multimer predicted metrics · February 2026
                    </p>
                </div>

                {/* Section Title 1 */}
                <div className="flex items-center gap-4 mb-7 mt-14">
                    <div className="w-3.5 h-3.5 bg-[#10B981] rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-xl font-bold tracking-[0.12em] uppercase text-[#737373]">Core Metrics Comparison</h3>
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-3 gap-5 mb-24 w-full">

                    {/* Chart 1: i_PAE */}
                    <div className="bg-[#111] border border-[#1C1C1C] rounded-[20px] p-5 md:p-10 pb-7 flex flex-col">
                        <h4 className="text-xl md:text-2xl font-bold mb-1 text-white">Interface PAE (i_PAE)</h4>
                        <p className="text-[#404040] mb-9 text-xs md:text-base">Lower = higher confidence in binding pose</p>

                        <div className="flex-1 flex items-end h-[280px] border-b-2 border-[#1C1C1C] relative">
                            {/* Grid Lines */}
                            <div className="absolute left-0 right-0 top-[30%] border-t border-[#141414]" />
                            <div className="absolute left-0 right-0 top-[55%] border-t border-[#141414]" />
                            <div className="absolute left-0 right-0 top-[80%] border-t border-[#141414]" />

                            {/* Bars */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-[#10B981] text-sm md:text-lg mb-1">★</span>
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">4.54</span>
                                <div className="w-9 md:w-16 bg-[#10B981] rounded-t-md h-[105px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Foldexa.bio<br />Best (#1)</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">4.62</span>
                                <div className="w-9 md:w-16 bg-[rgba(16,185,129,0.35)] rounded-t-md h-[110px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Foldexa.bio<br />Top-10 avg</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">5.75</span>
                                <div className="w-9 md:w-16 bg-[#2A2A2A] rounded-t-md h-[138px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Reference<br />hTAAB-hTie2</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-[#EF4444]">8.2</span>
                                <div className="w-9 md:w-16 bg-[#EF4444] rounded-t-md h-[200px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Chai-2<br />(median)</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart 2: RMSD */}
                    <div className="bg-[#111] border border-[#1C1C1C] rounded-[20px] p-5 md:p-10 pb-7 flex flex-col">
                        <h4 className="text-xl md:text-2xl font-bold mb-1 text-white">CDR-L1 Backbone RMSD</h4>
                        <p className="text-[#404040] mb-4 text-xs md:text-base">Angstroms (Å) — lower is better</p>
                        <div className="flex items-center justify-end gap-3 mb-2.5">
                            <span className="text-[rgba(239,68,68,0.5)] text-xs md:text-[15px] font-semibold">2 Å filtering threshold</span>
                            <div className="w-[40px] md:w-[60px] border-t-2 border-dashed border-[rgba(239,68,68,0.35)]" />
                        </div>

                        <div className="flex-1 flex items-end h-[280px] border-b-2 border-[#1C1C1C] relative">
                            {/* Grid Lines */}
                            <div className="absolute left-0 right-0 top-[30%] border-t border-[#141414]" />
                            <div className="absolute left-0 right-0 top-[55%] border-t border-[#141414]" />
                            {/* Threshold Line */}
                            <div className="absolute left-0 right-0 top-[8%] border-t-2 border-dashed border-[rgba(239,68,68,0.3)] w-full pointer-events-none z-0" />

                            {/* Bars */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-[#10B981] text-sm md:text-lg mb-1">★</span>
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">0.179</span>
                                <div className="w-9 md:w-16 bg-[#10B981] rounded-t-md h-[16px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Foldexa.bio<br />Best (#1)</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">0.37</span>
                                <div className="w-9 md:w-16 bg-[rgba(16,185,129,0.35)] rounded-t-md h-[34px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Foldexa.bio<br />Top-10 avg</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-white">0.81</span>
                                <div className="w-9 md:w-16 bg-[#2A2A2A] rounded-t-md h-[76px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">Reference<br />hTAAB-hTie2</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-sm md:text-xl font-bold mb-1.5 text-[#8B5CF6]">~1.5</span>
                                <div className="w-9 md:w-16 bg-[#8B5CF6] rounded-t-md h-[140px]" />
                                <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-3.5 font-medium leading-[1.4]">DiffAb<br />(scRMSD)</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart 3: ddG (Negative Values) */}
                    <div className="bg-[#111] border border-[#1C1C1C] rounded-[20px] p-5 md:p-10 pb-7 flex flex-col">
                        <h4 className="text-xl md:text-2xl font-bold mb-1 text-white">Binding Free Energy (Rosetta ddG)</h4>
                        <p className="text-[#404040] mb-9 text-xs md:text-base">kcal/mol — more negative = stronger binding</p>

                        <div className="border-t-2 border-[#1C1C1C] relative mt-2">
                            <span className="absolute left-2 -top-6 text-xs md:text-[15px] font-medium text-[#333]">0 kcal/mol</span>

                            <div className="flex h-[220px]">

                                {/* Bar 1 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-9 md:w-16 bg-[#10B981] rounded-b-md h-[176px]" />
                                    <span className="text-sm md:text-xl font-bold mt-2 text-white">−25.75</span>
                                    <span className="text-[#10B981] text-sm md:text-base mt-0.5">★</span>
                                    <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-2.5 font-medium leading-[1.4]">Foldexa.bio<br />Best (#4)</p>
                                </div>

                                {/* Bar 2 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-9 md:w-16 bg-[rgba(16,185,129,0.35)] rounded-b-md h-[160px]" />
                                    <span className="text-sm md:text-xl font-bold mt-2 text-white">−23.52</span>
                                    <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-2.5 font-medium leading-[1.4]">Foldexa.bio<br />Top-10 avg</p>
                                </div>

                                {/* Bar 3 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-9 md:w-16 bg-[#2A2A2A] rounded-b-md h-[104px]" />
                                    <span className="text-sm md:text-xl font-bold mt-2 text-white">−15.00</span>
                                    <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-2.5 font-medium leading-[1.4]">RFdiffusion<br />(Bennett)</p>
                                </div>

                                {/* Bar 4 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-9 md:w-16 bg-[#F59E0B] rounded-b-md h-[4px]" />
                                    <span className="text-sm md:text-xl font-bold mt-2 text-[#F59E0B]">0.00</span>
                                    <p className="text-[10px] md:text-sm text-center text-[#525252] mt-2 md:mt-2.5 font-medium leading-[1.4]">Reference<br />hTAAB-hTie2</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title 2 - KPI */}
                <div className="flex items-center gap-4 mb-7 mt-14">
                    <div className="w-3.5 h-3.5 bg-[#10B981] rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-xl font-bold tracking-[0.12em] uppercase text-[#737373]">Key Performance Indicators</h3>
                </div>

                {/* KPI Grid */}
                <div className="grid md:grid-cols-5 gap-4 mb-24 w-full">
                    {[
                        { value: "100", unit: "%", label: "Hit rate", sub: "(10/10 designs passed)" },
                        { value: "0.179", unit: " Å", label: "Best RMSD", sub: "(near-native)" },
                        { value: "−25.75", unit: "", label: "Best ddG", sub: "(kcal/mol)" },
                        { value: "4.54", unit: "", label: "Best i_PAE", sub: "(interface confidence)" },
                        { value: "0.96", unit: "", label: "pLDDT", sub: "(structure quality)" },
                    ].map((kpi, idx) => (
                        <div key={idx} className="bg-[rgba(16,185,129,0.03)] border border-[rgba(16,185,129,0.25)] rounded-[20px] p-8 pb-7 text-center">
                            <div className="text-[48px] font-extrabold text-[#10B981] tracking-[-0.03em] leading-none mb-3.5">
                                {kpi.value}<span className="text-[22px] font-semibold">{kpi.unit}</span>
                            </div>
                            <div className="text-base font-medium text-[#404040] leading-[1.4]">
                                {kpi.label}<br /><span className="text-base font-normal">{kpi.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section Title 3 - Pipeline */}
                <div className="flex items-center gap-4 mb-7 mt-14">
                    <div className="w-3.5 h-3.5 bg-[#10B981] rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-xl font-bold tracking-[0.12em] uppercase text-[#737373]">Pipeline Feature Comparison</h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mb-20">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="text-left py-[18px] px-6 text-[#404040] uppercase text-[17px] font-bold tracking-[0.08em] border-b-2 border-[#1C1C1C] w-[22%]">Feature</th>
                                <th className="text-left py-[18px] px-6 text-[#10B981] uppercase text-[17px] font-bold tracking-[0.08em] border-b-2 border-[#1C1C1C] w-[19.5%]">Foldexa.bio</th>
                                <th className="text-left py-[18px] px-6 text-[#404040] uppercase text-[17px] font-bold tracking-[0.08em] border-b-2 border-[#1C1C1C] w-[19.5%]">RFdiffusion</th>
                                <th className="text-left py-[18px] px-6 text-[#404040] uppercase text-[17px] font-bold tracking-[0.08em] border-b-2 border-[#1C1C1C] w-[19.5%]">DiffAb</th>
                                <th className="text-left py-[18px] px-6 text-[#404040] uppercase text-[17px] font-bold tracking-[0.08em] border-b-2 border-[#1C1C1C] w-[19.5%]">Chai-2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                {
                                    feat: "CDR redesign",
                                    col1: "✓ All CDRs", col1_hl: true,
                                    col2: "✓",
                                    col3: "✓",
                                    col4: "— (structure only)"
                                },
                                {
                                    feat: "Hit rate",
                                    col1: "100% (10/10)", col1_hl: true,
                                    col2: "~30–60%",
                                    col3: "~25%",
                                    col4: "N/A"
                                },
                                {
                                    feat: "Structural validation",
                                    col1: "AF2-multimer", col1_hl: true,
                                    col2: "AF2 / ESMFold",
                                    col3: "RMSD only",
                                    col4: "Built-in"
                                },
                                {
                                    feat: "Binding energy scoring",
                                    col1: "Rosetta ddG", col1_hl: true,
                                    col2: "Rosetta / PyRosetta",
                                    col3: "—",
                                    col4: "—"
                                },
                                {
                                    feat: "End-to-end pipeline",
                                    col1: "✓ Automated", col1_hl: true,
                                    col2: "Manual assembly",
                                    col3: "Manual",
                                    col4: "Inference only"
                                },
                            ].map((row, idx) => (
                                <tr key={idx} className="group hover:bg-[rgba(16,185,129,0.03)] transition-colors">
                                    <td className="py-[18px] px-6 border-b border-[#141414] text-[#D4D4D4] bg-[rgba(16,185,129,0.03)] text-[20px]">{row.feat}</td>
                                    <td className={`py-[18px] px-6 border-b border-[#141414] text-[20px] font-semibold ${row.col1_hl ? 'text-[#10B981]' : 'text-[#737373]'}`}>{row.col1}</td>
                                    <td className="py-[18px] px-6 border-b border-[#141414] text-[#737373] text-[20px]">{row.col2}</td>
                                    <td className="py-[18px] px-6 border-b border-[#141414] text-[#737373] text-[20px]">{row.col3}</td>
                                    <td className="py-[18px] px-6 border-b border-[#141414] text-[#737373] text-[20px]">{row.col4}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detailed Footer */}
                <div className="pt-7 border-t border-[#1A1A1A] flex flex-col md:flex-row justify-between items-end gap-8 mt-12">
                    <div className="text-[15px] text-[#2A2A2A] md:max-w-[78%] leading-[1.6]">
                        <strong className="text-[#333]">Sources:</strong> Bennett et al., <em>Nature</em> (2025); Luo et al., <em>ICML</em> (2022); Chai Discovery, <em>bioRxiv</em> (2025); Jin et al., <em>Nat. Commun.</em> (2021)<br />
                        Note: Foldexa.bio metrics from AF2-multimer predictions. Cross-platform metrics not directly comparable.
                    </div>
                    <div className="text-[36px] font-extrabold tracking-tight text-white">
                        Foldexa<span className="text-[#10B981]">.bio</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
