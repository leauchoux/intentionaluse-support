# IANJI Cloudflare Pages 준비

## 2026-10-03 다국어 확장

현재 공개 사이트는 `https://ianji.net/`, Cloudflare Pages 프로젝트는 `ianji`다. 2026-10-03 읽기 확인 시 프로덕션 브랜치는 `codex/ianji-cloudflare-pages`, 기존 프로덕션 커밋은 `b578929`이며 GitHub의 `main`과 구분한다. 아래 초기 준비 이력의 미배포 표현은 당시 상태다. 다국어 변경 자체의 공개 완료는 배포 성공과 실제 HTTPS 본문 대조로 별도 확인한다.

빌드 명령과 출력은 그대로 `node scripts/build-cloudflare.mjs` / `dist`다. 회사·MomenTap 제품·지원·개인정보를 한국어/영어/일본어 12개 경로로 제공하고 각 페이지의 언어 메뉴·canonical·hreflang·sitemap을 함께 생성한다. 경로 표와 번역 소스는 README를 따른다. 기존 `/privacy/`의 한·영 병기 구조와 한국어 처리 방침은 유지하고 영어 표현을 검수하며 영어 단독 `/en/privacy/`와 일본어 `/ja/privacy/`를 추가한다. 404에도 일본어 안내와 홈 링크를 추가한다.

새 언어는 정적 HTML과 CSS로 제공한다. 기존 보안 헤더·리디렉션·아이콘·메일 주소는 유지하며 DNS·DNSSEC·메일 설정 변경이 필요한 작업이 아니다. 일본어는 모바일에서 자연스럽게 줄바꿈하고, 언어 선택은 현재 언어만 보이는 HTML `details/summary` 드롭다운으로 제공한다. 목록은 언어가 늘어나면 내부 스크롤되며, 선택 시 같은 종류의 페이지로 이동한다. JavaScript나 CSP 변경 없이 동작한다. 기존 하단의 언어 나열 링크는 상단 선택기로 통일했다. 기능 출시나 Apple 조직 전환 승인을 새로 주장하지 않는다.

## 초기 준비 기록

상태: **로컬 배포 파일 준비 완료, 배포·사용자 도메인 연결 전**. 이 문서는 계정 로그인, 프로젝트 생성, GitHub 연결, 네임서버 변경 또는 배포가 완료되었다는 증거가 아니다.

IANJI 회사 홈페이지의 목표 주소는 `https://ianji.net`, 문의 주소는 `contact@ianji.net`이다. 메인은 회사 소개·제품 목록·문의로 구성하고, 각 제품의 상세 설명은 하위 페이지에 둔다. 현재 준비된 제품 하위 페이지는 MomenTap 한국어·영어 페이지다. 기존 GitHub Pages HTML·CSS·아이콘은 그대로 두고, Node.js 스크립트가 Cloudflare용 `dist/`만 생성한다. `dist/`는 Git 추적에서 제외한다.

## 배포 설정

| 설정 | 값 |
| --- | --- |
| 서비스 | Cloudflare Pages |
| 예정 저장소 | `leauchoux/intentionaluse-support` |
| 예정 프로덕션 브랜치 | `main` |
| Framework preset | None |
| Root directory | 저장소 루트 |
| Build command | `node scripts/build-cloudflare.mjs` |
| Build output directory | `dist` |
| Node.js | 22 이상 권장; 외부 패키지 설치 불필요 |
| 환경 변수·비밀 키 | 필요 없음 |

스크립트를 저장소에 반영하기 전에는 위 Git 연동 설정만으로 빌드할 수 없다. 로컬에서 `node scripts/build-cloudflare.mjs`를 실행하면 동일한 출력 폴더가 만들어진다. 직접 업로드 방식을 선택하는 경우에도 업로드 대상은 소스 전체가 아니라 `dist/`의 내용이다. Git 연동과 직접 업로드 프로젝트의 선택은 실제 프로젝트 생성 전에 확인한다.

현재 준비 변경은 `main`에 병합되지 않았다. 초기 `pages.dev` 검토 배포를 진행하기로 한 경우에는 준비 브랜치 `codex/ianji-cloudflare-pages`를 임시 프로덕션 브랜치로 지정할 수 있다. 이후 PR #7 병합을 확인한 뒤 프로덕션 브랜치를 `main`으로 전환한다. GitHub 앱의 저장소 접근 권한 승인, Cloudflare 프로젝트 생성과 배포는 별도의 실제 확인이 필요하며, 이 문서는 완료를 보장하지 않는다.

배포 파일에는 서버 함수, 사용자 계정, 결제, 입력 양식, JavaScript, 분석·추적 스크립트가 없다. 링크는 이메일 앱이나 외부 GitHub 지원 페이지를 열 수 있다. Cloudflare 계정에서 Web Analytics 등 별도 기능을 활성화할 경우 개인정보 설명과 보안 정책을 다시 검토한다. 이메일 주소 난독화(Email Address Obfuscation)는 주소를 변환하고 복원 스크립트를 주입하므로 이 사이트의 스크립트 차단 CSP와 충돌할 수 있다. 운영 설정에서 이 기능을 끄고 `contact@ianji.net`의 표시·메일 링크를 확인한다. Rocket Loader 등 스크립트를 주입하는 기능도 활성화하지 않는다. [Cloudflare 이메일 주소 난독화 안내](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/)

## 페이지 경로

