# 야근냥 — 간식 회수 작전

고양이 편의점 컨셉의 첫 개선 버전입니다. 공개 배포 전 검토용이며 기존 Last Signal 사이트와 저장 데이터는 보존합니다.

## 실행

이 폴더에서 `python -m http.server 8080`을 실행하고 `http://localhost:8080`에 접속합니다.

## 변경 내용

- 편의점 일러스트 + 야간조 고양이 선택 카드로 시작 화면 재구성
- 치즈(기동), 모찌(주변 방어), 후추(높은 체력) 3종 고양이
- 고양이 / 청소로봇 실제 게임 스프라이트, 밝은 타일 바닥
- 간식 창고 열기 → 대왕 청소기 처치 → 15분 이후 중앙에서 5초 머물러 퇴근
- 둥근 컨트롤, 말풍선 설명, 큰 글씨, 간식 카드 선택 연출
- 아지트 강화 / 근무 일지 / 안내 / 결과 / 일시정지 화면 테마 통일
- 브라우저 저장 키 `night-shift-cats-v1`로 분리. `last-signal-v1`은 읽거나 수정하지 않음
- 실제 결제와 서버 계정은 이번 변경 범위에 포함하지 않음

## 조작

WASD / 방향키 이동, 마우스 조준, 자동 공격, Space 대시, E 냥펀치, Q 우다다, Esc / P 일시정지.
모바일은 왼쪽 이동 스틱, 오른쪽 조준 스틱과 하단 스킬 버튼을 사용합니다.

## 검증

`node tests/aim.mjs` 및 `node tests/interference.mjs`: 조준 / 자동 연사 / 두 손가락 입력 / 저장 복원 / 강화 / 전투 패턴 19개 회귀 테스트.
브라우저 시각·실기기 검수 및 공개 배포는 아직 하지 않았습니다.

## 원본 보존

Last Signal 원본 커밋: `505f780883c80806cd44e405bd3db8863e53324e`
새 작업 브랜치: `feature/night-shift-cats`
공개 배포 브랜치 `main`에는 이 변경을 합치지 않았습니다.

## 이미지 제작

Built-in imagegen으로 제작. 원본 생성 에셋에서 웹용 압축 및 스프라이트 영역 추출만 적용.
- 편의점: 밤의 한국 편의점, 파란 앞치마의 치즈 고양이와 졸린 크림 고양이, 간식 진열대, 따뜻한 실내와 파란 밤, 고슈 일러스트, 텍스트 없음.
- 캐릭터: 투명 배경의 3종 고양이(치즈/크림/차콜)와 3종 청소·장난감 로봇, 일관된 게임 일러스트 스타일.

에셋 위치: `assets/cat-store.webp`, `assets/cat-runner.webp`, `assets/cat-engineer.webp`, `assets/cat-warden.webp`, `assets/robot-cleaner.webp`, `assets/robot-toy.webp`, `assets/robot-boss.webp`.


## 편의점 전투 배경
- `assets/convenience-floor.webp`: 내장 image_gen으로 생성한 전용 배경.
- 프롬프트: Square true overhead convenience store game floor, subdued teal tiles, stocked snack shelves, glass beverage refrigerators, checkout counters, open central fighting space, warm fluorescent lighting, hand-painted art, no characters, UI or text.
- 기존 전투 HUD를 유지하면서 폐허 바닥을 편의점 내부로 교체. 시작 지점 주변에도 진열대 이미지를 배치. 진열대는 배경 장식으로 이동을 막지 않음.


## 수집과 조작 개선 (cat4)
- 기본 3종 + 신규 9종 = 12종. 스파이더/눈꽃은 코인 해금, 닌자/닥터는 누적 격파·생존 미션, 월식은 승리 시 시크릿 해금. 셰프/번개/별빛/우주는 게임 코인 뽑기.
- 120코인 뽑기: 30/30/25/15%. 중복 시 45코인 반환, 연속 9회 중복 뒤 다음 뽑기는 미보유 중 가중 추첨. 현금 결제 없음.
- 부활권 최초 2장, 100코인 구매, 승리 보상 1장. 한 판 1회, 체력60%, 무적3초. 부활 선택 전 결과 보상 정산 금지, 쓰러짐/부활 사용 여부 저장.
- 미션은 완료한 판의 누적 기록을 기준으로 결과에서 해금. 기존 코인과 기본 강화 기록 유지. 브라우저 로컬 저장이므로 계정 간 동기화나 서버 권위 경제는 아님.
- 조준 회전 최대7.5rad/s, 중앙48월드단위 마우스 사각지대, 터치 이동16%/조준22% 사각지대. 깃털 회전1.25rad/s(가속 상한1.4배), 카메라 추종 강화.
- 초반 일반 적 체력18%/피해22%/속도8% 감소, 10분에 원래 수치. 보스 체력10% 감소. 일반 모드만 적용. 스폰 기울기 .0115→.0095, 경험치 곡선 완화. 밸런스는 1차 수치 조정이며 장시간 플레이 검수는 미실시.
- 창고 점령10초, 전투 중앙 안내 삭제, 체력창 아래 짧은 카운트다운.

