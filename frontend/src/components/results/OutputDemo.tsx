"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";

// Define the design data
const designs = [
    { id: 'design_001', aar: 0.847, rmsd: 1.18, plddt: 86.3, dg: -9.4, sid: '72.4%', cdrh3: 'ARDYWGQGTLVTVSS', cdrl1: 'RASQDISNYLN', cdrl3: 'QQGNTLPWT', full: 'EVQLVESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_002', aar: 0.821, rmsd: 1.43, plddt: 83.1, dg: -8.9, sid: '68.1%', cdrh3: 'AREGYGSYFDY', cdrl1: 'RSSQSLLHSNGYTYLN', cdrl3: 'MQSLQTPYT', full: 'QVQLVQSGAEVKKPGASVKVSCKASGYTFTSYGISWVRQAPGQGLEWMGWISAYNGNTNYAQKLQGRVTMTTDTSTSTAYMELRSLRSDDTAVYYCAR' },
    { id: 'design_003', aar: 0.809, rmsd: 1.67, plddt: 81.7, dg: -8.6, sid: '65.3%', cdrh3: 'ARRGYYYYGMDV', cdrl1: 'KASQNVGSNVA', cdrl3: 'QQYSSYPYT', full: 'EVQLVESGGGLVQPGGSLRLSCAASGFTFSDYYMSWIRQAPGKGLEWVGYISSSGSTIYYADSVKGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_004', aar: 0.798, rmsd: 1.81, plddt: 80.2, dg: -8.3, sid: '63.7%', cdrh3: 'ARDLYTGYDY', cdrl1: 'RSSQSLVHSNGNTYLH', cdrl3: 'MQSLEFPYT', full: 'QVQLQESGPGLVKPSETLSLTCTVSGGSISSGYYYWSWIRQPPGKGLEWIGYIYYSGSTYYNPSLKSRVTISVDTSKNQFSLKLSSVTAADTAVYYCAR' },
    { id: 'design_005', aar: 0.784, rmsd: 1.99, plddt: 78.9, dg: -8.0, sid: '61.2%', cdrh3: 'ARSHYYYYMDV', cdrl1: 'KSSQSVLYSSNNKNYLA', cdrl3: 'AWDSSL', full: 'EVQLVESGGGLVQPGGSLRLSCAASGFTFSSYWMSWVRQAPGKGLEWVANIKQDGSEKYYVDSVKGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_006', aar: 0.771, rmsd: 2.14, plddt: 77.4, dg: -7.8, sid: '59.8%', cdrh3: 'AREGLWFYFDY', cdrl1: 'RSSQSLENSYGNTFLE', cdrl3: 'FQGSHVPWT', full: 'QVQLVQSGAEVKKPGASVKVSCKASGYTFTGYYMHWVRQAPGQGLEWVGLINPYNGNTSYNQKFQGRVTMTRDTSTSTVYMELSSLRSEDTAVYYCAR' },
    { id: 'design_007', aar: 0.756, rmsd: 2.31, plddt: 75.8, dg: -7.5, sid: '57.3%', cdrh3: 'ARDPYYGSSGDY', cdrl1: 'RASQDISNYLN', cdrl3: 'QQGNTLPWT', full: 'EVQLVESGGGLVQPGGSLRLSCAASGFTFSSYGISWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_008', aar: 0.742, rmsd: 2.48, plddt: 74.1, dg: -7.3, sid: '55.9%', cdrh3: 'ARSGYYDS', cdrl1: 'KASQNVGSNVA', cdrl3: 'QQYSSYPLT', full: 'QVQLVESGGGLVQPGGSLRLSCAASGFTFSDYYMSWIRQAPGKGLEWVGYISSSGSTIYYADSVKGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_009', aar: 0.729, rmsd: 2.63, plddt: 72.5, dg: -7.1, sid: '54.1%', cdrh3: 'ARWGYYGNFDY', cdrl1: 'RSSQSLVHSNG', cdrl3: 'MQGTHFPHT', full: 'EVQLVESGGG LVQPGGSLRLSCAASGFTFSSYWMSWVRQAPGKGLEWVANIKQDGSEKYYVDSVKGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAR' },
    { id: 'design_010', aar: 0.714, rmsd: 2.82, plddt: 70.3, dg: -6.8, sid: '52.6%', cdrh3: 'ARDGTTMVRGVDY', cdrl1: 'RSSQSLENSYG', cdrl3: 'FQASHVPWT', full: 'QVQLVQSGAEVKKPGASVKVSCKASGYTFTGYYMHWVRQAPGQGLEWMGWISAYNGNTNYAQKLQGRVTMTTDTSTSTAYMELRSLRSEDTAVYYCAR' },
];

