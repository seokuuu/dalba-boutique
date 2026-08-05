/**
 * PRO 사업자번호 검증 서버리스 (진위확인 + 중복확인 통합)
 * ─────────────────────────────────────────────────────────
 * verify.js(브라우저)가 호출:  POST { "bno": "사업자10자리" }
 * 응답(JSON): { ok, valid, duplicate, message }
 *   - ok=true            → 신청 가능 (실존 활성 + 미중복)
 *   - ok=false + valid=false → 폐업/휴업/미등록
 *   - ok=false + duplicate=true → 이미 신청됨
 *
 * 동작:
 *   1) 국세청 상태조회 API 로 실존/활성 확인
 *   2) 고도몰 Open API(Board_List.php) 로 proapply 게시판에서 사업자번호 검색 → 중복 판별
 *
 * 배포: Vercel(`/api/pro-verify.js`), Netlify, AWS Lambda 등 Node 18+ (global fetch 내장).
 *      Cloudflare Workers 는 export default { fetch } 로 감싸면 됨(로직 동일).
 *
 * 환경변수(권장) 또는 아래 상수 직접 입력:
 *   NTS_SERVICE_KEY  : 공공데이터포털 국세청 상태조회 Decoding 키
 *   GODO_PARTNER_KEY : 고도몰 제휴사 인증키(partner_key)
 *   GODO_KEY         : 고도몰 쇼핑몰 인증키(key)
 */

var NTS_SERVICE_KEY = process.env.NTS_SERVICE_KEY || "국세청_serviceKey_Decoding";
var GODO_PARTNER_KEY = process.env.GODO_PARTNER_KEY || "고도몰_partner_key";
var GODO_KEY = process.env.GODO_KEY || "고도몰_key";

var ALLOW_ORIGIN = "https://dalba.co.kr"; // verify.js 호출 허용 도메인
var BD_ID = "proapply";
var NTS_URL = "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=" + encodeURIComponent(NTS_SERVICE_KEY);
var GODO_BOARD_LIST = "https://openhub.godo.co.kr/godomall5/board/Board_List.php";

module.exports = async function handler(req, res) {
    // ---- CORS ----
    res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).end(); return; }
    if (req.method !== "POST") { res.status(405).json({ ok: false, message: "POST only" }); return; }

    try {
        var body = (req.body && typeof req.body === "object") ? req.body : JSON.parse(req.body || "{}");
        var bno = String(body.bno || "").replace(/[^0-9]/g, "");
        if (bno.length !== 10) {
            res.status(200).json({ ok: false, message: "사업자등록번호 10자리를 확인해주세요." });
            return;
        }

        // ── 1) 국세청 진위/상태 조회 ──
        var ntsResp = await fetch(NTS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ b_no: [bno] })
        });
        var nts = await ntsResp.json();
        var item = nts && nts.data && nts.data[0];
        if (!item) { res.status(200).json({ ok: false, message: "국세청 조회 결과가 없습니다." }); return; }
        if (item.tax_type && item.tax_type.indexOf("등록되지 않은") !== -1) {
            res.status(200).json({ ok: false, valid: false, message: "국세청에 등록되지 않은 사업자등록번호입니다." });
            return;
        }
        var active = (item.b_stt_cd === "01") || (item.b_stt === "계속사업자");
        if (!active) {
            res.status(200).json({ ok: false, valid: false, message: (item.b_stt || "휴·폐업") + " 상태의 사업자는 신청할 수 없습니다." });
            return;
        }

        // ── 2) 고도몰 proapply 중복 조회 (XML 응답) ──
        var form = new URLSearchParams();
        form.set("partner_key", GODO_PARTNER_KEY);
        form.set("key", GODO_KEY);
        form.set("bdId", BD_ID);
        form.set("searchField", "subject_contents"); // 제목/본문에서 사업자번호 검색
        form.set("searchWord", bno);
        form.set("page", "1");
        form.set("size", "1"); // total 만 확인하면 됨
        var godoResp = await fetch(GODO_BOARD_LIST, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: form.toString()
        });
        var xml = await godoResp.text();
        var codeM = xml.match(/<code>\s*([^<]+?)\s*<\/code>/);
        var totalM = xml.match(/<total>\s*(\d+)\s*<\/total>/);
        var code = codeM ? codeM[1].trim() : "";
        if (code !== "000") {
            // 조회 실패 시 통과시키면 중복을 못 거르므로 에러로 막음 (안전측)
            res.status(200).json({ ok: false, message: "중복 확인 중 오류(코드 " + code + "). 잠시 후 다시 시도해주세요." });
            return;
        }
        var total = totalM ? parseInt(totalM[1], 10) : 0;
        if (total > 0) {
            res.status(200).json({ ok: false, valid: true, duplicate: true, message: "이미 신청된 사업자등록번호입니다." });
            return;
        }

        res.status(200).json({ ok: true, valid: true, duplicate: false, message: "정상 사업자로 확인되었습니다. (신청 가능)" });
    } catch (e) {
        res.status(200).json({ ok: false, message: "검증 처리 중 오류가 발생했습니다." });
    }
};
