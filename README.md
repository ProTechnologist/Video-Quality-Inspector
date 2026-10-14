 # 🎬 Video Quality Inspector

    A lightweight bookmarklet to inspect the **true bitrate**, **actual resolution**, and **stream quality** of any
  HTML5 video — helping you spot fake, low-bitrate upscaled "1080p" videos.

    No extensions. No tracking. Works on YouTube, Twitch, Vimeo, and most streaming sites.

    ---

    ## 🚀 How to Install

    1. Show your Bookmarks bar (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> or <kbd>Cmd</kbd> + <kbd>Shift</kbd>
  <kbd>B</kbd>).
    2. Right-click the bookmarks bar and select **Add page** (or **Add bookmark**).
    3. Name it: `🎬 Video Inspector`
    4. In the **URL** field, paste this code and click **Save**:

   ```javascript
    javascript:(function(){
        var v = Array.from(document.querySelectorAll('video')).find(function(el){ return !el.paused && el.currentTime
  > 0; }) || document.querySelector('video');
        if (!v) { alert('No HTML5 video player found.'); return; }

        var old = document.getElementById('vq-hud');
        if (old) old.remove();

        var parent = document.fullscreenElement || document.body;
        var hud = document.createElement('div');
        hud.id = 'vq-hud';
        Object.assign(hud.style, {
            position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
            backgroundColor: 'rgba(15, 23, 42, 0.96)', color: '#f8fafc',
            fontFamily: 'Consolas, monospace', fontSize: '12px', lineHeight: '1.6',
            padding: '16px 20px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            border: '1px solid #334155', minWidth: '320px', pointerEvents: 'auto'
        });

        var msg = document.createElement('div');
        msg.style.color = '#38bdf8';
        msg.style.fontWeight = 'bold';
        msg.textContent = '🔍 Analyzing video bitrate (1.5s)...';
        hud.appendChild(msg);
        parent.appendChild(hud);

        var startBytes = v.webkitVideoDecodedByteCount || 0;
        var startTime = performance.now();

        setTimeout(function(){
            var elapsed = (performance.now() - startTime) / 1000;
            var endBytes = v.webkitVideoDecodedByteCount || 0;
            var bitrateKbps = 0;

            if (endBytes > startBytes) {
                bitrateKbps = Math.round(((endBytes - startBytes) * 8) / elapsed / 1000);
            } else {
                var media = performance.getEntriesByType('resource').filter(function(r){
                    return r.name.match(/\.(m4s|ts|mp4|webm)(\?|$)/i) || r.transferSize > 100000;
                }).slice(-5);
                if (media.length > 0) {
                    var total = media.reduce(function(acc, r){ return acc + (r.transferSize || r.decodedBodySize || 0);
  }, 0);
                    bitrateKbps = Math.round((total * 8) / (media.length * 3.5 * 1000));
                }
            }

            var w = v.videoWidth || 0;
            var h = v.videoHeight || 0;
            var bpp = (w && h && bitrateKbps) ? ((bitrateKbps * 1000) / (w * h * 30)).toFixed(4) : null;

            var dropInfo = 'N/A';
            if (v.getVideoPlaybackQuality) {
                var q = v.getVideoPlaybackQuality();
                dropInfo = q.droppedVideoFrames + ' / ' + q.totalVideoFrames + ' dropped';
            }

            var verdict = 'Unknown', col = '#94a3b8';
            if (!bitrateKbps) {
                verdict = 'Bitrate unavailable (DRM or pure Blob)';
            } else if (h >= 1080) {
                if (bitrateKbps < 2000 || (bpp && bpp < 0.035)) {
                    verdict = '⚠️ Low Bitrate / Likely Fake 1080p';
                    col = '#ef4444';
                } else if (bitrateKbps < 4500) {
                    verdict = '⚡ Standard Web 1080p';
                    col = '#f59e0b';
                } else {
                    verdict = '✨ True High Quality 1080p';
                    col = '#10b981';
                }
            } else if (h >= 720) {
                verdict = bitrateKbps < 1200 ? '⚠️ Low Bitrate 720p' : '✨ Standard 720p';
                col = bitrateKbps < 1200 ? '#ef4444' : '#10b981';
            } else {
                verdict = 'SD Resolution (480p or below)';
            }

            while (hud.firstChild) hud.removeChild(hud.firstChild);

            var header = document.createElement('div');
            Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid
  #334155', paddingBottom: '6px', marginBottom: '8px' });

            var title = document.createElement('b');
            title.style.color = '#38bdf8';
            title.textContent = '🎬 Video Stream Inspector';

            var closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            Object.assign(closeBtn.style, { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
  fontSize: '15px' });
            closeBtn.onclick = function(){ hud.remove(); };

            header.appendChild(title);
            header.appendChild(closeBtn);
            hud.appendChild(header);

            function addRow(label, val) {
                var row = document.createElement('div');
                var lbl = document.createElement('b');
                lbl.textContent = label + ': ';
                row.appendChild(lbl);
                row.appendChild(document.createTextNode(val));
                hud.appendChild(row);
            }

            addRow('Source Res', w + 'x' + h + (h ? ' (' + h + 'p)' : ''));
            addRow('Screen Size', v.clientWidth + 'x' + v.clientHeight);
            addRow('Estimated Bitrate', bitrateKbps ? bitrateKbps.toLocaleString() + ' kbps (~' + (bitrateKbps/1000).
  toFixed(1) + ' Mbps)' : 'N/A');
            addRow('Bits Per Pixel (BPP)', bpp || 'N/A');
            addRow('Frame Drops', dropInfo);

            var card = document.createElement('div');
            Object.assign(card.style, { marginTop: '10px', padding: '8px 12px', background: '#1e293b', borderRadius:
  '6px', borderLeft: '4px solid ' + col });

            var cardTitle = document.createElement('div');
            Object.assign(cardTitle.style, { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase',
  letterSpacing: '0.5px' });
            cardTitle.textContent = 'Assessment';

            var cardVal = document.createElement('div');
            Object.assign(cardVal.style, { fontWeight: 'bold', color: col, marginTop: '2px' });
            cardVal.textContent = verdict;

            card.appendChild(cardTitle);
            card.appendChild(cardVal);
            hud.appendChild(card);
        }, 1500);
    })();
    ```
    
  ──────
  ## 🎮 How to Use

  1. Play any video on any website.
  2. Click 🎬 Video Inspector in your bookmarks bar.
  3. A small HUD appears showing:
      • Source Resolution vs. Screen Size
      • Real Bitrate (kbps / Mbps)
      • Bits Per Pixel (BPP)
      • Dropped Frames
      • Quality Assessment (e.g. True 1080p vs. Fake Upscaled 1080p)

  ──────
  ## 📌 Quality Guide for 1080p

   Bitrate                       | Rating                       | What It Means
  -------------------------------|------------------------------|-----------------------------------------------------
   < 2.0 Mbps                    | ⚠️ Fake / Starved 1080p      | Stretched 480p/720p with heavy compression blur.
   2.0 – 4.5 Mbps                | ⚡ Standard Web 1080p        | Average quality with visible compression artifacts.
   4.5+ Mbps                     | ✨ True High Quality         | Genuine, sharp 1080p detail.

  │ Tip for Embedded Videos: If a video is inside an embedded frame, right-click it, select "Open frame in new tab",
  │ and run the bookmarklet there.
  ──────
  ## 📄 License

  MIT
