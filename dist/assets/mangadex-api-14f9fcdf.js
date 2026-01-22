const y="https://graphql.anilist.co";let F=`
query ($search: String) {
  Page (page: 1, perPage: 1) {
    media (search: $search, type: MANGA) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      bannerImage
      format
      countryOfOrigin
      genres
      synonyms
      tags {
        name
      }
      status
      chapters
      volumes
      siteUrl
      averageScore
      popularity
      description
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      externalLinks {
        url
        site
        language
      }
    }
  }
}
`;function q(){return F}let S=0;const v=2e3,D=3,R=3e3;function $(a,e=!0){const t=e?Math.floor(Math.random()*500):0;return new Promise(r=>setTimeout(r,a+t))}function _(a,e=!1){let t=a.replace(/\s*\(.*?\)\s*/g," ").replace(/\s*\[.*?\]\s*/g," ").replace(/[:\-–—]/g," ").replace(/\s+/g," ").trim();return e&&([/colored/gi,/remake/gi,/full color/gi,/digital/gi,/vertical/gi,/scanlation/gi,/official/gi,/ver/gi,/manga/gi,/manhwa/gi,/manhua/gi,/remastered/gi,/raw/gi,/chapter/gi,/ch\.\d+/gi,/v\.\d+/gi].forEach(n=>{t=t.replace(n," ")}),t=t.replace(/[^a-zA-Z0-9 ]/g," "),t=t.replace(/\s+/g," ").trim()),t}async function w(a,e=0){const r=Date.now()-S;r<v&&await $(v-r),S=Date.now();let n=a;e===1&&(n=_(a,!1)),e>=2&&(n=_(a,!0));const s=await q();if(!s)return null;const m={method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:s,variables:{search:n}})};try{const i=await fetch(y,m);if(i.status===429){if(e<D){const o=parseInt(i.headers.get("Retry-After")||"60"),u=Math.min(o*1e3,R*Math.pow(2,e));return console.warn(`AniList rate limited. Waiting ${u/1e3}s before retry ${e+1}/${D}`),await $(u),w(a,e+1)}return console.error("AniList rate limit exceeded after max retries"),null}if(i.status>=500)return console.warn(`AniList Server Error (${i.status}): ${i.statusText}. Retrying...`),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null;if(!i.ok)return console.error(`AniList HTTP error: ${i.status} ${i.statusText} for title: "${n}"`),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null;const l=await i.json();if(l.errors)return console.warn("AniList API Error for title:",n,l.errors),e<2?w(a,e+1):null;if(l.data&&l.data.Page&&l.data.Page.media){const o=l.data.Page.media;return o.length===0?e<2?(console.log(`No results for "${n}", trying next strategy...`),w(a,e+1)):null:[...o].sort((d,g)=>{const c=p=>p.format==="MANGA"?100:p.format==="ONE_SHOT"?10:p.format==="NOVEL"?5:50;return c(g)-c(d)})[0]}}catch(i){return console.error("Network error fetching from AniList:",i),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null}}const I="https://api.mangadex.org";let j=0;const E=600,A=2,T=2e3,W=7*24*60*60*1e3;function N(a,e=!0){const t=e?Math.floor(Math.random()*300):0;return new Promise(r=>setTimeout(r,a+t))}function P(a,e=!1){let t=a.replace(/\s*\(.*?\)\s*/g," ").replace(/\s*\[.*?\]\s*/g," ").replace(/[:\-–—]/g," ").replace(/\s+/g," ").trim();return e&&([/colored/gi,/remake/gi,/full color/gi,/digital/gi,/vertical/gi,/scanlation/gi,/official/gi,/ver\./gi,/remastered/gi,/raw/gi,/chapter/gi,/ch\.\d+/gi].forEach(n=>{t=t.replace(n," ")}),t=t.replace(/[^a-zA-Z0-9 ]/g," ").replace(/\s+/g," ").trim()),t}async function G(a){return new Promise(e=>{chrome.storage.local.get(["mangadexCache"],t=>{const r=t.mangadexCache||{},n=a.toLowerCase().trim(),s=r[n];s&&Date.now()-s.timestamp<W?e(s.data):e(null)})})}async function k(a,e){return new Promise(t=>{chrome.storage.local.get(["mangadexCache"],r=>{const n=r.mangadexCache||{},s=a.toLowerCase().trim();n[s]={data:e,timestamp:Date.now()},chrome.storage.local.set({mangadexCache:n},t)})})}function U(a){var g,c,p,L;const e=a.attributes,t=a.relationships||[],r=t.find(f=>f.type==="cover_art");let n=null;r&&r.attributes&&r.attributes.fileName?n=`https://uploads.mangadex.org/covers/${a.id}/${r.attributes.fileName}.256.jpg`:r&&r.id&&console.log(`[MangaDex] ⚠️ Cover relationship exists but no fileName for ${a.id}`),n||(n="https://mangadex.org/img/avatar.png");const s=t.find(f=>f.type==="author"),m=((g=s==null?void 0:s.attributes)==null?void 0:g.name)||"Unknown",i={ongoing:"RELEASING",completed:"FINISHED",hiatus:"HIATUS",cancelled:"CANCELLED"};let l="MANGA";const o=e.tags||[],u=o.find(f=>{var h,M;return["Manhwa","Manhua","Long Strip"].includes((M=(h=f.attributes)==null?void 0:h.name)==null?void 0:M.en)});u&&(u.attributes.name.en==="Manhwa"&&(l="Manhwa"),u.attributes.name.en==="Manhua"&&(l="Manhua"));const d={ko:"KR",zh:"CN","zh-hk":"CN",ja:"JP"};return{id:`md_${a.id}`,mangadexId:a.id,source:"MANGADEX",title:{english:e.title.en||Object.values(e.title)[0]||"Unknown",romaji:((p=(c=e.altTitles)==null?void 0:c.find(f=>f.ja))==null?void 0:p.ja)||e.title.en,native:e.title.ja||e.title["ja-ro"]||null},description:((L=e.description)==null?void 0:L.en)||Object.values(e.description||{})[0]||"No description available from MangaDex.",coverImage:{large:n,medium:n},status:i[e.status]||"UNKNOWN",format:l,countryOfOrigin:d[e.originalLanguage]||"JP",genres:o.filter(f=>{var h;return((h=f.attributes)==null?void 0:h.group)==="genre"}).map(f=>f.attributes.name.en),chapters:e.lastChapter?parseInt(e.lastChapter):null,averageScore:null,popularity:null,startDate:e.year?{year:e.year}:null,staff:{edges:[{node:{name:{full:m}},role:"Story & Art"}]},externalLinks:[{site:"MangaDex",url:`https://mangadex.org/title/${a.id}`}]}}async function x(a,e=0){console.log(`[MangaDex] 🔍 Searching for: "${a}" (attempt ${e+1})`);const t=await G(a);if(t!==null)return t.status==="NOT_FOUND"?(console.log(`[MangaDex] ⏭️ Cache hit: "${a}" marked as NOT_FOUND, skipping`),null):(console.log(`[MangaDex] ✅ Cache hit: "${a}" - returning cached data`),t);const n=Date.now()-j;n<E&&await N(E-n),j=Date.now();let s=a;e===1&&(s=P(a,!1)),e>=2&&(s=P(a,!0));const m=`${I}/manga`,i=`title=${encodeURIComponent(s)}&limit=10&includes[]=cover_art&includes[]=author&order[relevance]=desc`,l=`${m}?${i}`;console.log(`[MangaDex] 🌐 API Request: ${l}`);try{const o=await fetch(l,{headers:{Accept:"application/json"}});if(o.status===429){if(e<A){const c=T*Math.pow(2,e);return console.warn(`MangaDex rate limited. Waiting ${c/1e3}s before retry.`),await N(c),x(a,e+1)}return console.error("MangaDex rate limit exceeded after max retries"),null}if(o.status>=500)return e<A?(await N(T*Math.pow(2,e)),x(a,e+1)):null;if(!o.ok)return console.error(`MangaDex HTTP error: ${o.status} for title: "${s}"`),e<A?x(a,e+1):null;const u=await o.json();if(!u.data||u.data.length===0)return e<A?x(a,e+1):(await k(a,{status:"NOT_FOUND",lastChecked:Date.now()}),null);const d=u.data[0],g=U(d);return console.log(`[MangaDex] ✅ Found: "${g.title.english}" (ID: ${g.mangadexId})`),console.log(`[MangaDex] 📊 Format: ${g.format}, Status: ${g.status}, Chapters: ${g.chapters||"N/A"}`),await k(a,g),g}catch(o){return console.error("Network error fetching from MangaDex:",o),e<A?(await N(T*Math.pow(2,e)),x(a,e+1)):null}}function H(a){if(!a)return null;const e=a.trim();if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))return e;const r=e.match(/mangadex\.org\/list\/([0-9a-f-]{36})/i);return r?r[1]:null}async function z(a){var t,r,n,s;const e=H(a);if(!e)return{success:!1,manga:[],error:"Invalid MDList ID or URL format."};console.log(`[MangaDex] 📋 Fetching MDList: ${e}`);try{const m=`${I}/list/${e}`,i=await fetch(m,{headers:{Accept:"application/json"}});if(!i.ok)return i.status===404?{success:!1,manga:[],error:"MDList not found. Make sure the list is public."}:{success:!1,manga:[],error:`API error: ${i.status}`};const l=await i.json(),o=((r=(t=l.data)==null?void 0:t.relationships)==null?void 0:r.filter(c=>c.type==="manga"))||[];if(o.length===0)return{success:!1,manga:[],error:"MDList is empty or has no manga."};console.log(`[MangaDex] 📚 Found ${o.length} manga in list`);const u=o.map(c=>c.id),d=100,g=[];for(let c=0;c<u.length;c+=d){const L=u.slice(c,c+d).map(M=>`ids[]=${M}`).join("&"),f=`${I}/manga?${L}&includes[]=cover_art&includes[]=author&limit=${d}`;await N(E);const h=await fetch(f,{headers:{Accept:"application/json"}});if(h.ok){const b=(await h.json()).data.map(O=>U(O));g.push(...b),console.log(`[MangaDex] ✅ Fetched batch ${Math.floor(c/d)+1}: ${b.length} manga`)}}return{success:!0,manga:g,listName:((s=(n=l.data)==null?void 0:n.attributes)==null?void 0:s.name)||"Unnamed List"}}catch(m){return console.error("[MangaDex] MDList fetch error:",m),{success:!1,manga:[],error:m.message}}}export{x as a,z as b,w as f};
