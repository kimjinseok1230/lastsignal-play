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
