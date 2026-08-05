<?php
/**
 * PRO 사업자번호 검증 (진위확인 + 중복확인) — Front 컨트롤러 (같은 도메인, 브라우저 호출용)
 * ─────────────────────────────────────────────────────────
 * verify.js(로그인 회원)가 POST(JSON) 호출:  { "bno": "사업자10자리" }
 * 응답(JSON): { ok, valid, duplicate, message }
 *
 * 배치: data/module/Controller/Front/Professional/ProVerifyController.php  (개발 작업소스)
 * URL : https://www.dalba.co.kr/professional/pro_verify.php
 *   ※ 고도몰5 라우팅: Controller\Front\Professional\ProVerifyController  ↔  /professional/pro_verify.php
 *      (folder=professional, ProVerify→pro_verify snake_case, Front는 URL에서 생략)
 *   ※ Api(api.도메인)가 아니라 Front(같은 도메인)로 둬서 CORS/세션 문제 없음
 *
 * 배포: 개발소스관리 > 개발작업소스 보기 > "운영소스로 적용하기"
 * ⚠️ 키 3개는 배포본에만 입력(git 커밋 금지)
 */
namespace Controller\Front\Professional;

use Request;
use Session;
use Exception;

class ProVerifyController extends \Controller\Front\Controller
{
    // 국세청 "일반 인증키(Encoding, %2B·%3D%3D 그대로)" — 추가 인코딩 금지
    private $ntsKey     = '여기에_국세청_Encoding_serviceKey';
    // 고도몰 Open API 키
    private $partnerKey = '여기에_제휴사_partner_key';
    private $mallKey    = '여기에_쇼핑몰_key';

    public function index()
    {
        header('Content-Type: application/json; charset=utf-8');
        try {
            if (Request::server()->get('REQUEST_METHOD') !== 'POST') {
                $this->out(['ok' => false, 'message' => '허용되지 않은 접근 방식입니다.']);
            }
            // 로그인 회원만 (같은 도메인이라 세션 정상)
            if (!Session::get('member.memNo')) {
                $this->out(['ok' => false, 'message' => '로그인이 필요합니다.']);
            }

            $post = json_decode(file_get_contents('php://input'), true);
            if (empty($post)) {
                $post = Request::post()->toArray();
            }
            $bno = preg_replace('/[^0-9]/', '', isset($post['bno']) ? $post['bno'] : '');
            if (strlen($bno) !== 10) {
                $this->out(['ok' => false, 'message' => '사업자등록번호 10자리를 확인해주세요.']);
            }

            // ── 1) 국세청 진위/상태 조회 ──
            $ntsUrl = 'https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=' . $this->ntsKey;
            $ntsRaw = $this->httpPost($ntsUrl, json_encode(['b_no' => [$bno]]), ['Content-Type: application/json']);
            $nts = json_decode($ntsRaw, true);
            $item = isset($nts['data'][0]) ? $nts['data'][0] : null;
            if (!$item) {
                $this->out(['ok' => false, 'message' => '국세청 조회 결과가 없습니다.']);
            }
            if (isset($item['tax_type']) && strpos($item['tax_type'], '등록되지 않은') !== false) {
                $this->out(['ok' => false, 'valid' => false, 'message' => '국세청에 등록되지 않은 사업자등록번호입니다.']);
            }
            $active = (isset($item['b_stt_cd']) && $item['b_stt_cd'] === '01') || (isset($item['b_stt']) && $item['b_stt'] === '계속사업자');
            if (!$active) {
                $stt = isset($item['b_stt']) ? $item['b_stt'] : '휴·폐업';
                $this->out(['ok' => false, 'valid' => false, 'message' => $stt . ' 상태의 사업자는 신청할 수 없습니다.']);
            }

            // ── 2) proapply 게시판 중복 조회 (고도몰 Open API, 서버→서버) ──
            $boardBody = http_build_query([
                'partner_key' => $this->partnerKey,
                'key'         => $this->mallKey,
                'bdId'        => 'proapply',
                'searchField' => 'subject_contents',
                'searchWord'  => $bno,
                'page'        => 1,
                'size'        => 1,
            ]);
            $xml = $this->httpPost('https://openhub.godo.co.kr/godomall5/board/Board_List.php', $boardBody, ['Content-Type: application/x-www-form-urlencoded; charset=UTF-8']);
            $duplicate = false;
            if (preg_match('/<code>\s*([^<]+?)\s*<\/code>/', (string)$xml, $cm) && trim($cm[1]) === '000') {
                if (preg_match('/<total>\s*(\d+)\s*<\/total>/', $xml, $tm)) {
                    $duplicate = ((int)$tm[1] > 0);
                }
            } else {
                $this->out(['ok' => false, 'message' => '중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.']);
            }

            if ($duplicate) {
                $this->out(['ok' => false, 'valid' => true, 'duplicate' => true, 'message' => '이미 신청된 사업자등록번호입니다.']);
            }

            $this->out(['ok' => true, 'valid' => true, 'duplicate' => false, 'message' => '정상 사업자로 확인되었습니다. (신청 가능)']);
        } catch (Exception $e) {
            $this->out(['ok' => false, 'message' => $e->getMessage()]);
        }
    }

    // JSON 출력 + 종료 (base 의 json() 의존 안 함)
    private function out($arr)
    {
        echo json_encode($arr, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function httpPost($url, $body, array $headers)
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 10,
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }
}