### 보상형 광고 연결
현재 광고 공급자 계정/광고 단위가 없으므로 광고 버튼은 준비 중으로 비활성화됩니다. 실제 광고를 가장하는 타이머나 보상은 없습니다. 공급자의 공식 보상 완료 콜백을 어댑터로 연결하세요:
```js
window.CatRewardedAds = {
  async show({placement, runId}) {
    // 공급자 SDK의 실제 rewarded 이벤트를 기다립니다.
    // 취소/실패는 {completed:false}, 보상 완료만 {completed:true}.
    // SDK에서 광고를 닫은 뒤 Promise를 완료해야 합니다.
  }
};
```
실제 서비스에서 유료 경제/광고를 운영하려면 서버에서 보상 이벤트와 소유권을 검증하고 광고 공급자의 가입·도메인 승인을 마쳐야 합니다.

### 신규 아트
내장 image_gen으로 생성한 투명3×3 고양이 아틀라스를 각 WebP로 분리했습니다. `assets/cat-spider.webp`, `cat-frost.webp`, `cat-ninja.webp`, `cat-chef.webp`, `cat-nurse.webp`, `cat-spark.webp`, `cat-wizard.webp`, `cat-astro.webp`, `cat-moon.webp`.
프롬프트: one transparent 3x3 atlas of nine full-body hand-painted cute front-facing cats, equal cells, purple spider cat, icy snow cat, black ninja red scarf, orange chef white hat, mint nurse with medical bag, golden electric cat, navy wizard star hat, lilac astronaut glass helmet, dark moon cat crescent markings; no UI, text, logos or background.

### 검증
`node --test tests/*.mjs`: 기존 조작/전투 19개 시나리오 + 경제·미션·고유 무기·부활·조준·점령시간 10개 시나리오. 브라우저 시각 검수와 실광고 검수는 미실시.


## 모바일 마무리 (cat5)
- 모바일 스킬 버튼의 이전 중앙 정렬/폭 값을 명시적으로 해제하고 오른쪽 하단 안전영역에 배치. 스틱 영역은 하단 버튼 위로 확장.
- 스틱 이동 반경을 벗어나면 중심이 손가락을 따라가므로 반대 방향 입력 시 긴 복귀 드래그가 필요하지 않음. 실제 스틱 크기에 맞게 터치 중심 정렬.
- 마지막 선택 고양이를 저장. 광고 공급자 연결 전에는 광고 부활 버튼을 숨김. 기존 부활권 동작 유지.
- 월식냥은 적을 여러 번 관통해도 수명 동안 왕복하며 돌아오는 경로에서 다시 타격.
- 기존29개에 긴 드래그 반전/다중 타격 후 귀환2개 검증 추가, 총31개 시나리오 통과. 실기기 터치/시각 검수는 아직 미실시.


## 앱형 로비 (cat6)
기본 치즈·모찌·후추3종의 무료 소유권 유지. 세로형 앱 로비: 코인/부활권 상단, 선택 고양이 대형 아트, 가로 파트너 선택, 큰 플레이 버튼, 홈/고양이/아지트/기록 하단 메뉴. 기존 고양이/강화/저장 기록과 전투 HUD 유지. 앱 설치 패키지가 아닌 반응형 웹 UI이며 네이티브 앱 설치 기능은 추가하지 않음.

## 사운드와 패시브 (cat8)
- Web Audio로 직접 합성하는 오리지널 8마디 배경곡 Midnight Snack Run: 기본112BPM, 보스120BPM, 우다다128BPM. 베이스/킥/스네어/하이햇/코드/멜로디를 오디오 시계에 맞춰 예약. 외부 음원/샘플 없음.
- 9개 고유 무기 음색, 명중/처치/피격/보상 효과. 음악/효과음 독립 볼륨, 반복음 제한, 최대72음, 컴프레서. 일시정지/강화/사망 중 음악 페이드. 기존 음소거 설정 유지; 신규 사용자는 첫 플레이 터치 후 소리 활성화.
- PASSIVES(roster.js)에12종 패시브 설명 정의. 도감과 일시정지 화면에서 조건 확인. 후추3번째 방어, 스파이더 감속처치 대시회복, 눈꽃 냉기증폭, 닌자 대시강화, 셰프 화상처치 회복, 닥터 비피격재생, 번개5처치 쿨다운회복, 별빛 경험치, 우주 수집범위, 월식 자동부활. 치즈잔상/모찌시작깃털 유지. 패시브 재사용 상태를 저장하며 월식 자동부활은 판당 부활1회를 소모.
- tests/audio.mjs, tests/passives.mjs 추가. 자동 검증 전체 통과. 이전 시작불가 수정은 실제 공개 브라우저에서 플레이 클릭, 전투시간00:16, 사망/부활 선택 화면까지 확인.

### cat9 · combat clarity and active skills
Combat panels now use transparent backgrounds, thin bars and round touch buttons. All 12 cats have a dedicated E ability; descriptions appear in the collection and pause screen. Cooldowns scale with existing upgrades and survive saves. Monster defeat adds brief shards/bursts and size-dependent synthesized sounds, respecting particle settings and audio rate limits. Covered by tests/active-skills.mjs.
