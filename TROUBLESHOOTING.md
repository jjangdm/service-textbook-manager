# 🔧 교재 조회 시스템 문제 해결 가이드

이 문서는 배포 및 운영 중 발생한 문제와 해결 방법을 기록합니다.

---

## 📅 2025-12-07: Production 환경 변수 미적용 문제 해결

### 🔴 문제 상황

**증상:**
- DigitalOcean 서버에 배포 후 백엔드가 `development` 모드로 실행됨
- `.env` 파일에 `NODE_ENV=production`을 설정했지만 적용되지 않음
- 웹 페이지 접근 불가

**로그 출력:**
```
🌐 환경: development    ← production이어야 함!
🔌 포트: 5000
```

**소요 시간:** 약 2시간

---

### 🔍 원인 분석

1. **`server.js`에 dotenv 로드 코드 누락**
   - `require('dotenv').config()`가 없어서 `.env` 파일을 읽지 못함
   - PM2 로그에서 dotenv 메시지가 나왔지만, 실제로는 코드에서 로드되지 않음

2. **환경 변수 로드 순서 문제**
   - Express 앱이 초기화되기 전에 환경 변수를 로드해야 함
   - dotenv는 `server.js`의 **최상단**에서 호출되어야 함

---

### ✅ 해결 방법

#### 1단계: server.js 수정

`backend/server.js` 파일의 **첫 번째 줄**에 dotenv 로드 코드 추가:

```javascript
require('dotenv').config();

const express = require('express');
const { Op } = require('sequelize');
// ... 나머지 코드
```

#### 2단계: .env 파일 생성

`backend/.env` 파일 생성 및 설정:

```env
# 환경 설정 - Production
NODE_ENV=production

# 서버 포트
PORT=5000

# 프론트엔드 도메인 (CORS 설정)
FRONTEND_URL=https://mclass.shop

# 관리자 비밀번호 (필요시 변경)
ADMIN_PASSWORD=admin123
```

#### 3단계: PM2 재시작 (환경 변수 업데이트)

```bash
# 서버에서 실행
cd /var/www/service-textbook-manager

# 최신 코드 가져오기
git pull origin claude/recover-work-history-018jAVW8yS8swjSxDhtcYBvC

# PM2 재시작 (--update-env 옵션 필수!)
pm2 restart my-backend --update-env

# 로그 확인
pm2 logs my-backend --lines 20 --nostream
```

#### 4단계: 확인

로그에서 다음 출력 확인:

```
🚀 서버 시작 정보:
📊 환경: production     ← ✅ 성공!
🔌 포트: 5000
🌐 허용된 도메인: [
  'http://localhost:3000',
  'https://mclass.shop',
  'https://www.mclass.shop'
]
🚀 서버가 포트 5000에서 실행 중입니다!
✅ 데이터베이스 연결 성공!
```

---

### 📝 교훈

1. **dotenv는 항상 최상단에서 로드**
   - `require('dotenv').config()`는 파일의 첫 번째 줄에 위치해야 함
   - 다른 모듈을 import하기 **전에** 실행되어야 함

2. **PM2 환경 변수 업데이트**
   - `.env` 파일 수정 후에는 반드시 `--update-env` 옵션과 함께 재시작
   - 단순 `pm2 restart`만으로는 환경 변수가 갱신되지 않음

3. **로그를 주의깊게 확인**
   - dotenv 메시지가 나와도 실제로 환경 변수가 적용되지 않을 수 있음
   - 서버 시작 로그에서 `NODE_ENV` 값을 명시적으로 확인

---

## 🛠 추가 문제 해결 팁

### 웹 페이지가 여전히 열리지 않는 경우

#### 1. 백엔드 API 테스트

```bash
# Health check
curl http://localhost:5000/health

# API 상태 확인
curl http://localhost:5000/api/status

# 전체 학생 목록 조회 (데이터베이스 연결 확인)
curl http://localhost:5000/api/students
```

#### 2. Nginx 설정 확인

```bash
# Nginx 상태 확인
sudo systemctl status nginx

# 설정 파일 문법 검사
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

#### 3. 프론트엔드 빌드 확인

```bash
# 빌드 파일 존재 여부 확인
ls -la /var/www/service-textbook-manager/frontend/build

# 프론트엔드 재빌드
cd /var/www/service-textbook-manager/frontend
npm run build
```

#### 4. 방화벽 및 포트 확인

```bash
# 포트 5000이 열려있는지 확인
sudo netstat -tulpn | grep 5000

# 방화벽 상태 확인
sudo ufw status
```

---

### CORS 에러 발생 시

**증상:** 브라우저 콘솔에 CORS 관련 에러 메시지

**해결:**

1. `backend/.env`의 `FRONTEND_URL` 확인:
   ```env
   FRONTEND_URL=https://mclass.shop
   ```

2. `backend/server.js`의 `allowedOrigins` 배열에 도메인이 포함되어 있는지 확인:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'https://mclass.shop',
     'https://www.mclass.shop',
     process.env.FRONTEND_URL,
   ].filter(Boolean);
   ```

3. PM2 재시작 후 로그에서 허용된 도메인 목록 확인

---

### 데이터베이스 연결 실패

**증상:** `❌ 데이터베이스 연결 실패` 로그 메시지

**해결:**

1. 데이터베이스 파일 존재 확인:
   ```bash
   ls -la /var/www/service-textbook-manager/backend/db.sqlite3
   ```

2. 파일 권한 확인:
   ```bash
   # PM2 실행 사용자 확인
   pm2 list

   # 데이터베이스 파일 권한 조정
   sudo chown -R $(whoami):$(whoami) /var/www/service-textbook-manager/backend/
   ```

3. `backend/config/database.js` 경로 확인:
   ```javascript
   const dbPath = path.join(__dirname, '..', 'db.sqlite3');
   ```

---

## 📚 관련 문서

- [배포 가이드](./DEPLOYMENT.md)
- [DigitalOcean 배포 방법](./DIGITALOCEAN_DEPLOY.md)
- [DigitalOcean 디버그 가이드](./DIGITALOCEAN_DEBUG.md)
- [프로젝트 README](./README.md)

---

## 🆘 추가 도움이 필요한 경우

문제가 해결되지 않으면 다음 정보를 수집하여 이슈를 생성하세요:

```bash
# 1. PM2 로그
pm2 logs my-backend --lines 50 --nostream

# 2. Nginx 에러 로그
sudo tail -n 50 /var/log/nginx/error.log

# 3. 시스템 리소스 확인
free -h
df -h

# 4. Node.js 버전
node --version
npm --version

# 5. 환경 변수 확인 (민감한 정보 제외)
pm2 env 0
```

이 정보를 GitHub Issues에 첨부하여 도움을 요청하세요.
