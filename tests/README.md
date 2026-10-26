# 테스트

빌드 도구나 설치할 패키지 없이 Node.js 22 이상만 있으면 됩니다.

```sh
npm test
```

- `week5.test.js`: 5주차 행렬 계산·검산, 단계 진행 조건(틀린 줄 → 설명 → 힌트·재도전 → 검산), 재도전 조건 바꾸기, 문제 묶음 JSON 불러오기 검증
- `fnlab.test.js`: 3주차 식 표기, 교점 계산, 빈칸 입력 처리
- `lab-csv.test.js`: 공용 `assets/lab.js`의 CSV 저장·읽기(수식 방지 포함)
- `load-browser.js`: `window.X = ...` 형태의 브라우저 전용 스크립트를 Node에서 불러오는 도우미

테스트에 쓰는 학생 정보는 모두 가상 예시여야 합니다.
