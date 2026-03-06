"use client";

import React from "react";

export function BenchmarkReport() {
    return (
        <div className="benchmark-container overflow-x-auto min-h-screen bg-[#0A0A0A] w-full flex justify-center">
            <style>{`
        .benchmark-wrapper { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0A0A0A;
          color: #E5E5E5;
          width: 1400px; /* Reduced from 2400px to fit standard large screens, or keep layout proportionate */
          min-width: 1200px;
          padding: 72px 40px 56px;
          -webkit-font-smoothing: antialiased;
          margin: 0 auto;
        }

        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 56px; }
        .logo { font-size: 40px; font-weight: 700; color: #FFF; letter-spacing: -0.03em; }
        .logo .g { color: #10B981; }
        .tag { font-size: 18px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #525252; border: 1px solid #262626; border-radius: 999px; padding: 10px 28px; }

        .benchmark-wrapper h1 { font-size: 50px; font-weight: 800; color: #FFF; line-height: 1.2; letter-spacing: -0.03em; margin: 0; padding: 0; }
        .sub { font-size: 24px; color: #525252; margin-top: 10px; margin-bottom: 60px; }

        .sec { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; margin-top: 56px; }
        .sec-d { width: 14px; height: 14px; background: #10B981; border-radius: 50%; box-shadow: 0 0 16px rgba(16,185,129,0.45); }
        .sec-t { font-size: 20px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #737373; }

        /* Charts */
        .cr { display: flex; gap: 20px; width: 100%; }
        .cc {
          flex: 1;
          background: #111;
          border: 1px solid #1C1C1C;
          border-radius: 20px;
          padding: 40px 32px 28px;
          min-width: 0;
        }
        .ct { font-size: 24px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
        .cd { font-size: 16px; color: #404040; margin-bottom: 36px; }

        /* Bar area */
        .ba {
          display: flex;
          align-items: flex-end;
          height: 280px;
          border-bottom: 2px solid #1C1C1C;
          position: relative;
        }
        .ba .gl { position: absolute; left: 0; right: 0; border-top: 1px solid #141414; }
        .bc { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
        .bv { font-size: 20px; font-weight: 700; color: #FFF; margin-bottom: 6px; white-space: nowrap; }
        .bb { width: 64px; border-radius: 6px 6px 0 0; min-height: 4px; }
        .st { color: #10B981; font-size: 18px; margin-bottom: 4px; }

        .g1 { background: #10B981; }
        .g2 { background: rgba(16,185,129,0.35); }
        .gy { background: #2A2A2A; }
        .rd { background: #EF4444; }
        .am { background: #F59E0B; }
        .pu { background: #8B5CF6; }

        .lr { display: flex; margin-top: 14px; }
        .lr .l { flex: 1; font-size: 16px; color: #525252; text-align: center; line-height: 1.4; font-weight: 500; }

        /* Threshold */
        .tb { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 10px; }
        .tb span { font-size: 15px; font-weight: 600; color: rgba(239,68,68,0.5); }
        .tb .ds { width: 60px; border-top: 2px dashed rgba(239,68,68,0.35); }

        /* ddG */
        .dz { border-top: 2px solid #1C1C1C; position: relative; }
        .dz-l { position: absolute; left: 8px; top: -22px; font-size: 15px; color: #333; font-weight: 500; }
        .db { display: flex; height: 220px; }
        .dc { flex: 1; display: flex; flex-direction: column; align-items: center; }
        .dd { width: 64px; border-radius: 0 0 6px 6px; min-height: 4px; }
        .dv { font-size: 20px; font-weight: 700; color: #FFF; margin-top: 8px; white-space: nowrap; }
        .ds2 { color: #10B981; font-size: 16px; margin-top: 2px; }
        .dl { font-size: 16px; color: #525252; text-align: center; line-height: 1.4; margin-top: 10px; font-weight: 500; }

        /* KPI */
        .kr { display: flex; gap: 16px; width: 100%; }
        .k {
          flex: 1;
          border: 1px solid rgba(16,185,129,0.25);
          background: rgba(16,185,129,0.03);
          border-radius: 20px;
          padding: 32px 16px 28px;
          text-align: center;
        }
        .kv {
          font-size: 48px;
          font-weight: 800;
          color: #10B981;
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .kv .u { font-size: 22px; font-weight: 600; color: #10B981; }
        .kl { font-size: 16px; color: #404040; margin-top: 14px; line-height: 1.4; font-weight: 500; }

        /* Pipeline table */
        .pt { width: 100%; border-collapse: collapse; }
        .pt th { font-size: 17px; font-weight: 700; color: #404040; text-align: left; padding: 18px 24px; border-bottom: 2px solid #1C1C1C; text-transform: uppercase; letter-spacing: 0.08em; }
        .pt td { font-size: 20px; color: #737373; padding: 18px 24px; border-bottom: 1px solid #141414; }
        .pt tr.h td { color: #D4D4D4; background: rgba(16,185,129,0.03); }
        .pt .ck { color: #10B981; font-weight: 600; }
        .pt .dm { color: #404040; }

        /* Footer */
        .ft { margin-top: 48px; padding-top: 28px; border-top: 1px solid #1A1A1A; display: flex; justify-content: space-between; align-items: flex-end; }
        .fs { font-size: 15px; color: #2A2A2A; line-height: 1.6; max-width: 78%; }
        .fb { font-size: 36px; font-weight: 800; color: #FFF; letter-spacing: -0.03em; }
        .fb .g { color: #10B981; }
      `}</style>

            <div className="benchmark-wrapper">
                <div className="top-bar">
                    <div className="logo">Foldexa<span className="g">.bio</span></div>
                    <div className="tag">Computational Antibody Design</div>
                </div>

                <h1>Pipeline Benchmark vs. World-Class Platforms</h1>
                <div className="sub">Anti-Tie2 CDR redesign · AF2-multimer predicted metrics · February 2026</div>

                <div className="sec">
                    <div className="sec-d"></div>
                    <div className="sec-t">Core Metrics Comparison</div>
                </div>

                <div className="cr">
                    {/* i_PAE */}
                    <div className="cc">
                        <div className="ct">Interface PAE (i_PAE)</div>
                        <div className="cd">Lower = higher confidence in binding pose</div>
                        <div className="ba">
                            <div className="gl" style={{ top: '30%' }}></div>
                            <div className="gl" style={{ top: '55%' }}></div>
                            <div className="gl" style={{ top: '80%' }}></div>
                            <div className="bc">
                                <div className="st">★</div>
                                <div className="bv">4.54</div>
                                <div className="bb g1" style={{ height: '105px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv">4.62</div>
                                <div className="bb g2" style={{ height: '110px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv">5.75</div>
                                <div className="bb gy" style={{ height: '138px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv" style={{ color: '#EF4444' }}>8.2</div>
                                <div className="bb rd" style={{ height: '200px' }}></div>
                            </div>
                        </div>
                        <div className="lr">
                            <div className="l">Foldexa.bio<br />Best (#1)</div>
                            <div className="l">Foldexa.bio<br />Top-10 avg</div>
                            <div className="l">Reference<br />hTAAB-hTie2</div>
                            <div className="l">Chai-2<br />(median)</div>
                        </div>
                    </div>

                    {/* RMSD */}
                    <div className="cc">
                        <div className="ct">CDR-L1 Backbone RMSD</div>
                        <div className="cd">Angstroms (Å) — lower is better</div>
                        <div className="tb">
                            <span>2 Å filtering threshold</span>
                            <div className="ds"></div>
                        </div>
                        <div className="ba" style={{ position: 'relative' }}>
                            <div className="gl" style={{ top: '30%' }}></div>
                            <div className="gl" style={{ top: '55%' }}></div>
                            <div style={{ position: 'absolute', left: 0, right: 0, top: '8%', borderTop: '2px dashed rgba(239,68,68,0.3)', zIndex: 2, pointerEvents: 'none' }}></div>
                            <div className="bc">
                                <div className="st">★</div>
                                <div className="bv">0.179</div>
                                <div className="bb g1" style={{ height: '16px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv">0.37</div>
                                <div className="bb g2" style={{ height: '34px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv">0.81</div>
                                <div className="bb gy" style={{ height: '76px' }}></div>
                            </div>
                            <div className="bc">
                                <div className="bv" style={{ color: '#8B5CF6' }}>~1.5</div>
                                <div className="bb pu" style={{ height: '140px' }}></div>
                            </div>
                        </div>
                        <div className="lr">
                            <div className="l">Foldexa.bio<br />Best (#1)</div>
                            <div className="l">Foldexa.bio<br />Top-10 avg</div>
                            <div className="l">Reference<br />hTAAB-hTie2</div>
                            <div className="l">DiffAb<br />(scRMSD)</div>
                        </div>
                    </div>

                    {/* ddG */}
                    <div className="cc">
                        <div className="ct">Binding Free Energy (Rosetta ddG)</div>
                        <div className="cd">kcal/mol — more negative = stronger binding</div>
                        <div className="dz">
                            <span className="dz-l">0 kcal/mol</span>
                        </div>
                        <div className="db">
                            <div className="dc">
                                <div className="dd g1" style={{ height: '176px' }}></div>
                                <div className="dv">−25.75</div>
                                <div className="ds2">★</div>
                                <div className="dl">Foldexa.bio<br />Best (#4)</div>
                            </div>
                            <div className="dc">
                                <div className="dd g2" style={{ height: '160px' }}></div>
                                <div className="dv">−23.52</div>
                                <div className="dl">Foldexa.bio<br />Top-10 avg</div>
                            </div>
                            <div className="dc">
                                <div className="dd gy" style={{ height: '104px' }}></div>
                                <div className="dv">−15.00</div>
                                <div className="dl">RFdiffusion<br />(Bennett)</div>
                            </div>
                            <div className="dc">
                                <div className="dd am" style={{ height: '4px' }}></div>
                                <div className="dv" style={{ color: '#F59E0B' }}>0.00</div>
                                <div className="dl">Reference<br />hTAAB-hTie2</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* KPIs */}
                <div className="sec">
                    <div className="sec-d"></div>
                    <div className="sec-t">Key Performance Indicators</div>
                </div>

                <div className="kr">
                    <div className="k">
                        <div className="kv">100<span className="u">%</span></div>
                        <div className="kl">Hit rate<br />(10/10 designs passed)</div>
                    </div>
                    <div className="k">
                        <div className="kv">0.179<span className="u"> Å</span></div>
                        <div className="kl">Best RMSD<br />(near-native)</div>
                    </div>
                    <div className="k">
                        <div className="kv">−25.75</div>
                        <div className="kl">Best ddG<br />(kcal/mol)</div>
                    </div>
                    <div className="k">
                        <div className="kv">4.54</div>
                        <div className="kl">Best i_PAE<br />(interface confidence)</div>
                    </div>
                    <div className="k">
                        <div className="kv">0.96</div>
                        <div className="kl">pLDDT<br />(structure quality)</div>
                    </div>
                </div>

                {/* Pipeline */}
                <div className="sec">
                    <div className="sec-d"></div>
                    <div className="sec-t">Pipeline Feature Comparison</div>
                </div>

                <table className="pt">
                    <thead>
                        <tr>
                            <th style={{ width: '22%' }}>Feature</th>
                            <th style={{ width: '19.5%' }}>Foldexa.bio</th>
                            <th style={{ width: '19.5%' }}>RFdiffusion</th>
                            <th style={{ width: '19.5%' }}>DiffAb</th>
                            <th style={{ width: '19.5%' }}>Chai-2</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="h"><td>CDR redesign</td><td className="ck">✓ All CDRs</td><td>✓</td><td>✓</td><td className="dm">— (structure only)</td></tr>
                        <tr className="h"><td>Hit rate</td><td className="ck">100% (10/10)</td><td>~30–60%</td><td>~25%</td><td className="dm">N/A</td></tr>
                        <tr className="h"><td>Structural validation</td><td className="ck">AF2-multimer</td><td>AF2 / ESMFold</td><td>RMSD only</td><td>Built-in</td></tr>
                        <tr className="h"><td>Binding energy scoring</td><td className="ck">Rosetta ddG</td><td>Rosetta / PyRosetta</td><td className="dm">—</td><td className="dm">—</td></tr>
                        <tr className="h"><td>End-to-end pipeline</td><td className="ck">✓ Automated</td><td className="dm">Manual assembly</td><td className="dm">Manual</td><td className="dm">Inference only</td></tr>
                    </tbody>
                </table>

                <div className="ft">
                    <div className="fs">
                        <strong style={{ color: '#333' }}>Sources:</strong> Bennett et al., <em>Nature</em> (2025); Luo et al., <em>ICML</em> (2022); Chai Discovery, <em>bioRxiv</em> (2025); Jin et al., <em>Nat. Commun.</em> (2021)<br />
                        Note: Foldexa.bio metrics from AF2-multimer predictions. Cross-platform metrics not directly comparable.
                    </div>
                    <div className="fb">Foldexa<span className="g">.bio</span></div>
                </div>
            </div>
        </div>
    );
}