| 경로 | 원본 | 용도 |
| --- | --- | --- |
| `/` | `organization/index.html` | 한국어 회사 소개·제품 목록 |
| `/en/` | `organization/en/index.html` | 영어 회사 소개·제품 목록 |
| `/products/momentap/` | 한국어 회사 원본의 제품 설명 | MomenTap 한국어 상세 소개 |
| `/en/products/momentap/` | 영어 회사 원본의 제품 설명 | MomenTap 영어 상세 소개 |
| `/support/` | `index.html` | MomenTap 한국어 사용 안내·지원 |
| `/privacy/` | `privacy.html` | 한국어·영어 개인정보처리방침 |
| `/404.html` | 빌드 스크립트 | 존재하지 않는 주소의 오류 페이지 |
| `/assets/company.css` | `organization/styles.css` | 회사 소개 스타일 |
| `/assets/site.css` | 빌드 스크립트 | 회사 제품 목록·제품 상세용 추가 스타일 |
| `/assets/support.css` | `styles.css` | 지원·개인정보 스타일 |
| `/assets/momentap-11fc3604.png` | 기존 공개 아이콘 | 회사 페이지 아이콘 |

`_redirects`는 기존 `/organization/`, `/organization/en/`와 `/privacy.html` 경로를 새 경로로 연결한다. `_headers`는 정적 페이지용 CSP, 프레임 삽입 차단, MIME 타입 추측 차단, referrer·장치 권한 제한을 적용한다. 이름에 해시가 들어간 아이콘만 장기 캐시한다. `robots.txt`와 `sitemap.xml`, canonical·언어별 alternate 주소는 `https://ianji.net`을 기준으로 생성한다. 미리보기 도메인은 공개 운영 주소가 아니다.

## 생성 시 반영되는 내용

- 회사 이메일을 `contact@ianji.net`으로 변경하고 내부 링크와 자산 경로를 새 구조에 맞춘다.
- 회사 메인에는 간단한 제품 카드와 상세 페이지 링크를 둔다. MomenTap의 상세 기능·기기 내 기록 원칙은 제품 하위 페이지로 옮긴다. 제품 상세 페이지에서 회사 홈·제품 목록·문의·지원으로 이동하고 해당 제품의 언어를 전환할 수 있다. 새 제품 추가 시 제품 목록, 하위 페이지, 언어별 주소와 사이트맵을 함께 갱신한다.
- 제품 소개의 기록 보관 기간은 선택한 기간으로 표현한다. 지원 안내는 기본 90일과 버전별 보관 기간 설정을 설명한다. 기록의 기본 꺼짐은 유지한다.
- 개인정보처리방침은 앱의 실제 처리 조항을 보존하면서 Cloudflare 웹 호스팅, GitHub 공개 지원 이슈, iCloud Mail 이메일 문의를 구분한다. 웹사이트 관련 변경 시행일은 2026년 10월 1일로 표시한다.
- 개발·테스트 중인 제품 상태를 유지한다. App Store 출시, 조직 계정 전환 승인 또는 결제 제공을 주장하지 않는다.
- 원본 문구가 바뀌면 빌드가 조용히 누락하지 않도록 필수 문구 치환을 확인한다. 빌드 오류가 나면 원본과 변환 내용을 함께 검토한다.
- 생성된 지원 스타일에만 `.hero > .eyebrow { position: relative; z-index: 1; }`을 덧붙여 모바일에서 장식 링이 소개 문구를 가리지 않도록 한다. 원본 `styles.css`는 보존한다.

## iCloud 이메일 DNS 보존

`ianji.net`의 iCloud 이메일은 웹사이트와 별도 DNS 레코드를 사용한다. Cloudflare 네임서버로 옮기기 전, 현재 Spaceship DNS의 **모든 레코드**를 안전하게 확인·복사한다. 특히 다음을 보존한다.

- iCloud 메일 수신용 MX
- Apple 도메인 소유권 인증 TXT
- SPF TXT — SPF 정책을 중복 추가하지 않는다.
- DKIM CNAME — 메일 관련 레코드는 DNS only로 설정한다.
- 기존의 다른 TXT·CNAME·CAA 등 필요한 레코드

계정별 인증값은 이 저장소에 저장하지 않는다. 웹사이트용 레코드만 새 Pages 프로젝트에 맞춰 추가하며, 기존 iCloud MX·SPF·DKIM을 웹사이트 주소로 덮어쓰지 않는다. 네임서버 변경 뒤에는 새 권한 DNS와 외부 리졸버에서 레코드를 확인하고 실제 이메일 수신·발신을 별도로 시험한다. 여기의 준비 완료 상태는 송수신 시험 통과를 뜻하지 않는다.

2026년 10월 1일 준비 과정에서 기존 DNSSEC의 부모 DS 레코드 1개와 TTL 86400초(24시간)를 확인했다. 이전 시에는 **기존 DNSSEC·등록기관 DS 해제 → 부모 영역에서 DS 소멸 확인 및 이전 TTL 만료 대기 → Cloudflare 네임서버로 변경 → 안정화 후 Cloudflare DNSSEC 활성화와 새 DS 등록** 순서로 진행한다. 기존 DS가 캐시에 남아 있는 동안 네임서버를 먼저 바꾸면 DNSSEC 검증이 실패해 웹사이트와 이메일 모두 영향을 받을 수 있다. 실제 변경 직전에 DS·TTL을 다시 확인한다. 이 준비 단계에서는 DNSSEC, DS 또는 네임서버를 변경하지 않았다.

## 배포 전후 확인

로컬 빌드 뒤 모든 내부 링크·앵커·자산, 한국어·영어 전환, 연락처, 모바일·데스크톱 화면을 확인한다. 배포 뒤에는 HTTPS, 기본 도메인 및 사용자 도메인, 실제 301 리디렉션·404 상태, 응답 보안 헤더, `robots.txt`·사이트맵과 iCloud 메일 DNS를 다시 확인한다. 원본 GitHub Pages URL은 변경하지 않는다.