const hydro = new Set(['A', 'V', 'I', 'L', 'M', 'F', 'W', 'P']);
const polar = new Set(['S', 'T', 'C', 'Y', 'N', 'Q']);
const pos = new Set(['K', 'R', 'H']);
const neg = new Set(['D', 'E']);

function getAaColorClass(aa: string) {
    if (hydro.has(aa)) return 't-hydro';
    if (polar.has(aa)) return 't-polar';
    if (pos.has(aa)) return 't-pos';
    if (neg.has(aa)) return 't-neg';
    return 't-gly';
}

function ColoredSequence({ seq }: { seq: string }) {
    return (
        <>
            {seq.split('').map((aa, i) => (
                <span key={i} className={`aa ${getAaColorClass(aa)}`}>{aa}</span>
            ))}
        </>
    );
}

export function OutputDemo() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [currentTab, setCurrentTab] = useState<'cdr' | 'full'>('cdr');
    const [curStyle, setCurStyle] = useState('cartoon');
    const [spinning, setSpinning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [is3DmolLoaded, setIs3DmolLoaded] = useState(false);
    const [loadingMol, setLoadingMol] = useState(false);

    // References for the 3Dmol viewer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewerRef = useRef<any>(null);
    const spinRAFRef = useRef<number | null>(null);

    const activeDesign = designs[activeIdx];
    const filteredDesigns = designs.filter(d => d.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const applyStyle = useCallback((style: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!viewerRef.current || !(window as any).$3Dmol) return;
        const viewer = viewerRef.current;

        viewer.setStyle({}, {});
        if (style === 'cartoon') {
            viewer.setStyle({ chain: 'H' }, { cartoon: { color: '#2ecc8e' } });
            viewer.setStyle({ chain: 'L' }, { cartoon: { color: '#3bc4e8' } });
            viewer.setStyle({ chain: 'A' }, { cartoon: { color: '#f0a830' } });
            viewer.setStyle({ chain: 'B' }, { cartoon: { color: '#a78bfa' } });
        } else if (style === 'stick') {
            viewer.setStyle({}, { stick: { colorscheme: 'greenCarbon', radius: 0.12 } });
        } else if (style === 'sphere') {
            viewer.setStyle({}, { sphere: { colorscheme: 'Jmol', scale: 0.35 } });
        } else if (style === 'surface') {
            viewer.setStyle({ chain: 'H' }, { cartoon: { color: '#2ecc8e', opacity: 0.5 } });
            viewer.setStyle({ chain: 'L' }, { cartoon: { color: '#3bc4e8', opacity: 0.5 } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            viewer.addSurface((window as any).$3Dmol.SurfaceType.VDW, { opacity: 0.5, colorscheme: { gradient: 'rwb' } });
        }
        viewer.render();
    }, []);

    const loadPDB = useCallback((id: string) => {
        if (!viewerRef.current) return;
        setLoadingMol(true);
        viewerRef.current.clear();

        if (curStyle === 'surface') {
            try { viewerRef.current.removeAllSurfaces(); } catch (e) { /* ignore */ }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).$3Dmol.download(`pdb:${id}`, viewerRef.current, {}, () => {
            applyStyle(curStyle);
            viewerRef.current.zoomTo();
            viewerRef.current.render();
            setLoadingMol(false);
        });
    }, [applyStyle, curStyle]);

    const initViewer = useCallback(() => {
        const molDiv = document.getElementById('mol-viewer');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!molDiv || !(window as any).$3Dmol) return;

        // Fixed absolute pixel values for Next.js to avoid collapsing
        molDiv.style.height = '100%';
        molDiv.style.width = '100%';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        viewerRef.current = (window as any).$3Dmol.createViewer(molDiv, {
            backgroundColor: '0x050810',
            antialias: true,
        });
        loadPDB('7FAE');
    }, [loadPDB]);

    const setStyle = (style: string) => {
        if (style !== 'surface' && curStyle === 'surface') {
            try { viewerRef.current.removeAllSurfaces(); } catch (e) { /* ignore */ }
        }
        setCurStyle(style);
    };

    const resetCam = () => {
        if (viewerRef.current) {
            viewerRef.current.zoomTo();
            viewerRef.current.render();
        }
    };

    const copySeq = () => {
        const d = designs[activeIdx];
        const txt = currentTab === 'cdr'
            ? `CDR-H3: ${d.cdrh3}\nCDR-L1: ${d.cdrl1}\nCDR-L3: ${d.cdrl3}`
            : d.full;
        navigator.clipboard.writeText(txt);
    };

    // Setup 3DMol when script is loaded or component mounts
    useEffect(() => {
        if (!is3DmolLoaded) return;

        // We give a small timeout to let the DOM calculate heights properly
        const timer = setTimeout(() => {
            initViewer();
        }, 100);

        const handleResize = () => {
            if (viewerRef.current) {
                viewerRef.current.resize();
                viewerRef.current.render();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            if (spinRAFRef.current) cancelAnimationFrame(spinRAFRef.current);
        };
    }, [is3DmolLoaded, initViewer]);

    // Effect to handle style changes or design changes by re-applying styles
    useEffect(() => {
        if (viewerRef.current && !loadingMol) {
            applyStyle(curStyle);
        }
    }, [activeIdx, curStyle, loadingMol, applyStyle]);

    // Spin effect loop
    useEffect(() => {
        if (!viewerRef.current) return;

        if (spinning) {
            const loop = () => {
                viewerRef.current.rotate(0.5, 'y');
                viewerRef.current.render();
                spinRAFRef.current = requestAnimationFrame(loop);
            };
            loop();
        } else {
            if (spinRAFRef.current) {
                cancelAnimationFrame(spinRAFRef.current);
                spinRAFRef.current = null;
            }
        }
    }, [spinning]);

    return (
        <>
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.1/3Dmol-min.js"
                onLoad={() => setIs3DmolLoaded(true)}
            />

            <div className="output-demo-app h-[100dvh] w-full relative overflow-hidden bg-[#0a0a0a] text-white">
                <style>{`
          .output-demo-app {
            --green:  #2ecc8e;
            --green2: #25b87e;
            --blue:   #3bc4e8;
            --orange: #f0a830;
            --purple: #a78bfa;
            --red:    #f87171;
            --text:   #111111;
            --muted:  #888888;
            --border: #e0e3e8;
            --panel:  #f0f2f5;
            --wrap:   #e3e6ea;
            --card:   #ffffff;
            --font:   'Inter', -apple-system, sans-serif;
            --mono:   'JetBrains Mono', monospace;
          }
          .output-demo-app * { box-sizing: border-box; }
          .output-demo-app { font-family: var(--font); }

          /* NAV */
          .od-nav {
            position: absolute; top: 0; left: 0; right: 0; z-index: 999;
            height: 58px;
            background: rgba(10,10,10,0.98);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 32px;
          }
          .od-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
          .od-nav-icon  { width: 32px; height: 32px; background: #181818; border: 1px solid #272727; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .od-nav-brand { color: #fff; font-size: 15px; font-weight: 800; }
          .od-nav-steps { display: flex; align-items: center; gap: 6px; }
          .od-nav-step  { font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 50px; border: 1px solid transparent; }
          .od-nav-step.done   { color: #444; }
          .od-nav-step.active { background: rgba(46,204,142,.1); border-color: rgba(46,204,142,.25); color: var(--green); }
          .od-step-sep { color: #2a2a2a; font-size: 12px; }
          .od-nav-right { display: flex; align-items: center; gap: 10px; }
          .od-run-chip  { font-family: var(--mono); font-size: 10px; color: #333; background: #111; border: 1px solid #1e1e1e; padding: 4px 10px; border-radius: 6px; }
          .od-btn-back  { font-size: 12px; font-weight: 700; color: var(--green); padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(46,204,142,.28); background: transparent; cursor: pointer; text-decoration: none; transition: background .15s; }
          .od-btn-back:hover { background: rgba(46,204,142,.08); }

          /* META BAR */
          .od-meta-bar {
            position: absolute; top: 58px; left: 0; right: 0; z-index: 998;
            height: 40px;
            background: #0d0d0d;
            border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; gap: 18px; padding: 0 28px;
          }
          .od-mi { display: flex; align-items: center; gap: 7px; }
          .od-mi-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
          .od-mi-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #333; }
          .od-mi-val { font-family: var(--mono); font-size: 11px; color: #666; }
          .od-mi-val.green { color: var(--green); }
          .od-mi-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(46,204,142,.1); color: var(--green); border: 1px solid rgba(46,204,142,.2); }
          .od-mi-sep { width: 1px; height: 18px; background: #1a1a1a; }

          /* BODY LAYOUT */
          .od-body-wrap {
            position: absolute;
            top: 98px; left: 0; right: 0; bottom: 0;
            display: flex;
          }

          /* LEFT: design list */
          .od-designs-col {
            width: 300px;
            background: var(--panel);
            color: var(--text);
            display: flex; flex-direction: column;
            border-right: 1px solid #ddd;
          }
          .od-dc-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
          .od-dc-title { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
          .od-dc-search {
            width: 100%; background: var(--card); border: 1.5px solid var(--border);
            border-radius: 8px; padding: 7px 10px; font-size: 12px;
            font-family: var(--font); color: var(--text); outline: none;
          }
          .od-dc-search:focus { border-color: var(--green); }
          .od-dc-list { flex: 1; overflow-y: auto; padding: 7px; }
          .od-dc-list::-webkit-scrollbar { width: 3px; }
          .od-dc-list::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

          .od-d-item {
            background: var(--card); border-radius: 9px; padding: 10px 12px;
            margin-bottom: 5px; cursor: pointer; border: 2px solid transparent;
            transition: all .15s; display: flex; align-items: center; gap: 9px;
          }
          .od-d-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,.07); }
          .od-d-item.active { border-color: var(--green); box-shadow: 0 0 0 3px rgba(46,204,142,.08); }
          .od-d-rank { font-size: 10px; font-weight: 700; color: #ccc; width: 20px; flex-shrink: 0; }
          .od-d-item.active .od-d-rank { color: var(--green); }
          .od-d-body { flex: 1; min-width: 0; }
          .od-d-name { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .od-d-score-row { display: flex; align-items: center; gap: 6px; }
          .od-d-bar-wrap { flex: 1; height: 3px; background: #eee; border-radius: 2px; overflow: hidden; }
          .od-d-bar { height: 100%; border-radius: 2px; background: var(--green); }
          .od-d-val { font-family: var(--mono); font-size: 10px; color: var(--muted); }
          .od-d-arr { color: #ddd; font-size: 11px; }
          .od-d-item.active .od-d-arr { color: var(--green); }

          /* RIGHT: viewer + sequence stacked */
          .od-right-col {
            flex: 1;
            display: flex; flex-direction: column;
            background: #0a0a0a;
          }

          /* 3D VIEWER */
          .od-viewer-wrap {
            position: relative;
            flex: 0.58;
            background: #050810;
          }
          #mol-viewer { width: 100%; height: 100%; }

          .od-v-topbar {
            position: absolute; top: 0; left: 0; right: 0; z-index: 20;
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 18px;
            background: linear-gradient(to bottom, rgba(5,8,16,.95) 0%, transparent 100%);
            pointer-events: none;
          }
          .od-v-topbar > * { pointer-events: auto; }
          .od-v-left { display: flex; align-items: center; gap: 8px; }
          .od-v-title { font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 1px; text-transform: uppercase; }
          .od-v-badge { font-family: var(--mono); font-size: 10px; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
          .od-v-badge.pdb    { background: rgba(46,204,142,.1);  color: var(--green);  border-color: rgba(46,204,142,.22); }
          .od-v-badge.design { background: rgba(59,196,232,.1);  color: var(--blue);   border-color: rgba(59,196,232,.2); }
          .od-v-controls { display: flex; gap: 4px; }
          .od-vc { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); color: #666; font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; transition: all .15s; font-family: var(--font); }
          .od-vc:hover { background: rgba(255,255,255,.1); color: #fff; }
          .od-vc.active { background: rgba(46,204,142,.1); border-color: rgba(46,204,142,.28); color: var(--green); }

          .od-v-botbar {
            position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
            padding: 8px 18px;
            background: linear-gradient(to top, rgba(5,8,16,.9) 0%, transparent 100%);
            display: flex; align-items: center; justify-content: space-between;
            pointer-events: none;
          }
          .od-v-info { font-family: var(--mono); font-size: 10px; color: #ccc; }
          .od-v-hint { font-size: 10px; color: #888; }

          .od-v-loading {
            position: absolute; inset: 0; z-index: 30;
            background: #050810;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
          }
          .od-v-loader { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #1a1a1a; border-top-color: var(--green); animation: spin .8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .od-v-loader-txt { font-family: var(--mono); font-size: 11px; color: #888; }

          /* SEQUENCE PANEL */
          .od-seq-panel {
            flex: 0.42;
            background: #0d0d0d;
            border-top: 1px solid #1a1a1a;
            display: flex; flex-direction: column; overflow: hidden;
          }
          .od-sp-head {
            padding: 9px 20px;
            border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            flex-shrink: 0;
          }
          .od-sp-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #444; }
          .od-sp-tabs { display: flex; gap: 3px; }
          .od-sp-tab { font-size: 11px; font-weight: 600; padding: 4px 11px; border-radius: 5px; cursor: pointer; color: #444; background: transparent; border: none; font-family: var(--font); transition: all .15s; }
          .od-sp-tab.active { background: rgba(46,204,142,.1); color: var(--green); }
          .od-sp-actions { display: flex; gap: 5px; }
          .od-sp-btn { font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 5px; border: 1px solid #1e1e1e; background: transparent; color: #444; cursor: pointer; font-family: var(--font); transition: all .15s; }
          .od-sp-btn:hover { border-color: #333; color: #777; }

          .od-sp-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
          .od-sp-body::-webkit-scrollbar { width: 3px; }
          .od-sp-body::-webkit-scrollbar-thumb { background: #1a1a1a; }

          .od-cdr-block { margin-bottom: 14px; }
          .od-cdr-row-head { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
          .od-cdr-name { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .od-cdr-len  { font-family: var(--mono); font-size: 10px; color: #666; }
          .od-cdr-chip { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }

          .od-seq-line { font-family: var(--mono); font-size: 13px; letter-spacing: 2.5px; line-height: 1.8; word-break: break-all; padding: 7px 10px; border-radius: 6px; }
          
          .aa.t-hydro { color: #f0a830; } 
          .aa.t-polar { color: #3bc4e8; } 
          .aa.t-pos   { color: #a78bfa; } 
          .aa.t-neg   { color: #f87171; } 
          .aa.t-gly   { color: #555; }

          /* metrics strip */
          .od-metrics-strip {
            display: flex; gap: 6px; padding: 8px 20px 10px;
            border-top: 1px solid #141414; flex-shrink: 0; flex-wrap: wrap;
          }
          .od-mc { background: #111; border: 1px solid #1a1a1a; border-radius: 7px; padding: 7px 13px; }
          .od-mc-l { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #555; margin-bottom: 2px; }
          .od-mc-v { font-family: var(--mono); font-size: 14px; font-weight: 600; }
          .od-mc-v.g { color: var(--green); }
          .od-mc-v.o { color: var(--orange); }
          .od-mc-v.b { color: var(--blue); }
          .od-mc-s { font-size: 9px; color: #444; }
        `}</style>

                {/* NAV */}
                <nav className="od-nav">
                    <div className="od-nav-logo">
                        <div className="od-nav-icon">🧬</div>
                        <span className="od-nav-brand">Foldexa</span>
                    </div>
                    <div className="od-nav-steps">
                        <span className="od-nav-step done">① Configure</span>
                        <span className="od-step-sep">›</span>
                        <span className="od-nav-step active">② Results</span>
                    </div>
                    <div className="od-nav-right">
                        <span className="od-run-chip">codesign_single · 10 designs · cuda</span>
                    </div>
                </nav>

                {/* META BAR */}
                <div className="od-meta-bar">
                    <div className="od-mi"><div className="od-mi-dot"></div><span className="od-mi-lbl">Status</span><span className="od-mi-val">Complete</span></div>
                    <div className="od-mi-sep"></div>
                    <div className="od-mi"><span className="od-mi-lbl">Mode</span><span className="od-mi-badge">codesign_single</span></div>
                    <div className="od-mi-sep"></div>
                    <div className="od-mi"><span className="od-mi-lbl">Designs</span><span className="od-mi-val">10 / 10</span></div>
                    <div className="od-mi-sep"></div>
                    <div className="od-mi"><span className="od-mi-lbl">Best AAR</span><span className="od-mi-val green">0.847</span></div>
                    <div className="od-mi-sep"></div>
                    <div className="od-mi"><span className="od-mi-lbl">Avg RMSD</span><span className="od-mi-val">1.24 Å</span></div>
                    <div className="od-mi-sep"></div>
                    <div className="od-mi"><span className="od-mi-lbl">Runtime</span><span className="od-mi-val">4m 32s</span></div>
                </div>

                {/* BODY */}
                <div className="od-body-wrap">
                    {/* LEFT: design list */}
                    <div className="od-designs-col">
                        <div className="od-dc-head">
                            <div className="od-dc-title">Generated Designs</div>
                            <input
                                className="od-dc-search"
                                type="text"
                                placeholder="Search…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="od-dc-list">
                            {filteredDesigns.map((d) => {
                                const originalIndex = designs.findIndex(x => x.id === d.id);
                                return (
                                    <div
                                        key={d.id}
                                        className={`od-d-item ${originalIndex === activeIdx ? 'active' : ''}`}
                                        onClick={() => setActiveIdx(originalIndex)}
                                    >
                                        <div className="od-d-rank">#{originalIndex + 1}</div>
                                        <div className="od-d-body">
                                            <div className="od-d-name">{d.id}</div>
                                            <div className="od-d-score-row">
                                                <div className="od-d-bar-wrap">
                                                    <div className="od-d-bar" style={{ width: `${Math.min(d.aar * 100, 100)}%` }}></div>
                                                </div>
                                                <span className="od-d-val">AAR {d.aar.toFixed(3)}</span>
                                            </div>
                                        </div>
                                        <div className="od-d-arr">›</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: viewer + sequence */}
                    <div className="od-right-col">
                        {/* 3D VIEWER */}
                        <div className="od-viewer-wrap">
                            {loadingMol && (
                                <div className="od-v-loading">
                                    <div className="od-v-loader"></div>
                                    <div className="od-v-loader-txt">Loading antibody structure…</div>
                                </div>
                            )}

                            <div className="od-v-topbar">
                                <div className="od-v-left">
                                    <span className="od-v-title">3D Viewer</span>
                                    <span className="od-v-badge pdb">PDB: 7FAE</span>
                                    <span className="od-v-badge design">{activeDesign.id}</span>
                                </div>
                                <div className="od-v-controls">
                                    <button className={`od-vc ${curStyle === 'cartoon' ? 'active' : ''}`} onClick={() => setStyle('cartoon')}>Cartoon</button>
                                    <button className={`od-vc ${curStyle === 'stick' ? 'active' : ''}`} onClick={() => setStyle('stick')}>Stick</button>
                                    <button className={`od-vc ${curStyle === 'sphere' ? 'active' : ''}`} onClick={() => setStyle('sphere')}>Sphere</button>
                                    <button className={`od-vc ${curStyle === 'surface' ? 'active' : ''}`} onClick={() => setStyle('surface')}>Surface</button>
                                    <button className={`od-vc ${spinning ? 'active' : ''}`} onClick={() => setSpinning(!spinning)}>⟳ Spin</button>
                                    <button className="od-vc" onClick={resetCam}>⤢ Fit</button>
                                </div>
                            </div>

                            <div id="mol-viewer"></div>

                            <div className="od-v-botbar">
                                <span className="od-v-info">IgG1 Fab — chain H: green · chain L: blue</span>
                                <span className="od-v-hint">Drag to rotate · Scroll to zoom · Right-click to pan</span>
                            </div>
                        </div>

                        {/* SEQUENCE PANEL */}
                        <div className="od-seq-panel">
                            <div className="od-sp-head">
                                <span className="od-sp-title">Sequence Output</span>
                                <div className="od-sp-tabs">
                                    <button className={`od-sp-tab ${currentTab === 'cdr' ? 'active' : ''}`} onClick={() => setCurrentTab('cdr')}>CDR Regions</button>
                                    <button className={`od-sp-tab ${currentTab === 'full' ? 'active' : ''}`} onClick={() => setCurrentTab('full')}>Full Sequence</button>
                                </div>
                                <div className="od-sp-actions">
                                    <button className="od-sp-btn" onClick={copySeq}>⎘ Copy</button>
                                    <button className="od-sp-btn">↓ FASTA</button>
                                </div>
                            </div>

                            <div className="od-sp-body">
                                {currentTab === 'cdr' ? (
                                    <>
                                        <div className="od-cdr-block">
                                            <div className="od-cdr-row-head">
                                                <span className="od-cdr-name" style={{ color: "var(--green)" }}>CDR-H3</span>
                                                <span className="od-cdr-len">{activeDesign.cdrh3.length} residues</span>
                                                <span className="od-cdr-chip" style={{ background: "rgba(46,204,142,.1)", color: "var(--green)" }}>Heavy Chain</span>
                                            </div>
                                            <div className="od-seq-line" style={{ background: "rgba(46,204,142,.05)", border: "1px solid rgba(46,204,142,.12)" }}>
                                                <ColoredSequence seq={activeDesign.cdrh3} />
                                            </div>
                                        </div>
                                        <div className="od-cdr-block">
                                            <div className="od-cdr-row-head">
                                                <span className="od-cdr-name" style={{ color: "var(--blue)" }}>CDR-L1</span>
                                                <span className="od-cdr-len">{activeDesign.cdrl1.length} residues</span>
                                                <span className="od-cdr-chip" style={{ background: "rgba(59,196,232,.1)", color: "var(--blue)" }}>Light Chain</span>
                                            </div>
                                            <div className="od-seq-line" style={{ background: "rgba(59,196,232,.05)", border: "1px solid rgba(59,196,232,.12)" }}>
                                                <ColoredSequence seq={activeDesign.cdrl1} />
                                            </div>
                                        </div>
                                        <div className="od-cdr-block">
                                            <div className="od-cdr-row-head">
                                                <span className="od-cdr-name" style={{ color: "var(--orange)" }}>CDR-L3</span>
                                                <span className="od-cdr-len">{activeDesign.cdrl3.length} residues</span>
                                                <span className="od-cdr-chip" style={{ background: "rgba(240,168,48,.1)", color: "var(--orange)" }}>Light Chain</span>
                                            </div>
                                            <div className="od-seq-line" style={{ background: "rgba(240,168,48,.05)", border: "1px solid rgba(240,168,48,.12)" }}>
                                                <ColoredSequence seq={activeDesign.cdrl3} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="od-cdr-block">
                                        <div className="od-cdr-row-head">
                                            <span className="od-cdr-name" style={{ color: "#aaa" }}>Full VH/VL Sequence</span>
                                            <span className="od-cdr-len">{activeDesign.full.length} residues</span>
                                        </div>
                                        <div className="od-seq-line" style={{ color: "#ddd", letterSpacing: "1.5px" }}>
                                            <ColoredSequence seq={activeDesign.full} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="od-metrics-strip">
                                <div className="od-mc">
                                    <div className="od-mc-l">AAR</div>
                                    <div className="od-mc-v g">{activeDesign.aar.toFixed(3)}</div>
                                    <div className="od-mc-s">Amino acid recovery</div>
                                </div>
                                <div className="od-mc">
                                    <div className="od-mc-l">RMSD</div>
                                    <div className="od-mc-v b">{activeDesign.rmsd.toFixed(2)} Å</div>
                                    <div className="od-mc-s">Backbone deviation</div>
                                </div>
                                <div className="od-mc">
                                    <div className="od-mc-l">CDR-H3 Len</div>
                                    <div className="od-mc-v g">{activeDesign.cdrh3.length}</div>
                                    <div className="od-mc-s">Residues</div>
                                </div>
                                <div className="od-mc">
                                    <div className="od-mc-l">pLDDT</div>
                                    <div className={`od-mc-v ${activeDesign.plddt >= 80 ? 'g' : 'o'}`}>{activeDesign.plddt.toFixed(1)}</div>
                                    <div className="od-mc-s">Confidence</div>
                                </div>
                                <div className="od-mc">
                                    <div className="od-mc-l">ΔG Bind</div>
                                    <div className="od-mc-v o">{activeDesign.dg.toFixed(1)}</div>
                                    <div className="od-mc-s">kcal/mol (pred)</div>
                                </div>
                                <div className="od-mc">
                                    <div className="od-mc-l">Seq Identity</div>
                                    <div className="od-mc-v b">{activeDesign.sid}</div>
                                    <div className="od-mc-s">vs. reference</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
