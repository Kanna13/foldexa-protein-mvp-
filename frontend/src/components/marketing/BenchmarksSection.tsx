"use client";

import { motion } from "framer-motion";
import React from 'react';

export function BenchmarksSection() {
    return (
        <section className="bg-[#0A0A0A] text-white py-32 font-sans w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-16 border-b border-neutral-800 pb-8">
                        <div className="flex items-center gap-1 text-4xl font-bold tracking-tight">
                            Foldexa<span className="text-emerald-500">.bio</span>
                        </div>
                        <div className="hidden md:block px-6 py-2 border border-neutral-800 rounded-full text-neutral-500 text-sm font-semibold tracking-widest uppercase">
                            Computational Antibody Design
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-[1.1]">
                        Pipeline Benchmark vs.<br className="hidden md:block" /> World-Class Platforms
                    </h2>
                    <p className="text-xl text-neutral-500 font-medium">
                        Anti-Tie2 CDR redesign · AF2-multimer predicted metrics · February 2026
                    </p>
                </div>

                {/* Section Title 1 */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-lg md:text-xl font-bold tracking-widest uppercase text-neutral-400">Core Metrics Comparison</h3>
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-3 gap-6 mb-24">

                    {/* Chart 1: i_PAE */}
                    <div className="bg-[#111] border border-neutral-800 rounded-3xl p-8 flex flex-col">
                        <h4 className="text-2xl font-bold mb-1">Interface PAE (i_PAE)</h4>
                        <p className="text-neutral-500 mb-8 text-sm">Lower = higher confidence in binding pose</p>

                        <div className="flex-1 flex items-end h-[280px] border-b-2 border-neutral-800 relative">
                            {/* Grid Lines */}
                            <div className="absolute left-0 right-0 top-[30%] border-t border-neutral-900" />
                            <div className="absolute left-0 right-0 top-[55%] border-t border-neutral-900" />
                            <div className="absolute left-0 right-0 top-[80%] border-t border-neutral-900" />

                            {/* Bars */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-emerald-500 text-lg mb-1">★</span>
                                <span className="text-xl font-bold mb-1.5">4.54</span>
                                <div className="w-12 md:w-16 bg-emerald-500 rounded-t-md h-[105px] group-hover:bg-emerald-400 transition-colors" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Foldexa.bio<br />Best (#1)</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5">4.62</span>
                                <div className="w-12 md:w-16 bg-emerald-500/35 rounded-t-md h-[110px] group-hover:bg-emerald-500/50 transition-colors" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Foldexa.bio<br />Top-10 avg</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5">5.75</span>
                                <div className="w-12 md:w-16 bg-neutral-800 rounded-t-md h-[138px]" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Reference<br />hTAAB</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5 text-red-500">8.2</span>
                                <div className="w-12 md:w-16 bg-red-500 rounded-t-md h-[200px]" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Chai-2<br />(median)</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart 2: RMSD */}
                    <div className="bg-[#111] border border-neutral-800 rounded-3xl p-8 flex flex-col">
                        <h4 className="text-2xl font-bold mb-1">CDR-L1 Backbone RMSD</h4>
                        <p className="text-neutral-500 mb-4 text-sm">Angstroms (Å) — lower is better</p>
                        <div className="flex items-center justify-end gap-3 mb-2">
                            <span className="text-red-500/50 text-xs font-bold uppercase tracking-wider">2 Å Threshold</span>
                            <div className="w-12 border-t-2 border-dashed border-red-500/30" />
                        </div>

                        <div className="flex-1 flex items-end h-[280px] border-b-2 border-neutral-800 relative">
                            {/* Grid Lines */}
                            <div className="absolute left-0 right-0 top-[30%] border-t border-neutral-900" />
                            <div className="absolute left-0 right-0 top-[55%] border-t border-neutral-900" />
                            {/* Threshold Line */}
                            <div className="absolute left-0 right-0 top-[8%] border-t-2 border-dashed border-red-500/30 pointer-events-none z-0" />

                            {/* Bars */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-emerald-500 text-lg mb-1">★</span>
                                <span className="text-xl font-bold mb-1.5">0.179</span>
                                <div className="w-12 md:w-16 bg-emerald-500 rounded-t-md h-[16px] group-hover:bg-emerald-400 transition-colors" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Foldexa.bio<br />Best (#1)</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5">0.37</span>
                                <div className="w-12 md:w-16 bg-emerald-500/35 rounded-t-md h-[34px] group-hover:bg-emerald-500/50 transition-colors" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Foldexa.bio<br />Top-10 avg</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5">0.81</span>
                                <div className="w-12 md:w-16 bg-neutral-800 rounded-t-md h-[76px]" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">Reference<br />hTAAB</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end h-full z-10 w-full group">
                                <span className="text-xl font-bold mb-1.5 text-purple-500">~1.5</span>
                                <div className="w-12 md:w-16 bg-purple-500 rounded-t-md h-[140px]" />
                                <p className="text-xs text-center text-neutral-500 mt-4 font-medium leading-tight">DiffAb<br />(scRMSD)</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart 3: ddG (Negative Values) */}
                    <div className="bg-[#111] border border-neutral-800 rounded-3xl p-8 flex flex-col">
                        <h4 className="text-2xl font-bold mb-1">Binding Free Energy</h4>
                        <p className="text-neutral-500 mb-8 text-sm">kcal/mol — more negative = stronger</p>

                        <div className="border-t-2 border-neutral-800 relative mt-8">
                            <span className="absolute left-2 -top-6 text-sm font-medium text-neutral-400">0 kcal/mol</span>

                            <div className="flex h-[220px]">

                                {/* Bar 1 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-12 md:w-16 bg-emerald-500 rounded-b-md h-[176px] group-hover:bg-emerald-400 transition-colors" />
                                    <span className="text-xl font-bold mt-2">−25.75</span>
                                    <span className="text-emerald-500 text-lg mt-0.5">★</span>
                                    <p className="text-xs text-center text-neutral-500 mt-2 font-medium leading-tight">Foldexa.bio<br />Best (#4)</p>
                                </div>

                                {/* Bar 2 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-12 md:w-16 bg-emerald-500/35 rounded-b-md h-[160px] group-hover:bg-emerald-500/50 transition-colors" />
                                    <span className="text-xl font-bold mt-2">−23.52</span>
                                    <p className="text-xs text-center text-neutral-500 mt-2 font-medium leading-tight">Foldexa<br />Top-10 avg</p>
                                </div>

                                {/* Bar 3 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-12 md:w-16 bg-neutral-800 rounded-b-md h-[104px]" />
                                    <span className="text-xl font-bold mt-2">−15.00</span>
                                    <p className="text-xs text-center text-neutral-500 mt-2 font-medium leading-tight">RFdiffusion<br />(Bennett)</p>
                                </div>

                                {/* Bar 4 */}
                                <div className="flex-1 flex flex-col items-center w-full group">
                                    <div className="w-12 md:w-16 bg-amber-500 rounded-b-md h-[4px]" />
                                    <span className="text-xl font-bold mt-2 text-amber-500">0.00</span>
                                    <p className="text-xs text-center text-neutral-500 mt-2 font-medium leading-tight">Reference<br />hTAAB</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title 2 - KPI */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-lg md:text-xl font-bold tracking-widest uppercase text-neutral-400">Key Performance Indicators</h3>
                </div>

                {/* KPI Grid */}
                <div className="grid md:grid-cols-5 gap-4 mb-24">
                    {[
                        { value: "100", unit: "%", label: "Hit rate", sub: "(10/10 designs passed)" },
                        { value: "0.179", unit: " Å", label: "Best RMSD", sub: "(near-native)" },
                        { value: "−25.75", unit: "", label: "Best ddG", sub: "(kcal/mol)" },
                        { value: "4.54", unit: "", label: "Best i_PAE", sub: "(interface confidence)" },
                        { value: "0.96", unit: "", label: "pLDDT", sub: "(structure quality)" },
                    ].map((kpi, idx) => (
                        <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 text-center bg-[#111]">
                            <div className="text-5xl font-extrabold text-emerald-500 tracking-tight leading-none mb-4">
                                {kpi.value}<span className="text-2xl font-semibold">{kpi.unit}</span>
                            </div>
                            <div className="text-sm font-medium text-neutral-400 leading-snug">
                                {kpi.label}<br /><span className="text-neutral-500 font-normal">{kpi.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section Title 3 - Pipeline */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.45)]" />
                    <h3 className="text-lg md:text-xl font-bold tracking-widest uppercase text-neutral-400">Pipeline Feature Comparison</h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mb-20">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="text-left py-6 px-6 text-neutral-400 uppercase text-sm font-bold tracking-wider border-b-2 border-neutral-800 w-[22%]">Feature</th>
                                <th className="text-left py-6 px-6 text-emerald-500 uppercase text-sm font-bold tracking-wider border-b-2 border-neutral-800 w-[19.5%]">Foldexa.bio</th>
                                <th className="text-left py-6 px-6 text-neutral-400 uppercase text-sm font-bold tracking-wider border-b-2 border-neutral-800 w-[19.5%]">RFdiffusion</th>
                                <th className="text-left py-6 px-6 text-neutral-400 uppercase text-sm font-bold tracking-wider border-b-2 border-neutral-800 w-[19.5%]">DiffAb</th>
                                <th className="text-left py-6 px-6 text-neutral-400 uppercase text-sm font-bold tracking-wider border-b-2 border-neutral-800 w-[19.5%]">Chai-2</th>
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
                                <tr key={idx} className="group hover:bg-neutral-900/50 transition-colors">
                                    <td className="py-6 px-6 border-b border-neutral-800 text-neutral-300 bg-emerald-500/5 text-lg font-medium">{row.feat}</td>
                                    <td className={`py-6 px-6 border-b border-neutral-800 text-lg font-bold ${row.col1_hl ? 'text-emerald-500' : 'text-neutral-400'}`}>{row.col1}</td>
                                    <td className="py-6 px-6 border-b border-neutral-800 text-neutral-400 text-lg">{row.col2}</td>
                                    <td className="py-6 px-6 border-b border-neutral-800 text-neutral-400 text-lg">{row.col3 === '—' ? <span className="text-neutral-600">—</span> : row.col3}</td>
                                    <td className="py-6 px-6 border-b border-neutral-800 text-neutral-400 text-lg">{row.col4.startsWith('—') ? <span className="text-neutral-600">{row.col4}</span> : row.col4}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detailed Footer */}
                <div className="pt-12 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="text-sm text-neutral-500 md:max-w-[70%] leading-relaxed">
                        <strong className="text-neutral-300">Sources:</strong> Bennett et al., <em>Nature</em> (2025); Luo et al., <em>ICML</em> (2022); Chai Discovery, <em>bioRxiv</em> (2025); Jin et al., <em>Nat. Commun.</em> (2021)<br className="mt-2 block" />
                        Note: Foldexa.bio metrics from AF2-multimer predictions. Cross-platform metrics not directly comparable due to methodology differences.
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight">
                        Foldexa<span className="text-emerald-500">.bio</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
