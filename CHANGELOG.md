# 📝 변경 이력 (Changelog)

이 프로젝트의 주요 변경 사항을 시간순으로 기록합니다.

---

## [2025-12-07] - Production 환경 설정 수정

### ✅ 수정됨 (Fixed)
- **환경 변수 로드 문제 해결**
  - `backend/server.js`에 `require('dotenv').config()` 추가
  - `.env` 파일의 환경 변수가 정상적으로 로드되도록 수정
  - `NODE_ENV=production` 설정이 올바르게 적용됨

### ➕ 추가됨 (Added)
- **문서화**
  - `TROUBLESHOOTING.md`: 문제 해결 가이드 추가
  - `CHANGELOG.md`: 변경 이력 문서 추가

- **환경 설정 파일**
  - `backend/.env`: Production 환경 변수 설정 파일 생성
  - `NODE_ENV=production` 설정
  - `FRONTEND_URL=https://mclass.shop` 설정

### 🔧 기술적 세부사항
- dotenv 패키지를 server.js의 최상단에서 로드하도록 수정
- PM2 재시작 시 `--update-env` 옵션 사용 필요성 명시
- Production 환경에서 CORS 설정 정상 작동 확인

### 📊 영향
- 서버가 이제 올바른 production 환경에서 실행됨
- 보안 및 성능 최적화가 활성화됨
- CORS 정책이 엄격하게 적용됨 (허용된 도메인만 접근 가능)

---

## [2025-10-05] - 데이터베이스 파일 관리 개선

### 🔧 변경됨 (Changed)
- 데이터베이스 파일 Git 추적 제외
  - `backend/.gitignore`에 `db.sqlite3` 추가
  - 민감한 데이터가 버전 관리에 포함되지 않도록 보호

---

## [2025-10-04] - 데이터베이스 경로 및 가격 조회 버그 수정

### ✅ 수정됨 (Fixed)
- **데이터베이스 절대 경로 사용**
  - 문제: DigitalOcean 환경에서 상대 경로 문제로 데이터베이스 연결 실패
  - 해결: `backend/config/database.js`에서 절대 경로 사용
  - `path.join(__dirname, '..', 'db.sqlite3')`로 안정적인 경로 생성

- **도서 검색 최신 가격 반환 보장**
  - 문제: SQLite의 `GROUP BY`가 무작위 행 반환하여 구버전 가격 표시
  - 해결: `input_date` 내림차순 정렬 후 Map으로 최신 항목만 선택
  - `/api/admin/books/search` 엔드포인트 리팩토링

### ➕ 추가됨 (Added)
- **테스팅 프레임워크 도입**
  - Jest + Supertest 추가
  - 인메모리 데이터베이스로 테스트 환경 구성
  - `backend/server.test.js` 테스트 케이스 작성
  - 도서 검색 최신 가격 반환 테스트 추가

### 📦 의존성 업데이트
- `jest`: ^29.7.0
- `supertest`: ^6.3.3
- 총 289개 패키지 추가

---

## [2025-07-18] - 초기 프로젝트 설정 및 기능 구현

### ➕ 추가됨 (Added)
- **백엔드 기능**
  - Express.js 서버 구축
  - SQLite 데이터베이스 연동 (Sequelize ORM)
  - Student 및 Book 모델 정의
  - RESTful API 엔드포인트 구현
  - CORS 설정

- **프론트엔드 기능**
  - React.js 기반 사용자 인터페이스
  - 학생 조회 기능
  - 미납/납부 내역 조회
  - 관리자 페이지 (`/secret-admin`)
  - 학생 추가, 교재 추가, 납부 처리 기능

- **데이터베이스 스키마**
  - Students 테이블 (id, name, student_code)
  - Books 테이블 (id, input_date, book_name, price, checking, payment_date, studentId)

- **문서화**
  - `README.md`: 프로젝트 개요 및 사용법
  - `DEPLOYMENT.md`: 배포 가이드 (Vercel, Netlify, VPS, Docker)
  - `DIGITALOCEAN_DEPLOY.md`: DigitalOcean 배포 가이드
  - `DIGITALOCEAN_DEBUG.md`: 환경 변수 설정 가이드

- **유틸리티**
  - `extract_data.py`: SQLite 데이터 추출 스크립트
  - `start_servers.bat`: Windows용 서버 시작 스크립트
  - `build.sh` / `build.bat`: 빌드 스크립트

### 🎯 주요 기능
1. **일반 사용자**
   - 학생 코드와 이름으로 조회
   - 미납 교재 목록 및 총액 확인
   - 납부 내역 확인
   - 납부 계좌 안내

2. **관리자**
   - 학생 검색 및 관리
   - 새 학생 추가
   - 교재 추가 (자동완성 기능)
   - 납부 처리
   - 실시간 데이터 업데이트

---

## 📌 버전 관리 정책

- **Major 변경**: 호환성이 깨지는 변경사항
- **Minor 변경**: 새로운 기능 추가 (하위 호환성 유지)
- **Patch 변경**: 버그 수정 및 성능 개선

---

## 🔗 관련 문서

- [프로젝트 README](./README.md)
- [배포 가이드](./DEPLOYMENT.md)
- [문제 해결 가이드](./TROUBLESHOOTING.md)
- [DigitalOcean 배포](./DIGITALOCEAN_DEPLOY.md)

---

## 📧 기여 및 피드백

변경 사항이나 버그 발견 시 GitHub Issues에 제보해주세요.
