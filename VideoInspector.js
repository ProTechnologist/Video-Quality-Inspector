javascript:(function(){
        /* 1. Target active video */
        const v = Array.from(document.querySelectorAll('video')).find(el => !el.paused && el.currentTime > 0) ||
  document.querySelector('video');
        if (!v) { alert("No HTML5 video player found."); return; }

        /* 2. Clear previous HUD */
        const old = document.getElementById('vq-hud');
        if (old) old.remove();

        /* 3. Create Container (appends to fullscreen container if active) */
        const parent = document.fullscreenElement || document.body;
        const hud = document.createElement('div');
        hud.id = 'vq-hud';
        Object.assign(hud.style, {
            position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
            backgroundColor: 'rgba(15, 23, 42, 0.96)', color: '#f8fafc',
            fontFamily: 'Consolas, monospace', fontSize: '12px', lineHeight: '1.6',
            padding: '16px 20px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            border: '1px solid #334155', minWidth: '320px', pointerEvents: 'auto'
        });

        const statusMsg = document.createElement('div');
        statusMsg.style.color = '#38bdf8';
        statusMsg.style.fontWeight = 'bold';
        statusMsg.textContent = '🔍 Analyzing video bitrate (1.5s)...';
        hud.appendChild(statusMsg);
        parent.appendChild(hud);

        const startBytes = v.webkitVideoDecodedByteCount || 0;
        const startTime = performance.now();

        /* 4. Measure bit flow over 1.5 seconds */
        setTimeout(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            const endBytes = v.webkitVideoDecodedByteCount || 0;
            let bitrateKbps = 0;

            if (endBytes > startBytes) {
                bitrateKbps = Math.round(((endBytes - startBytes) * 8) / elapsed / 1000);
            } else {
                const media = performance.getEntriesByType('resource')
                    .filter(r => r.name.match(/\.(m4s|ts|mp4|webm)(\?|$)/i) || r.transferSize > 100000)
                    .slice(-5);
                if (media.length > 0) {
                    const total = media.reduce((acc, r) => acc + (r.transferSize || r.decodedBodySize || 0), 0);
                    bitrateKbps = Math.round((total * 8) / (media.length * 3.5 * 1000));
                }
            }

            const w = v.videoWidth || 0;
            const h = v.videoHeight || 0;
            const bpp = (w && h && bitrateKbps) ? ((bitrateKbps * 1000) / (w * h * 30)).toFixed(4) : null;

            let dropInfo = "N/A";
            if (v.getVideoPlaybackQuality) {
                const q = v.getVideoPlaybackQuality();
                dropInfo = `${q.droppedVideoFrames} / ${q.totalVideoFrames} dropped`;
            }

            /* Assessment */
            let verdict = "Unknown", col = "#94a3b8";
            if (!bitrateKbps) {
                verdict = "Bitrate unavailable (DRM or pure Blob)";
            } else if (h >= 1080) {
                if (bitrateKbps < 2000 || (bpp && bpp < 0.035)) {
                    verdict = "⚠️ Low Bitrate / Likely Fake 1080p";
                    col = "#ef4444";
                } else if (bitrateKbps < 4500) {
                    verdict = "⚡ Standard Web 1080p";
                    col = "#f59e0b";
                } else {
                    verdict = "✨ True High Quality 1080p";
                    col = "#10b981";
                }
            } else if (h >= 720) {
                verdict = bitrateKbps < 1200 ? "⚠️ Low Bitrate 720p" : "✨ Standard 720p";
                col = bitrateKbps < 1200 ? "#ef4444" : "#10b981";
            } else {
                verdict = "SD Resolution (480p or below)";
            }

            /* 5. Build UI with Native DOM (No innerHTML -> 100% Trusted Types safe) */
            while (hud.firstChild) hud.removeChild(hud.firstChild);

            const header = document.createElement('div');
            Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid
  #334155', paddingBottom: '6px', marginBottom: '8px' });

            const title = document.createElement('b');
            title.style.color = '#38bdf8';
            title.textContent = '🎬 Video Stream Inspector';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            Object.assign(closeBtn.style, { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
  fontSize: '15px' });
            closeBtn.onclick = () => hud.remove();

            header.appendChild(title);
            header.appendChild(closeBtn);
            hud.appendChild(header);

            function addRow(label, val) {
                const row = document.createElement('div');
                const lbl = document.createElement('b');
                lbl.textContent = label + ': ';
                row.appendChild(lbl);
                row.appendChild(document.createTextNode(val));
                hud.appendChild(row);
            }

            addRow('Source Res', `${w}x${h} ${h ? '(' + h + 'p)' : ''}`);
            addRow('Screen Size', `${v.clientWidth}x${v.clientHeight}`);
            addRow('Estimated Bitrate', bitrateKbps ? `${bitrateKbps.toLocaleString()} kbps (~${(bitrateKbps/1000).
  toFixed(1)} Mbps)` : 'N/A');
            addRow('Bits Per Pixel (BPP)', bpp || 'N/A');
            addRow('Frame Drops', dropInfo);

            const card = document.createElement('div');
            Object.assign(card.style, { marginTop: '10px', padding: '8px 12px', background: '#1e293b', borderRadius:
  '6px', borderLeft: `4px solid ${col}` });

            const cardTitle = document.createElement('div');
            Object.assign(cardTitle.style, { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase',
  letterSpacing: '0.5px' });
            cardTitle.textContent = 'Assessment';

            const cardVal = document.createElement('div');
            Object.assign(cardVal.style, { fontWeight: 'bold', color: col, marginTop: '2px' });
            cardVal.textContent = verdict;

            card.appendChild(cardTitle);
            card.appendChild(cardVal);
            hud.appendChild(card);
        }, 1500);
    })();
