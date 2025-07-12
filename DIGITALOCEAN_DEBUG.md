# DigitalOcean Droplet 환경변수 설정 가이드

## 1. 프론트엔드 환경변수 설정

### .env 파일 생성 (frontend 폴더에)
```bash
# frontend/.env
REACT_APP_API_URL=http://mclass.store:5000
# 또는 프로덕션에서 같은 도메인을 사용한다면:
# REACT_APP_API_URL=http://mclass.store
```

### 빌드 시 환경변수 확인
```bash
cd frontend
echo $REACT_APP_API_URL
npm run build
```

## 2. 백엔드 환경변수 설정

### .env 파일 생성 (backend 폴더에)
```bash
# backend/.env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://mclass.store
```

## 3. nginx 설정 (만약 nginx를 사용중이라면)

### nginx.conf에서 API 프록시 설정
```nginx
server {
    listen 80;
    server_name mclass.store;
    
    # 프론트엔드 정적 파일
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API 요청을 백엔드로 프록시
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. PM2로 백엔드 실행 (추천)
```bash
cd backend
npm install -g pm2
pm2 start server.js --name "textbook-backend"
pm2 save
pm2 startup
```

## 5. 디버깅 명령어
```bash
# 백엔드 상태 확인
curl http://localhost:5000/api/admin/total-unpaid

# 프론트엔드 빌드 확인
cat frontend/build/static/js/main.*.js | grep "REACT_APP_API_URL"

# 서버 로그 확인
pm2 logs textbook-backend
```
