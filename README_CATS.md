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
