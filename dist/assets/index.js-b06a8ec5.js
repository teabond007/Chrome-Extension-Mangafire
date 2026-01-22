(function(){var $=Object.defineProperty;var A=(u,c,g)=>c in u?$(u,c,{enumerable:!0,configurable:!0,writable:!0,value:g}):u[c]=g;var k=(u,c,g)=>(A(u,typeof c!="symbol"?c+"":c,g),g);(()=>{const u={Reading:"#4ade80",Completed:"#60a5fa","Plan to Read":"#fbbf24","On-Hold":"#f97316","On Hold":"#f97316",Dropped:"#ef4444","Re-reading":"#a855f7",HasHistory:"#9ca3af"};class c{static create(e,t,n={}){var p;const a=document.createElement("div");a.className="bmh-quick-tooltip",a.dataset.entryId=e.slug||e.id||"";const r=t.unitName==="episode"?"Ep.":"Ch.",s=parseFloat(e.lastReadChapter)||0,i=c.calculateNextChapter(e),l=c.getStatusColor(e.status),d=((p=e.personalData)==null?void 0:p.rating)||0,h=s>0;return a.innerHTML=`
            <button class="bmh-tt-btn bmh-tt-continue ${h?"":"bmh-btn-disabled"}" 
                    data-action="continue" 
                    title="${h?`Continue ${r} ${i}`:`Start Reading ${r} 1`}">
                ▶
            </button>
            <button class="bmh-tt-btn bmh-tt-status" data-action="status" title="${e.status||"Set Status"}" style="--status-color: ${l}">
                <span class="bmh-tt-status-dot" style="background: ${l}"></span>
            </button>
            <button class="bmh-tt-btn bmh-tt-rating" data-action="rating" title="Rating: ${d}/10">
                ${d>0?d:"★"}
            </button>
            <button class="bmh-tt-btn bmh-tt-info" data-action="details" title="View Details">
                ℹ
            </button>
        `,c.attachEventListeners(a,e,n),a}static createExpanded(e,t,n={}){var l;const a=document.createElement("div");a.className="bmh-quick-actions bmh-qa-expanded",a.dataset.entryId=e.slug||e.id||"";const r=t.unitName==="episode"?"Ep.":"Ch.",s=c.calculateNextChapter(e),i=((l=e.personalData)==null?void 0:l.rating)||0;return a.innerHTML=`
            <div class="bmh-qa-content">
                <button class="bmh-qa-btn bmh-qa-continue" data-action="continue" title="Continue to ${r} ${s}">
                    <span class="bmh-qa-icon">▶</span>
                    Continue ${r} ${s}
                </button>
                <button class="bmh-qa-btn bmh-qa-status" data-action="status" title="Change reading status">
                    <span class="bmh-qa-status-indicator" style="background: ${c.getStatusColor(e.status)}"></span>
                    ${e.status||"Add to Library"}
                </button>
                <div class="bmh-qa-row">
                    <div class="bmh-qa-rating" data-action="rating" title="Rate (${i}/10)">
                        ${c.renderRatingBadge(i)}
                    </div>
                    <button class="bmh-qa-btn bmh-qa-details" data-action="details" title="View details">
                        <span class="bmh-qa-icon">ℹ️</span>
                    </button>
                </div>
            </div>
        `,c.attachEventListeners(a,e,n),a}static attachEventListeners(e,t,n){e.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation(),r.preventDefault();const s=a.dataset.action;n[s]&&n[s](t,a,r)})})}static calculateNextChapter(e){const t=parseFloat(e.lastReadChapter)||0;return Math.floor(t)+1}static renderRatingBadge(e){return!e||e<=0?'<span class="bmh-rating-badge bmh-rating-empty">-</span>':`<span class="bmh-rating-badge">${e}/10</span>`}static getStatusColor(e){return{reading:"#4ade80",completed:"#60a5fa","plan to read":"#fbbf24",planning:"#fbbf24","on-hold":"#f97316","on hold":"#f97316",dropped:"#ef4444","re-reading":"#a855f7",rereading:"#a855f7"}[(e||"").toLowerCase().trim()]||"rgba(255,255,255,0.3)"}static createStatusPicker(e,t,n=[]){const a=document.createElement("div");a.className="bmh-status-picker";const r=[{name:"Reading",color:"#4ade80"},{name:"Completed",color:"#60a5fa"},{name:"Plan to Read",color:"#fbbf24"},{name:"On-Hold",color:"#f97316"},{name:"Dropped",color:"#ef4444"},{name:"Re-reading",color:"#a855f7"},...n];return a.innerHTML=`
            <div class="bmh-picker-header">Change Status</div>
            <div class="bmh-picker-options">
                ${r.map(s=>`
                    <button class="bmh-picker-option ${e.status===s.name?"active":""}" 
                            data-status="${s.name}">
                        <span class="bmh-picker-dot" style="background: ${s.color}"></span>
                        ${s.name}
                    </button>
                `).join("")}
            </div>
        `,a.querySelectorAll("[data-status]").forEach(s=>{s.addEventListener("click",i=>{i.stopPropagation(),t==null||t(s.dataset.status,e),a.remove()})}),c.autoCloseOnOutsideClick(a),a}static createRatingPicker(e,t){var s;const n=document.createElement("div");n.className="bmh-rating-picker";const a=((s=e.personalData)==null?void 0:s.rating)||0;n.innerHTML=`
            <div class="bmh-picker-header">Rate (1-10)</div>
            <div class="bmh-rating-grid">
                ${[1,2,3,4,5,6,7,8,9,10].map(i=>`
                    <button class="bmh-rating-num ${i===a?"active":""}" 
                            data-rating="${i}">
                        ${i}
                    </button>
                `).join("")}
            </div>
            <button class="bmh-rating-clear" data-rating="0">Clear</button>
        `;const r=n.querySelectorAll(".bmh-rating-num");return r.forEach((i,l)=>{i.addEventListener("mouseenter",()=>{r.forEach((d,h)=>{d.classList.toggle("hovered",h<=l)})})}),n.querySelector(".bmh-rating-grid").addEventListener("mouseleave",()=>{r.forEach(i=>i.classList.remove("hovered"))}),n.querySelectorAll("[data-rating]").forEach(i=>{i.addEventListener("click",l=>{l.stopPropagation();const d=parseInt(i.dataset.rating);t==null||t(d,e),n.remove()})}),c.autoCloseOnOutsideClick(n),n}static autoCloseOnOutsideClick(e){setTimeout(()=>{const t=n=>{e.contains(n.target)||(e.remove(),document.removeEventListener("click",t))};document.addEventListener("click",t)},0)}static autoCloseOnOutsideClick(e){setTimeout(()=>{const t=n=>{e.contains(n.target)||(e.remove(),document.removeEventListener("click",t))};document.addEventListener("click",t)},0)}static injectStyles(){if(document.getElementById("bmh-overlay-styles"))return;const e=document.createElement("style");e.id="bmh-overlay-styles",e.textContent=`
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
        `,document.head.appendChild(e)}static injectPickerStyles(){c.injectStyles()}}class g{constructor(e,t={}){this.adapter=e,this.settings={highlighting:t.highlighting!==!1,progressBadges:t.progressBadges!==!1,quickActions:t.quickActions===!0,newChapterBadges:t.newChapterBadges===!0,border:{size:t.CustomBorderSize||4,style:t.borderStyle||"solid",radius:"8px"},customBookmarks:t.customBookmarks||[],customBookmarksEnabled:t.CustomBookmarksfeatureEnabled||!1}}async enhanceAll(){const e=this.findCards(),t=await this.loadLibrary();let n=0;for(const a of e){if(a.element.dataset.bmhEnhanced)continue;const r=this.findMatch(a,t);r&&(this.applyEnhancements(a,r),n++),a.element.dataset.bmhEnhanced="true"}return n}findCards(){const e=this.adapter.selectors.card;return e?Array.from(document.querySelectorAll(e)).map(t=>({element:t,data:this.adapter.extractCardData(t)})).filter(t=>t.data.title||t.data.id):[]}async loadLibrary(){return new Promise(e=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks","savedReadChapters"],t=>{if(chrome.runtime.lastError)return void e([]);const n=Array.isArray(t.savedEntriesMerged)?t.savedEntriesMerged:[],a=Array.isArray(t.userBookmarks)?t.userBookmarks:[],r=t.savedReadChapters||{},s=new Map;[...a,...n].forEach(i=>{if(i!=null&&i.title){const l=this.findHistoryKey(i.title,i.slug,r);i.readChapters=l?r[l]:[],i.lastReadChapter=this.getHighestChapter(i.readChapters),s.set(i.title,i)}}),e(Array.from(s.values()))})})}findHistoryKey(e,t,n){if(!n)return null;if(t){const r=`${this.adapter.PREFIX||""}${t}`;if(n[r])return r;if(n[t])return t;if(t.includes(".")){const s=t.substring(0,t.lastIndexOf("."));if(n[s])return s}}if(n[e])return e;const a=this.normalizeTitle(e);for(const r of Object.keys(n))if(this.normalizeTitle(r)===a)return r;return null}findMatch(e,t){const n=t.find(r=>r.source===this.adapter.id&&r.sourceId===e.data.id);if(n)return n;const a=this.normalizeTitle(e.data.title);return t.find(r=>this.normalizeTitle(r.title)===a)}applyEnhancements(e,t){var n;this.settings.highlighting&&this.applyBorder(e,t),this.settings.progressBadges&&((n=t.readChapters)==null?void 0:n.length)>0&&this.applyProgressBadge(e,t),this.settings.newChapterBadges&&t.hasNewChapters&&this.applyNewBadge(e),this.settings.quickActions&&this.applyQuickActions(e,t)}applyBorder(e,t){var s;const n=((s=t.status)==null?void 0:s.trim().toLowerCase())||"";let a="transparent",r=this.settings.border.style;for(const[i,l]of Object.entries(u))if(n.includes(i.toLowerCase())){a=l;break}if(this.settings.customBookmarksEnabled&&this.settings.customBookmarks.forEach(i=>{i.name&&n.includes(i.name.toLowerCase())&&(a=i.color,r=i.style||"solid")}),a!=="transparent")if(this.adapter.applyBorder)this.adapter.applyBorder(e.element,a,this.settings.border.size,r);else{const i=e.element.closest("li")||e.element;i.style.setProperty("border",`${this.settings.border.size}px ${r} ${a}`,"important"),i.style.setProperty("border-radius",this.settings.border.radius,"important"),i.style.setProperty("box-sizing","border-box","important")}}applyProgressBadge(e,t){var l,d,h;const n=this.adapter.unitName==="episode"?"Ep.":"Ch.",a=t.chapters||((l=t.anilistData)==null?void 0:l.chapters),r=a?`${n} ${t.lastReadChapter}/${a}`:`${n} ${t.lastReadChapter}+`,s=this.createBadge(r,"progress"),i=((h=(d=this.adapter).getBadgePosition)==null?void 0:h.call(d))||{bottom:"4px",left:"4px"};Object.assign(s.style,i),this.insertBadge(e.element,s)}applyNewBadge(e){const t=this.createBadge("NEW","new");t.style.cssText+="top: 4px; right: 4px;",this.insertBadge(e.element,t)}applyQuickActions(e,t){c.injectStyles();const n={continue:(r,s,i)=>this.handleContinueReading(r,e),status:(r,s,i)=>this.handleStatusChange(r,s,e),rating:(r,s,i)=>this.handleRatingChange(r,s,e),details:(r,s,i)=>this.handleViewDetails(r,e)},a=c.create(t,this.adapter,n);e.element.style.position="relative",e.element.appendChild(a)}handleContinueReading(e,t){var r,s;const n=c.calculateNextChapter(e),a=(s=(r=this.adapter).buildChapterUrl)==null?void 0:s.call(r,e,n);a?window.location.href=a:e.mangafireUrl||e.sourceUrl?window.location.href=e.mangafireUrl||e.sourceUrl:t.data.url?window.location.href=t.data.url:console.log("[CardEnhancer] No URL available for continue reading:",e)}handleStatusChange(e,t,n){document.querySelectorAll(".bmh-status-picker").forEach(s=>s.remove());const a=c.createStatusPicker(e,(s,i)=>this.saveStatusChange(i,s),this.settings.customBookmarks),r=t.getBoundingClientRect();a.style.left=`${r.left}px`,a.style.top=`${r.bottom+8}px`,document.body.appendChild(a)}handleRatingChange(e,t,n){document.querySelectorAll(".bmh-rating-picker").forEach(s=>s.remove());const a=c.createRatingPicker(e,(s,i)=>this.saveRatingChange(i,s)),r=t.getBoundingClientRect();a.style.left=`${r.left}px`,a.style.top=`${r.bottom+8}px`,document.body.appendChild(a)}handleViewDetails(e,t){chrome.runtime.sendMessage({type:"showMangaDetails",title:e.title},()=>{chrome.runtime.lastError&&console.log("[CardEnhancer] Error opening details:",chrome.runtime.lastError)})}async saveStatusChange(e,t){try{const n=await new Promise(l=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks"],l)}),a=n.savedEntriesMerged||[],r=n.userBookmarks||[],s=a.findIndex(l=>this.normalizeTitle(l.title)===this.normalizeTitle(e.title));s!==-1&&(a[s].status=t);const i=r.findIndex(l=>this.normalizeTitle(l.title)===this.normalizeTitle(e.title));i!==-1&&(r[i].status=t),await new Promise(l=>{chrome.storage.local.set({savedEntriesMerged:a,userBookmarks:r},l)}),console.log(`[CardEnhancer] Status updated: ${e.title} → ${t}`),this.enhanceAll()}catch(n){console.error("[CardEnhancer] Failed to save status:",n)}}async saveRatingChange(e,t){try{const n=(await new Promise(r=>{chrome.storage.local.get(["savedEntriesMerged"],r)})).savedEntriesMerged||[],a=n.findIndex(r=>this.normalizeTitle(r.title)===this.normalizeTitle(e.title));a!==-1&&(n[a].personalData||(n[a].personalData={}),n[a].personalData.rating=t,await new Promise(r=>{chrome.storage.local.set({savedEntriesMerged:n},r)}),console.log(`[CardEnhancer] Rating updated: ${e.title} → ${t}`))}catch(n){console.error("[CardEnhancer] Failed to save rating:",n)}}createBadge(e,t){const n=document.createElement("div");return n.className=`bmh-badge bmh-badge-${t}`,n.textContent=e,n.style.cssText=`
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
        `,t==="new"&&(n.style.background="#ef4444",n.style.animation="bmh-pulse 2s infinite"),n}insertBadge(e,t){var r,s;const n=e.querySelector(`.bmh-badge-${(r=t.classList[1])==null?void 0:r.replace("bmh-badge-","")}`);n&&n.remove();const a=((s=e.querySelector('div[class*="cover"], div[class*="thumb"], [class*="img"]'))==null?void 0:s.parentElement)||e;a.style.position="relative",a.appendChild(t)}normalizeTitle(e){return e?e.toLowerCase().replace(/[^a-z0-9]/g,""):""}getHighestChapter(e){if(!e||e.length===0)return 0;let t=0;return e.forEach(n=>{const a=String(n).match(/^(\d+\.?\d*)/);if(a){const r=parseFloat(a[1]);r>t&&(t=r)}}),t}}const C=class{constructor(o={}){this.speed=o.speed||50,this.isRunning=!1,this.intervalId=null,this.showPanel=o.showPanel!==!1,this.panel=null,this.scrollTarget=null,this.lastScrollPos=-1,this.stuckCount=0}findScrollTarget(){const o=["#chapter-reader",".chapter-content",".reader-content",".reading-content","#content",".manga-reader",".read-container","main","article",".container"];for(const n of o){const a=document.querySelector(n);if(a){const r=window.getComputedStyle(a);if((r.overflow==="auto"||r.overflow==="scroll"||r.overflowY==="auto"||r.overflowY==="scroll")&&a.scrollHeight>a.clientHeight)return{element:a,useElement:!0}}}const e=document.documentElement;if(document.body.scrollHeight>window.innerHeight||e.scrollHeight>window.innerHeight)return{element:window,useElement:!1};const t=document.querySelectorAll("*");for(const n of t)if(n.scrollHeight>n.clientHeight+100){const a=window.getComputedStyle(n);if(a.overflow==="auto"||a.overflow==="scroll"||a.overflowY==="auto"||a.overflowY==="scroll")return{element:n,useElement:!0}}return{element:window,useElement:!1}}getScrollPos(){return this.scrollTarget.useElement?this.scrollTarget.element.scrollTop:window.scrollY||window.pageYOffset||document.documentElement.scrollTop}doScroll(o){this.scrollTarget.useElement?this.scrollTarget.element.scrollTop+=o:window.scrollBy(0,o)}start(){if(this.isRunning)return;this.scrollTarget=this.findScrollTarget(),this.isRunning=!0,this.lastScrollPos=this.getScrollPos(),this.stuckCount=0;const o=this.speed/60;this.intervalId=setInterval(()=>{if(!this.isRunning)return void this.stop();this.doScroll(o);const e=this.getScrollPos();if(Math.abs(e-this.lastScrollPos)<.1){if(this.stuckCount++,this.stuckCount>60)return void this.stop()}else this.stuckCount=0;this.lastScrollPos=e},1e3/60),this.updatePanelState()}stop(){this.intervalId&&(clearInterval(this.intervalId),this.intervalId=null),this.isRunning=!1,this.updatePanelState()}toggle(){this.isRunning?this.stop():this.start()}setSpeed(o){this.speed=Math.max(10,Math.min(300,o)),this.isRunning&&(this.stop(),this.start())}updatePanelState(){if(!this.panel)return;const o=this.panel.querySelector(".bmh-as-toggle");o&&(o.textContent=this.isRunning?"⏸ Stop":"▶ Start",o.className="bmh-as-toggle"+(this.isRunning?" active":""))}createControlPanel(){const o=document.querySelector(".bmh-autoscroll-panel");o&&o.remove();const e=document.createElement("div");e.className="bmh-autoscroll-panel",e.innerHTML=`
            <button class="bmh-as-toggle" type="button">▶ Start</button>
            <div class="bmh-as-speed-control">
                <span class="bmh-as-label">Speed:</span>
                <input type="range" class="bmh-as-speed" min="20" max="200" value="${this.speed}">
                <span class="bmh-as-speed-value">${this.speed}</span>
            </div>
        `;const t=this;e.querySelector(".bmh-as-toggle").onclick=function(r){return r.preventDefault(),r.stopPropagation(),t.toggle(),!1};const n=e.querySelector(".bmh-as-speed"),a=e.querySelector(".bmh-as-speed-value");return n.oninput=function(r){const s=parseInt(r.target.value);t.setSpeed(s),a.textContent=s},this.injectStyles(),document.body.appendChild(e),this.panel=e,e}injectStyles(){if(document.getElementById("bmh-autoscroll-styles"))return;const o=document.createElement("style");o.id="bmh-autoscroll-styles",o.textContent=`
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
        `,document.head.appendChild(o)}init(){this.showPanel&&this.createControlPanel(),window.bmhAutoScroll=this}destroy(){this.stop(),this.panel&&(this.panel.remove(),this.panel=null),delete window.bmhAutoScroll}},m=class m{constructor(e){this.adapter=e,this.bindings=new Map,this.enabled=!0,this.boundHandler=this.handleKey.bind(this)}async loadBindings(){try{const e=(await chrome.storage.local.get("keybinds")).keybinds||{},t={...m.defaults,...e};Object.entries(t).forEach(([n,a])=>{this.bindings.set(n,a)}),console.log("[Keybinds] Loaded",this.bindings.size,"bindings")}catch(e){console.warn("[Keybinds] Failed to load bindings:",e),Object.entries(m.defaults).forEach(([t,n])=>{this.bindings.set(t,n)})}}async saveBindings(){try{const e=Object.fromEntries(this.bindings);await chrome.storage.local.set({keybinds:e})}catch(e){console.warn("[Keybinds] Failed to save bindings:",e)}}start(){document.addEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Started listening")}stop(){document.removeEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Stopped listening")}setEnabled(e){this.enabled=e}handleKey(e){if(!this.enabled||["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)||e.target.isContentEditable||e.ctrlKey||e.altKey||e.metaKey)return;const t=this.bindings.get(e.key);t&&(e.preventDefault(),e.stopPropagation(),this.executeAction(t))}executeAction(e){const t={nextPage:()=>{var n,a;return((a=(n=this.adapter).goToNextPage)==null?void 0:a.call(n))||this.scrollPage(1)},prevPage:()=>{var n,a;return((a=(n=this.adapter).goToPrevPage)==null?void 0:a.call(n))||this.scrollPage(-1)},nextChapter:()=>{var n,a;return(a=(n=this.adapter).goToNextChapter)==null?void 0:a.call(n)},prevChapter:()=>{var n,a;return(a=(n=this.adapter).goToPrevChapter)==null?void 0:a.call(n)},scrollDown:()=>window.scrollBy({top:.5*window.innerHeight,behavior:"smooth"}),scrollUp:()=>window.scrollBy({top:.5*-window.innerHeight,behavior:"smooth"}),scrollToTop:()=>window.scrollTo({top:0,behavior:"smooth"}),scrollToBottom:()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}),toggleAutoScroll:()=>{var n;return(n=window.bmhAutoScroll)==null?void 0:n.toggle()},speedUp:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed+20)},speedDown:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed-20)},toggleFullscreen:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(n=>{console.warn("[Keybinds] Fullscreen failed:",n)})},exitReader:()=>{var n,a;document.fullscreenElement?document.exitFullscreen():(a=(n=this.adapter).exitReader)==null||a.call(n)}}[e];t?(t(),console.log("[Keybinds] Executed:",e)):console.warn("[Keybinds] Unknown action:",e)}scrollPage(e){window.scrollBy({top:.5*window.innerHeight*e,behavior:"smooth"})}setBinding(e,t){this.bindings.set(e,t),this.saveBindings()}removeBinding(e){this.bindings.delete(e),this.saveBindings()}resetToDefaults(){this.bindings.clear(),Object.entries(m.defaults).forEach(([e,t])=>{this.bindings.set(e,t)}),this.saveBindings()}async init(){await this.loadBindings(),this.start(),window.bmhKeybinds=this,console.log("[Keybinds] Initialized")}destroy(){this.stop(),delete window.bmhKeybinds}};k(m,"defaults",{ArrowDown:"scrollDown",ArrowUp:"scrollUp"," ":"toggleAutoScroll",Escape:"exitReader",f:"toggleFullscreen",F:"toggleFullscreen",n:"nextChapter",N:"nextChapter",p:"prevChapter",P:"prevChapter",Home:"scrollToTop",End:"scrollToBottom"});let w=m;const S=w,f=class f{constructor(e){this.adapter=e,this.currentEntry=null,this.saveTimeout=null,this.isSaved=!1}async init(){const e=this.parseCurrentUrl();e&&e.chapterNo?(this.currentEntry={source:this.adapter.id||this.adapter.PREFIX,slug:e.slug,id:e.id,chapter:String(e.chapterNo),url:window.location.href},console.log("[ProgressTracker] Tracking:",this.currentEntry),this.saveTimeout=setTimeout(()=>this.saveProgress(),f.SAVE_DELAY),this.setupScrollTracking()):console.log("[ProgressTracker] Not a chapter page, skipping")}parseCurrentUrl(){if(this.adapter.parseUrl)return this.adapter.parseUrl(window.location.href);const e=window.location.href,t=e.match(/\/read\/([^/]+)\.(\d+)\/\w+\/chapter-(\d+(?:\.\d+)?)/);if(t)return{slug:t[1],id:t[2],chapterNo:parseFloat(t[3])};const n=e.match(/mangadex\.org\/chapter\/([a-f0-9-]+)/i);if(n)return{chapterId:n[1],chapterNo:null};const a=e.match(/webtoons\.com.*episode_no=(\d+)/i);if(a){const r=e.match(/\/([^/]+)\/list\?/);return{slug:(r==null?void 0:r[1])||"unknown",chapterNo:parseInt(a[1])}}return null}setupScrollTracking(){let e=!1;window.addEventListener("scroll",()=>{e||this.isSaved||window.scrollY/(document.body.scrollHeight-window.innerHeight)>.25&&(e=!0,this.saveProgress())},{passive:!0})}async saveProgress(){if(this.isSaved||!this.currentEntry)return;this.isSaved=!0;const{source:e,slug:t,chapter:n,url:a,id:r}=this.currentEntry;try{const s=t||`${e}:${r}`,i=await chrome.storage.local.get(["savedReadChapters","savedEntriesMerged"]),l=i.savedReadChapters||{},d=i.savedEntriesMerged||[];l[s]||(l[s]=[]),l[s].includes(n)||(l[s].push(n),l[s].sort((p,y)=>parseFloat(p)-parseFloat(y)));const h=d.find(p=>{if(p.source===e&&p.sourceId===r||p.slug===t||p.slug===s)return!0;const y=t==null?void 0:t.toLowerCase().replace(/[^a-z0-9]/g,""),R=(p.slug||p.title||"").toLowerCase().replace(/[^a-z0-9]/g,"");return y&&y===R});h&&(parseFloat(n)>(parseFloat(h.lastReadChapter)||0)&&(h.lastReadChapter=n,h.lastMangafireUrl=a),h.lastReadDate=Date.now(),h.readChapters=l[s].length,console.log("[ProgressTracker] Updated library entry:",h.title||t)),await chrome.storage.local.set({savedReadChapters:l,savedEntriesMerged:d}),console.log(`[ProgressTracker] ✓ Saved progress: ${t} ch.${n}`);try{chrome.runtime.sendMessage({action:"progressSaved",data:{source:e,slug:t,chapter:n}})}catch{}}catch(s){console.error("[ProgressTracker] Failed to save progress:",s),this.isSaved=!1}}destroy(){this.saveTimeout&&(clearTimeout(this.saveTimeout),this.saveTimeout=null)}};k(f,"SAVE_DELAY",5e3);let v=f;const T=v,P=class{constructor(o,e={}){this.adapter=o,this.options={autoScroll:e.autoScroll!==!1,keybinds:e.keybinds!==!1,progressTracking:e.progressTracking!==!1},this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}isReaderPage(){if(this.adapter.isReaderPage)return this.adapter.isReaderPage();const o=window.location.href;return[/\/read\//i,/\/chapter\//i,/episode_no=/i,/\/viewer/i,/chapter-\d+/i].some(e=>e.test(o))}async init(){if(!this.isReaderPage())return void console.log("[ReaderEnhancements] Not a reader page, skipping init");console.log("[ReaderEnhancements] Initializing on reader page...");const o=await this.loadSettings();this.options.autoScroll&&o.autoScrollEnabled!==!1&&(this.autoScroll=new C({speed:o.autoScrollSpeed||50,showPanel:!0}),this.autoScroll.init()),this.options.keybinds&&o.keybindsEnabled!==!1&&(this.keybinds=new S(this.adapter),await this.keybinds.init()),this.options.progressTracking&&o.progressTrackingEnabled!==!1&&(this.progressTracker=new T(this.adapter),await this.progressTracker.init()),this.isInitialized=!0,console.log("[ReaderEnhancements] Initialized successfully")}async loadSettings(){try{return await chrome.storage.local.get(["autoScrollEnabled","autoScrollSpeed","keybindsEnabled","progressTrackingEnabled"])}catch(o){return console.warn("[ReaderEnhancements] Failed to load settings:",o),{}}}destroy(){var o,e,t;(o=this.autoScroll)==null||o.destroy(),(e=this.keybinds)==null||e.destroy(),(t=this.progressTracker)==null||t.destroy(),this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}},x={id:"mangafire",name:"MangaFire",unitName:"chapter",PREFIX:"",selectors:{card:".unit, .swiper-slide, #top-trending .swiper-slide",cardTitle:".info a, .info h6 a, .above a",cardLink:'a[href*="/manga/"]',cardCover:".poster img, img"},extractCardData(o){var s;let e="",t="",n="";const a=o.querySelector(".info a")||o.querySelector(".info h6 a")||o.querySelector(".above a");a&&(e=((s=a.textContent)==null?void 0:s.trim())||"");const r=o.querySelector(this.selectors.cardLink);return r&&(t=r.href,n=this.extractSlug(t)),{id:n,title:e,slug:n,url:t}},extractSlug(o){if(!o)return"";try{const e=o.match(/\/manga\/([^/?#]+)/);return e?e[1]:""}catch{return""}},applyBorder(o,e,t,n){let a=o;if(o.classList.contains("swiper-slide"))return void(o.querySelector(".swiper-inner")||o).style.setProperty("border-left",`${t}px ${n} ${e}`,"important");const r=o.closest("li");r&&(a=r),a.style.setProperty("border",`${t}px ${n} ${e}`,"important"),a.style.setProperty("border-radius","8px","important"),a.style.setProperty("box-sizing","border-box","important")},getBadgePosition:()=>({bottom:"4px",left:"4px"}),buildChapterUrl:(o,e)=>null,isReaderPage:()=>window.location.href.includes("/read/"),parseUrl(o){const e=o.match(/\/read\/([^/]+)\.?(\d*)\/(?:[^/]+\/)?chapter-([^/?#]+)/);return e?{slug:e[1],id:e[2]||null,chapterNo:parseFloat(e[3])}:null},goToNextChapter(){const o=document.querySelector('a.btn-next, .chapter-nav .next, [data-direction="next"]');o&&o.click()},goToPrevChapter(){const o=document.querySelector('a.btn-prev, .chapter-nav .prev, [data-direction="prev"]');o&&o.click()},exitReader(){const o=document.querySelector('a.manga-link, a[href*="/manga/"]');o?window.location.href=o.href:window.history.back()}};function E(){var a;if(!((a=chrome.runtime)!=null&&a.id))return;const o=window.location.href,{title:e,chapter:t,slugWithId:n}=function(r){if(!r)return{title:"",chapter:"",slugWithId:""};const s=r.match(/\/read\/([^/]+)\/(?:[^/]+\/)?chapter-([^/?#]+)/);if(!s)return{title:"",chapter:"",slugWithId:""};const i=s[1],l=s[2];let d=i.includes(".")?i.substring(0,i.lastIndexOf(".")):i;return d.endsWith("gg")&&(d=d.slice(0,-1)),{title:d,chapter:l,slugWithId:i}}(o);e&&t&&chrome.storage.local.get(["savedReadChapters"],r=>{if(chrome.runtime.lastError)return;let s=r.savedReadChapters||{};s[e]||(s[e]=[]),s[e].includes(t)||(s[e].push(t),chrome.storage.local.set({savedReadChapters:s},()=>{chrome.runtime.lastError||b(`Saved chapter ${t} for ${e}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:e,chapter:t,slugWithId:n,readChapters:s[e].length,source:"mangafire"},()=>{chrome.runtime.lastError})})}function b(o){var t;if(!((t=chrome.runtime)!=null&&t.id))return;const e=typeof o=="object"?JSON.stringify(o):o;chrome.runtime.sendMessage({type:"log",text:`[MangaFire] ${e}`},()=>{chrome.runtime.lastError})}async function B(){var a;if(!((a=chrome.runtime)!=null&&a.id))return;b("MangaFire CardEnhancer v3.8.0 (Bundled) initializing..."),function(){if(document.getElementById("bmh-mangafire-styles"))return;const r=document.createElement("style");r.id="bmh-mangafire-styles",r.textContent=`
        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `,document.head.appendChild(r),c.injectStyles()}();const o=await new Promise(r=>{chrome.storage.local.get(["MangaFireHighlightEnabled","MangaFireQuickActionsEnabled","CustomBorderSize","CustomBorderSizefeatureEnabled","CustomBookmarksfeatureEnabled","customBookmarks","MangaFireShowProgress"],s=>{chrome.runtime.lastError?r({}):r(s)})});if(o.MangaFireHighlightEnabled===!1)return void b("Highlighting disabled");const e=new g(x,{highlighting:!0,progressBadges:o.MangaFireShowProgress!==!1,quickActions:o.MangaFireQuickActionsEnabled!==!1,CustomBorderSize:o.CustomBorderSizefeatureEnabled?o.CustomBorderSize:4,CustomBookmarksfeatureEnabled:o.CustomBookmarksfeatureEnabled,customBookmarks:o.customBookmarks});let t;b(`Enhanced ${await e.enhanceAll()} cards (Quick Actions: ${o.MangaFireQuickActionsEnabled!==!1?"ON":"OFF"})`),window.location.href.includes("/read/")&&(E(),new P(x).init(),b("Reader enhancements initialized")),new MutationObserver(()=>{clearTimeout(t),t=setTimeout(()=>e.enhanceAll(),200)}).observe(document.body,{childList:!0,subtree:!0});let n=location.href;new MutationObserver(()=>{location.href!==n&&(n=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(r=>{delete r.dataset.bmhEnhanced}),setTimeout(()=>e.enhanceAll(),500),location.href.includes("/read/")&&setTimeout(E,1e3))}).observe(document,{subtree:!0,childList:!0})}window.addEventListener("load",()=>{setTimeout(B,500)})})();
})()
