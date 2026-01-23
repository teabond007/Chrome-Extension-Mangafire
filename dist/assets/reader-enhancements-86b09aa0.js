var x=Object.defineProperty;var v=(p,t,e)=>t in p?x(p,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):p[t]=e;var m=(p,t,e)=>(v(p,typeof t!="symbol"?t+"":t,e),e);const y={Reading:"#4ade80",Completed:"#60a5fa","Plan to Read":"#fbbf24","On-Hold":"#f97316","On Hold":"#f97316",Dropped:"#ef4444","Re-reading":"#a855f7",HasHistory:"#9ca3af"};class l{static create(t,e,r={}){var d;const a=document.createElement("div");a.className="bmh-quick-tooltip",a.dataset.entryId=t.slug||t.id||"";const s=e.unitName==="episode"?"Ep.":"Ch.",o=parseFloat(t.lastReadChapter)||0,n=l.calculateNextChapter(t),i=l.getStatusColor(t.status),h=((d=t.personalData)==null?void 0:d.rating)||0,c=o>0;return a.innerHTML=`
            <button class="bmh-tt-btn bmh-tt-continue ${c?"":"bmh-btn-disabled"}" 
                    data-action="continue" 
                    title="${c?`Continue ${s} ${n}`:`Start Reading ${s} 1`}">
                ▶
            </button>
            <button class="bmh-tt-btn bmh-tt-status" data-action="status" title="${t.status||"Set Status"}" style="--status-color: ${i}">
                <span class="bmh-tt-status-dot" style="background: ${i}"></span>
            </button>
            <button class="bmh-tt-btn bmh-tt-rating" data-action="rating" title="Rating: ${h}/10">
                ${h>0?h:"★"}
            </button>
            <button class="bmh-tt-btn bmh-tt-info" data-action="details" title="View Details">
                ℹ
            </button>
        `,l.attachEventListeners(a,t,r),a}static createExpanded(t,e,r={}){var i;const a=document.createElement("div");a.className="bmh-quick-actions bmh-qa-expanded",a.dataset.entryId=t.slug||t.id||"";const s=e.unitName==="episode"?"Ep.":"Ch.",o=l.calculateNextChapter(t),n=((i=t.personalData)==null?void 0:i.rating)||0;return a.innerHTML=`
            <div class="bmh-qa-content">
                <button class="bmh-qa-btn bmh-qa-continue" data-action="continue" title="Continue to ${s} ${o}">
                    <span class="bmh-qa-icon">▶</span>
                    Continue ${s} ${o}
                </button>
                <button class="bmh-qa-btn bmh-qa-status" data-action="status" title="Change reading status">
                    <span class="bmh-qa-status-indicator" style="background: ${l.getStatusColor(t.status)}"></span>
                    ${t.status||"Add to Library"}
                </button>
                <div class="bmh-qa-row">
                    <div class="bmh-qa-rating" data-action="rating" title="Rate (${n}/10)">
                        ${l.renderRatingBadge(n)}
                    </div>
                    <button class="bmh-qa-btn bmh-qa-details" data-action="details" title="View details">
                        <span class="bmh-qa-icon">ℹ️</span>
                    </button>
                </div>
            </div>
        `,l.attachEventListeners(a,t,r),a}static attachEventListeners(t,e,r){t.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",s=>{s.stopPropagation(),s.preventDefault();const o=a.dataset.action;r[o]&&r[o](e,a,s)})})}static calculateNextChapter(t){const e=parseFloat(t.lastReadChapter)||0;return Math.floor(e)+1}static renderRatingBadge(t){return!t||t<=0?'<span class="bmh-rating-badge bmh-rating-empty">-</span>':`<span class="bmh-rating-badge">${t}/10</span>`}static getStatusColor(t){const e={reading:"#4ade80",completed:"#60a5fa","plan to read":"#fbbf24",planning:"#fbbf24","on-hold":"#f97316","on hold":"#f97316",dropped:"#ef4444","re-reading":"#a855f7",rereading:"#a855f7"},r=(t||"").toLowerCase().trim();return e[r]||"rgba(255,255,255,0.3)"}static createStatusPicker(t,e,r=[]){const a=document.createElement("div");a.className="bmh-status-picker";const o=[...[{name:"Reading",color:"#4ade80"},{name:"Completed",color:"#60a5fa"},{name:"Plan to Read",color:"#fbbf24"},{name:"On-Hold",color:"#f97316"},{name:"Dropped",color:"#ef4444"},{name:"Re-reading",color:"#a855f7"}],...r];return a.innerHTML=`
            <div class="bmh-picker-header">Change Status</div>
            <div class="bmh-picker-options">
                ${o.map(n=>`
                    <button class="bmh-picker-option ${t.status===n.name?"active":""}" 
                            data-status="${n.name}">
                        <span class="bmh-picker-dot" style="background: ${n.color}"></span>
                        ${n.name}
                    </button>
                `).join("")}
            </div>
        `,a.querySelectorAll("[data-status]").forEach(n=>{n.addEventListener("click",i=>{i.stopPropagation(),e==null||e(n.dataset.status,t),a.remove()})}),l.autoCloseOnOutsideClick(a),a}static createRatingPicker(t,e){var o;const r=document.createElement("div");r.className="bmh-rating-picker";const a=((o=t.personalData)==null?void 0:o.rating)||0;r.innerHTML=`
            <div class="bmh-picker-header">Rate (1-10)</div>
            <div class="bmh-rating-grid">
                ${[1,2,3,4,5,6,7,8,9,10].map(n=>`
                    <button class="bmh-rating-num ${n===a?"active":""}" 
                            data-rating="${n}">
                        ${n}
                    </button>
                `).join("")}
            </div>
            <button class="bmh-rating-clear" data-rating="0">Clear</button>
        `;const s=r.querySelectorAll(".bmh-rating-num");return s.forEach((n,i)=>{n.addEventListener("mouseenter",()=>{s.forEach((h,c)=>{h.classList.toggle("hovered",c<=i)})})}),r.querySelector(".bmh-rating-grid").addEventListener("mouseleave",()=>{s.forEach(n=>n.classList.remove("hovered"))}),r.querySelectorAll("[data-rating]").forEach(n=>{n.addEventListener("click",i=>{i.stopPropagation();const h=parseInt(n.dataset.rating);e==null||e(h,t),r.remove()})}),l.autoCloseOnOutsideClick(r),r}static autoCloseOnOutsideClick(t){setTimeout(()=>{const e=r=>{t.contains(r.target)||(t.remove(),document.removeEventListener("click",e))};document.addEventListener("click",e)},0)}static autoCloseOnOutsideClick(t){setTimeout(()=>{const e=r=>{t.contains(r.target)||(t.remove(),document.removeEventListener("click",e))};document.addEventListener("click",e)},0)}static injectStyles(){if(document.getElementById("bmh-overlay-styles"))return;const t=document.createElement("style");t.id="bmh-overlay-styles",t.textContent=`
            /* ===== COMPACT TOOLTIP ===== */
            .bmh-quick-tooltip {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                gap: 4px;
                opacity: 0;
                transform: translateY(-4px);
                transition: all 0.2s ease;
                z-index: 60;
                pointer-events: none;
            }

            [data-bmh-enhanced]:hover .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .bmh-tt-btn {
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
                backdrop-filter: blur(8px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }

            .bmh-tt-btn:hover {
                transform: scale(1.1);
                background: rgba(30, 30, 30, 0.95);
            }

            .bmh-tt-continue {
                background: linear-gradient(135deg, #4CAF50, #388e3c);
            }

            .bmh-tt-continue.bmh-btn-disabled {
                background: rgba(80, 80, 80, 0.8);
                opacity: 0.7;
                filter: grayscale(1);
                box-shadow: none;
            }

            .bmh-tt-continue:not(.bmh-btn-disabled):hover {
                background: linear-gradient(135deg, #66BB6A, #43A047);
            }

            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }

            .bmh-tt-rating {
                font-weight: 700;
                color: #fbbf24;
            }

            .bmh-tt-info {
                font-size: 14px;
            }

            /* ===== PICKERS (Status & Rating) ===== */
            .bmh-status-picker,
            .bmh-rating-picker {
                position: fixed;
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                z-index: 10000;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px);
                animation: bmh-picker-slide 0.2s ease-out;
            }

            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .bmh-picker-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .bmh-picker-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: left;
            }

            .bmh-picker-option:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .bmh-picker-option.active {
                background: rgba(255, 255, 255, 0.15);
            }

            .bmh-picker-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            /* Rating Grid (1-10) */
            .bmh-rating-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 10px;
            }

            .bmh-rating-num {
                width: 36px;
                height: 36px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                background: transparent;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-num:hover,
            .bmh-rating-num.hovered {
                background: rgba(251, 191, 36, 0.3);
                border-color: #fbbf24;
                color: #fbbf24;
            }

            .bmh-rating-num.active {
                background: #fbbf24;
                border-color: #fbbf24;
                color: #000;
            }

            .bmh-rating-clear {
                width: 100%;
                padding: 8px;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-clear:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
            }

            /* Rating Badge */
            .bmh-rating-badge {
                color: #fbbf24;
                font-weight: 600;
                font-size: 13px;
            }

            .bmh-rating-empty {
                opacity: 0.5;
            }

            /* Animation keyframes */
            @keyframes bmh-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
            }
        `,document.head.appendChild(t)}static injectPickerStyles(){l.injectStyles()}}class S{constructor(t,e={}){m(this,"adapter");m(this,"settings");this.adapter=t,this.settings={highlighting:e.highlighting!==!1,progressBadges:e.progressBadges!==!1,quickActions:e.quickActions===!0,newChapterBadges:e.newChapterBadges===!0,border:{size:e.CustomBorderSize||4,style:e.borderStyle||"solid",radius:"8px"},customBookmarks:e.customBookmarks||[],customBookmarksEnabled:e.CustomBookmarksfeatureEnabled||!1}}async enhanceAll(){const t=this.findCards(),e=await this.loadLibrary();let r=0;for(const a of t){if(a.element.dataset.bmhEnhanced)continue;const s=this.findMatch(a,e);s&&(this.applyEnhancements(a,s),r++),a.element.dataset.bmhEnhanced="true"}return r}findCards(){const t=this.adapter.selectors.card;return t?Array.from(document.querySelectorAll(t)).map(e=>({element:e,data:this.adapter.extractCardData(e)})).filter(e=>e.data.title||e.data.id):[]}async loadLibrary(){return new Promise(t=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks","savedReadChapters"],e=>{if(chrome.runtime.lastError){t([]);return}const r=Array.isArray(e.savedEntriesMerged)?e.savedEntriesMerged:[],a=Array.isArray(e.userBookmarks)?e.userBookmarks:[],s=e.savedReadChapters||{},o=new Map;[...a,...r].forEach(n=>{if(n!=null&&n.title){const i=this.findHistoryKey(n.title,n.slug,s);n.readChapters=i?s[i]:[],n.lastReadChapter=this.getHighestChapter(n.readChapters),o.set(n.title,n)}}),t(Array.from(o.values()))})})}findHistoryKey(t,e,r){if(!r)return null;if(e){const s=`${this.adapter.PREFIX||""}${e}`;if(r[s])return s;if(r[e])return e;if(e.includes(".")){const o=e.substring(0,e.lastIndexOf("."));if(r[o])return o}}if(r[t])return t;const a=this.normalizeTitle(t);for(const s of Object.keys(r))if(this.normalizeTitle(s)===a)return s;return null}findMatch(t,e){const r=e.find(s=>s.source===this.adapter.id&&s.sourceId===t.data.id);if(r)return r;const a=this.normalizeTitle(t.data.title);return e.find(s=>this.normalizeTitle(s.title)===a)}applyEnhancements(t,e){var r;this.settings.highlighting&&this.applyBorder(t,e),this.settings.progressBadges&&(((r=e.readChapters)==null?void 0:r.length)||0)>0&&this.applyProgressBadge(t,e),this.settings.newChapterBadges&&e.hasNewChapters&&this.applyNewBadge(t),this.settings.quickActions&&this.applyQuickActions(t,e)}applyBorder(t,e){var o;const r=((o=e.status)==null?void 0:o.trim().toLowerCase())||"";let a="transparent",s=this.settings.border.style;for(const[n,i]of Object.entries(y))if(r.includes(n.toLowerCase())){a=i;break}if(this.settings.customBookmarksEnabled&&this.settings.customBookmarks.forEach(n=>{n.name&&r.includes(n.name.toLowerCase())&&(a=n.color,s=n.style||"solid")}),a!=="transparent")if(this.adapter.applyBorder)this.adapter.applyBorder(t.element,a,this.settings.border.size,s);else{const n=t.element.closest("li")||t.element;n.style.setProperty("border",`${this.settings.border.size}px ${s} ${a}`,"important"),n.style.setProperty("border-radius",this.settings.border.radius,"important"),n.style.setProperty("box-sizing","border-box","important")}}applyProgressBadge(t,e){var i,h,c;const r=this.adapter.unitName==="episode"?"Ep.":"Ch.",a=e.chapters||((i=e.anilistData)==null?void 0:i.chapters),s=a?`${r} ${e.lastReadChapter}/${a}`:`${r} ${e.lastReadChapter}+`,o=this.createBadge(s,"progress"),n=((c=(h=this.adapter).getBadgePosition)==null?void 0:c.call(h))||{bottom:"4px",left:"4px"};Object.assign(o.style,n),this.insertBadge(t.element,o)}applyNewBadge(t){const e=this.createBadge("NEW","new");e.style.cssText+="top: 4px; right: 4px;",this.insertBadge(t.element,e)}applyQuickActions(t,e){l.injectStyles();const r={continue:(s,o,n)=>this.handleContinueReading(s,t),status:(s,o,n)=>this.handleStatusChange(s,o,t),rating:(s,o,n)=>this.handleRatingChange(s,o,t),details:(s,o,n)=>this.handleViewDetails(s,t)},a=l.create(e,this.adapter,r);t.element.style.position="relative",t.element.appendChild(a)}handleContinueReading(t,e){var s,o;const r=l.calculateNextChapter(t),a=(o=(s=this.adapter).buildChapterUrl)==null?void 0:o.call(s,t,r);a?window.location.href=a:t.mangafireUrl||t.sourceUrl?window.location.href=t.mangafireUrl||t.sourceUrl||"":e.data.url?window.location.href=e.data.url:console.log("[CardEnhancer] No URL available for continue reading:",t)}handleStatusChange(t,e,r){document.querySelectorAll(".bmh-status-picker").forEach(o=>o.remove());const a=l.createStatusPicker(t,(o,n)=>this.saveStatusChange(n,o),this.settings.customBookmarks),s=e.getBoundingClientRect();a.style.left=`${s.left}px`,a.style.top=`${s.bottom+8}px`,document.body.appendChild(a)}handleRatingChange(t,e,r){document.querySelectorAll(".bmh-rating-picker").forEach(o=>o.remove());const a=l.createRatingPicker(t,(o,n)=>this.saveRatingChange(n,o)),s=e.getBoundingClientRect();a.style.left=`${s.left}px`,a.style.top=`${s.bottom+8}px`,document.body.appendChild(a)}handleViewDetails(t,e){chrome.runtime.sendMessage({type:"showMangaDetails",title:t.title},()=>{chrome.runtime.lastError&&console.log("[CardEnhancer] Error opening details:",chrome.runtime.lastError)})}async saveStatusChange(t,e){try{const r=await new Promise(i=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks"],i)}),a=r.savedEntriesMerged||[],s=r.userBookmarks||[],o=a.findIndex(i=>this.normalizeTitle(i.title)===this.normalizeTitle(t.title));o!==-1&&(a[o].status=e);const n=s.findIndex(i=>this.normalizeTitle(i.title)===this.normalizeTitle(t.title));n!==-1&&(s[n].status=e),await new Promise(i=>{chrome.storage.local.set({savedEntriesMerged:a,userBookmarks:s},i)}),console.log(`[CardEnhancer] Status updated: ${t.title} → ${e}`),this.enhanceAll()}catch(r){console.error("[CardEnhancer] Failed to save status:",r)}}async saveRatingChange(t,e){try{const a=(await new Promise(o=>{chrome.storage.local.get(["savedEntriesMerged"],o)})).savedEntriesMerged||[],s=a.findIndex(o=>this.normalizeTitle(o.title)===this.normalizeTitle(t.title));s!==-1&&(a[s].personalData||(a[s].personalData={}),a[s].personalData.rating=e,await new Promise(o=>{chrome.storage.local.set({savedEntriesMerged:a},o)}),console.log(`[CardEnhancer] Rating updated: ${t.title} → ${e}`))}catch(r){console.error("[CardEnhancer] Failed to save rating:",r)}}createBadge(t,e){const r=document.createElement("div");return r.className=`bmh-badge bmh-badge-${e}`,r.textContent=t,r.style.cssText=`
            position: absolute;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            z-index: 20;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        `,e==="new"&&(r.style.background="#ef4444",r.style.animation="bmh-pulse 2s infinite"),r}insertBadge(t,e){var s,o;const r=t.querySelector(`.bmh-badge-${(s=e.classList[1])==null?void 0:s.replace("bmh-badge-","")}`);r&&r.remove();const a=((o=t.querySelector('div[class*="cover"], div[class*="thumb"], [class*="img"]'))==null?void 0:o.parentElement)||t;a.style.position="relative",a.appendChild(e)}normalizeTitle(t){return t?t.toLowerCase().replace(/[^a-z0-9]/g,""):""}getHighestChapter(t){if(!t||t.length===0)return 0;let e=0;return t.forEach(r=>{const a=String(r).match(/^(\d+\.?\d*)/);if(a){const s=parseFloat(a[1]);s>e&&(e=s)}}),e}}class C{constructor(t={}){this.speed=t.speed||50,this.isRunning=!1,this.intervalId=null,this.showPanel=t.showPanel!==!1,this.panel=null,this.scrollTarget=null,this.lastScrollPos=-1,this.stuckCount=0}findScrollTarget(){const t=["#chapter-reader",".chapter-content",".reader-content",".reading-content","#content",".manga-reader",".read-container","main","article",".container"];for(const s of t){const o=document.querySelector(s);if(o){const n=window.getComputedStyle(o);if((n.overflow==="auto"||n.overflow==="scroll"||n.overflowY==="auto"||n.overflowY==="scroll")&&o.scrollHeight>o.clientHeight)return{element:o,useElement:!0}}}const e=document.documentElement;if(document.body.scrollHeight>window.innerHeight||e.scrollHeight>window.innerHeight)return{element:window,useElement:!1};const a=document.querySelectorAll("*");for(const s of a)if(s.scrollHeight>s.clientHeight+100){const o=window.getComputedStyle(s);if(o.overflow==="auto"||o.overflow==="scroll"||o.overflowY==="auto"||o.overflowY==="scroll")return{element:s,useElement:!0}}return{element:window,useElement:!1}}getScrollPos(){return this.scrollTarget.useElement?this.scrollTarget.element.scrollTop:window.scrollY||window.pageYOffset||document.documentElement.scrollTop}doScroll(t){this.scrollTarget.useElement?this.scrollTarget.element.scrollTop+=t:window.scrollBy(0,t)}start(){if(this.isRunning)return;this.scrollTarget=this.findScrollTarget(),this.isRunning=!0,this.lastScrollPos=this.getScrollPos(),this.stuckCount=0;const t=this.speed/60;this.intervalId=setInterval(()=>{if(!this.isRunning){this.stop();return}this.doScroll(t);const e=this.getScrollPos();if(Math.abs(e-this.lastScrollPos)<.1){if(this.stuckCount++,this.stuckCount>60){this.stop();return}}else this.stuckCount=0;this.lastScrollPos=e},1e3/60),this.updatePanelState()}stop(){this.intervalId&&(clearInterval(this.intervalId),this.intervalId=null),this.isRunning=!1,this.updatePanelState()}toggle(){this.isRunning?this.stop():this.start()}setSpeed(t){this.speed=Math.max(10,Math.min(300,t)),this.isRunning&&(this.stop(),this.start())}updatePanelState(){if(!this.panel)return;const t=this.panel.querySelector(".bmh-as-toggle");t&&(t.textContent=this.isRunning?"⏸ Stop":"▶ Start",t.className="bmh-as-toggle"+(this.isRunning?" active":""))}createControlPanel(){const t=document.querySelector(".bmh-autoscroll-panel");t&&t.remove();const e=document.createElement("div");e.className="bmh-autoscroll-panel",e.innerHTML=`
            <button class="bmh-as-toggle" type="button">▶ Start</button>
            <div class="bmh-as-speed-control">
                <span class="bmh-as-label">Speed:</span>
                <input type="range" class="bmh-as-speed" min="20" max="200" value="${this.speed}">
                <span class="bmh-as-speed-value">${this.speed}</span>
            </div>
        `;const r=this;e.querySelector(".bmh-as-toggle").onclick=function(o){return o.preventDefault(),o.stopPropagation(),r.toggle(),!1};const a=e.querySelector(".bmh-as-speed"),s=e.querySelector(".bmh-as-speed-value");return a.oninput=function(o){const n=parseInt(o.target.value);r.setSpeed(n),s.textContent=n},this.injectStyles(),document.body.appendChild(e),this.panel=e,e}injectStyles(){if(document.getElementById("bmh-autoscroll-styles"))return;const t=document.createElement("style");t.id="bmh-autoscroll-styles",t.textContent=`
            .bmh-autoscroll-panel {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                background: rgba(0, 0, 0, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 10px !important;
                padding: 10px 14px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                z-index: 2147483647 !important;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                font-size: 13px !important;
                color: white !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
            }
            .bmh-as-toggle {
                background: #4f46e5 !important;
                color: white !important;
                border: none !important;
                padding: 8px 14px !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                min-width: 70px !important;
            }
            .bmh-as-toggle:hover { background: #4338ca !important; }
            .bmh-as-toggle.active { background: #dc2626 !important; }
            .bmh-as-toggle.active:hover { background: #b91c1c !important; }
            .bmh-as-speed-control {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .bmh-as-label {
                color: rgba(255, 255, 255, 0.7) !important;
                font-size: 11px !important;
            }
            .bmh-as-speed {
                width: 60px !important;
                height: 4px !important;
                -webkit-appearance: none !important;
                background: rgba(255, 255, 255, 0.3) !important;
                border-radius: 2px !important;
            }
            .bmh-as-speed::-webkit-slider-thumb {
                -webkit-appearance: none !important;
                width: 12px !important;
                height: 12px !important;
                background: white !important;
                border-radius: 50% !important;
            }
            .bmh-as-speed-value {
                color: rgba(255, 255, 255, 0.9) !important;
                font-size: 11px !important;
                min-width: 24px !important;
            }
        `,document.head.appendChild(t)}init(){this.showPanel&&this.createControlPanel(),window.bmhAutoScroll=this}destroy(){this.stop(),this.panel&&(this.panel.remove(),this.panel=null),delete window.bmhAutoScroll}}const g=class g{constructor(t){this.adapter=t,this.bindings=new Map,this.enabled=!0,this.boundHandler=this.handleKey.bind(this)}async loadBindings(){try{const e=(await chrome.storage.local.get("keybinds")).keybinds||{},r={...g.defaults,...e};Object.entries(r).forEach(([a,s])=>{this.bindings.set(a,s)}),console.log("[Keybinds] Loaded",this.bindings.size,"bindings")}catch(t){console.warn("[Keybinds] Failed to load bindings:",t),Object.entries(g.defaults).forEach(([e,r])=>{this.bindings.set(e,r)})}}async saveBindings(){try{const t=Object.fromEntries(this.bindings);await chrome.storage.local.set({keybinds:t})}catch(t){console.warn("[Keybinds] Failed to save bindings:",t)}}start(){document.addEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Started listening")}stop(){document.removeEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Stopped listening")}setEnabled(t){this.enabled=t}handleKey(t){if(!this.enabled||["INPUT","TEXTAREA","SELECT"].includes(t.target.tagName)||t.target.isContentEditable||t.ctrlKey||t.altKey||t.metaKey)return;const e=this.bindings.get(t.key);e&&(t.preventDefault(),t.stopPropagation(),this.executeAction(e))}executeAction(t){const r={nextPage:()=>{var a,s;return((s=(a=this.adapter).goToNextPage)==null?void 0:s.call(a))||this.scrollPage(1)},prevPage:()=>{var a,s;return((s=(a=this.adapter).goToPrevPage)==null?void 0:s.call(a))||this.scrollPage(-1)},nextChapter:()=>{var a,s;return(s=(a=this.adapter).goToNextChapter)==null?void 0:s.call(a)},prevChapter:()=>{var a,s;return(s=(a=this.adapter).goToPrevChapter)==null?void 0:s.call(a)},scrollDown:()=>window.scrollBy({top:window.innerHeight*.5,behavior:"smooth"}),scrollUp:()=>window.scrollBy({top:-window.innerHeight*.5,behavior:"smooth"}),scrollToTop:()=>window.scrollTo({top:0,behavior:"smooth"}),scrollToBottom:()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}),toggleAutoScroll:()=>{var a;return(a=window.bmhAutoScroll)==null?void 0:a.toggle()},speedUp:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed+20)},speedDown:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed-20)},toggleFullscreen:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(a=>{console.warn("[Keybinds] Fullscreen failed:",a)})},exitReader:()=>{var a,s;document.fullscreenElement?document.exitFullscreen():(s=(a=this.adapter).exitReader)==null||s.call(a)}}[t];r?(r(),console.log("[Keybinds] Executed:",t)):console.warn("[Keybinds] Unknown action:",t)}scrollPage(t){window.scrollBy({top:window.innerHeight*.5*t,behavior:"smooth"})}setBinding(t,e){this.bindings.set(t,e),this.saveBindings()}removeBinding(t){this.bindings.delete(t),this.saveBindings()}resetToDefaults(){this.bindings.clear(),Object.entries(g.defaults).forEach(([t,e])=>{this.bindings.set(t,e)}),this.saveBindings()}async init(){await this.loadBindings(),this.start(),window.bmhKeybinds=this,console.log("[Keybinds] Initialized")}destroy(){this.stop(),delete window.bmhKeybinds}};m(g,"defaults",{ArrowDown:"scrollDown",ArrowUp:"scrollUp"," ":"toggleAutoScroll",Escape:"exitReader",f:"toggleFullscreen",F:"toggleFullscreen",n:"nextChapter",N:"nextChapter",p:"prevChapter",P:"prevChapter",Home:"scrollToTop",End:"scrollToBottom"});let f=g;const b=class b{constructor(t){this.adapter=t,this.currentEntry=null,this.saveTimeout=null,this.isSaved=!1}async init(){const t=this.parseCurrentUrl();if(!t||!t.chapterNo){console.log("[ProgressTracker] Not a chapter page, skipping");return}this.currentEntry={source:this.adapter.id||this.adapter.PREFIX,slug:t.slug,id:t.id,chapter:String(t.chapterNo),url:window.location.href},console.log("[ProgressTracker] Tracking:",this.currentEntry),this.saveTimeout=setTimeout(()=>this.saveProgress(),b.SAVE_DELAY),this.setupScrollTracking()}parseCurrentUrl(){if(this.adapter.parseUrl)return this.adapter.parseUrl(window.location.href);const t=window.location.href,e=t.match(/\/read\/([^/]+)\.(\d+)\/\w+\/chapter-(\d+(?:\.\d+)?)/);if(e)return{slug:e[1],id:e[2],chapterNo:parseFloat(e[3])};const r=t.match(/mangadex\.org\/chapter\/([a-f0-9-]+)/i);if(r)return{chapterId:r[1],chapterNo:null};const a=t.match(/webtoons\.com.*episode_no=(\d+)/i);if(a){const s=t.match(/\/([^/]+)\/list\?/);return{slug:(s==null?void 0:s[1])||"unknown",chapterNo:parseInt(a[1])}}return null}setupScrollTracking(){let t=!1;const e=()=>{if(t||this.isSaved)return;window.scrollY/(document.body.scrollHeight-window.innerHeight)>.25&&(t=!0,this.saveProgress())};window.addEventListener("scroll",e,{passive:!0})}async saveProgress(){if(this.isSaved||!this.currentEntry)return;this.isSaved=!0;const{source:t,slug:e,chapter:r,url:a,id:s}=this.currentEntry;try{const o=e||`${t}:${s}`,n=await chrome.storage.local.get(["savedReadChapters","savedEntriesMerged"]),i=n.savedReadChapters||{},h=n.savedEntriesMerged||[];i[o]||(i[o]=[]),i[o].includes(r)||(i[o].push(r),i[o].sort((d,u)=>parseFloat(d)-parseFloat(u)));const c=h.find(d=>{if(d.source===t&&d.sourceId===s||d.slug===e||d.slug===o)return!0;const u=e==null?void 0:e.toLowerCase().replace(/[^a-z0-9]/g,""),k=(d.slug||d.title||"").toLowerCase().replace(/[^a-z0-9]/g,"");return u&&u===k});if(c){const d=parseFloat(r),u=parseFloat(c.lastReadChapter)||0;d>u&&(c.lastReadChapter=r,c.lastMangafireUrl=a),c.lastReadDate=Date.now(),c.readChapters=i[o].length,console.log("[ProgressTracker] Updated library entry:",c.title||e)}await chrome.storage.local.set({savedReadChapters:i,savedEntriesMerged:h}),console.log(`[ProgressTracker] ✓ Saved progress: ${e} ch.${r}`);try{chrome.runtime.sendMessage({action:"progressSaved",data:{source:t,slug:e,chapter:r}})}catch{}}catch(o){console.error("[ProgressTracker] Failed to save progress:",o),this.isSaved=!1}}destroy(){this.saveTimeout&&(clearTimeout(this.saveTimeout),this.saveTimeout=null)}};m(b,"SAVE_DELAY",5e3);let w=b;class T{constructor(t,e={}){this.adapter=t,this.options={autoScroll:e.autoScroll!==!1,keybinds:e.keybinds!==!1,progressTracking:e.progressTracking!==!1},this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}isReaderPage(){if(this.adapter.isReaderPage)return this.adapter.isReaderPage();const t=window.location.href;return[/\/read\//i,/\/chapter\//i,/episode_no=/i,/\/viewer/i,/chapter-\d+/i].some(r=>r.test(t))}async init(){if(!this.isReaderPage()){console.log("[ReaderEnhancements] Not a reader page, skipping init");return}console.log("[ReaderEnhancements] Initializing on reader page...");const t=await this.loadSettings();this.options.autoScroll&&t.autoScrollEnabled!==!1&&(this.autoScroll=new C({speed:t.autoScrollSpeed||50,showPanel:!0}),this.autoScroll.init()),this.options.keybinds&&t.keybindsEnabled!==!1&&(this.keybinds=new f(this.adapter),await this.keybinds.init()),this.options.progressTracking&&t.progressTrackingEnabled!==!1&&(this.progressTracker=new w(this.adapter),await this.progressTracker.init()),this.isInitialized=!0,console.log("[ReaderEnhancements] Initialized successfully")}async loadSettings(){try{return await chrome.storage.local.get(["autoScrollEnabled","autoScrollSpeed","keybindsEnabled","progressTrackingEnabled"])}catch(t){return console.warn("[ReaderEnhancements] Failed to load settings:",t),{}}}destroy(){var t,e,r;(t=this.autoScroll)==null||t.destroy(),(e=this.keybinds)==null||e.destroy(),(r=this.progressTracker)==null||r.destroy(),this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}}export{S as C,l as O,T as R};
