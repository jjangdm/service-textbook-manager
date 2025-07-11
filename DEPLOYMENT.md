# 🚀 교재 조회 시스템 배포 가이드

## 📋 프로젝트 개요
학생들의 교재 구매 미납금액과 납부 내역을 효율적으로 관리할 수 있는 웹 기반 시스템입니다.

## 🛠 기술 스택
- **Frontend**: React.js, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite

## 🏗 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/jjangdm/service-textbook-manager.git
cd service-textbook-manager
```

### 2. 백엔드 설정
```bash
cd backend
npm install
npm start
```

### 3. 프론트엔드 설정
```bash
cd ../frontend
npm install
npm start
```

### 4. 데이터베이스 초기화
- `backend/database.sqlite` 파일이 없다면 서버 시작시 자동 생성됩니다.

## 🚀 배포 방법

### 방법 1: Vercel (추천 - 무료)

#### 백엔드 배포 (Vercel)
1. Vercel 계정 생성: https://vercel.com
2. GitHub 저장소 연결
3. 프로젝트 설정:
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Output Directory: 기본값
   - Install Command: `npm install`

4. 환경 변수 설정:
   ```
   NODE_ENV=production
   PORT=3000
   ```

#### 프론트엔드 배포 (Vercel)
1. 새 프로젝트로 같은 저장소 연결
2. 프로젝트 설정:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. 환경 변수 설정:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app
   ```

### 방법 2: Netlify (무료)

#### 백엔드 배포 (Railway 또는 Render)
Railway (추천):
1. Railway 계정 생성: https://railway.app
2. GitHub 저장소 연결
3. backend 폴더 선택
4. 자동 배포

#### 프론트엔드 배포 (Netlify)
1. Netlify 계정 생성: https://netlify.com
2. GitHub 저장소 연결
3. 빌드 설정:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

### 방법 3: 전통적인 호스팅 (VPS)

#### 서버 요구사항
- Node.js 18+ 
- 최소 1GB RAM
- 10GB 저장공간

#### 배포 스크립트
```bash
# 서버에서 실행
git clone https://github.com/jjangdm/service-textbook-manager.git
cd service-textbook-manager

# 백엔드 설정
cd backend
npm install
npm install -g pm2
pm2 start server.js --name "textbook-backend"

# 프론트엔드 빌드
cd ../frontend
npm install
npm run build

# Nginx 설정 (frontend/build 폴더를 웹서버 루트로 설정)
```

### 방법 4: Docker (컨테이너 배포)

#### Dockerfile 생성 (백엔드)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Dockerfile 생성 (프론트엔드)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
```

## 🔧 배포시 주의사항

### 1. 환경 변수 설정
- `.env` 파일을 생성하고 실제 값으로 수정
- 프론트엔드에서 백엔드 API URL 수정

### 2. CORS 설정
백엔드 `server.js`에서 프론트엔드 도메인 허용:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

### 3. 데이터베이스
- SQLite 파일이 서버에 존재하는지 확인
- 데이터 백업 정기적으로 수행

### 4. 보안
- API 엔드포인트에 적절한 인증 추가
- HTTPS 사용 (배포 플랫폼에서 자동 제공)

## 📞 지원

문제가 발생하면 GitHub Issues에 문의해주세요.
