# 🚀 DigitalOcean App Platform 배포 가이드

## 전제 조건
- GitHub 저장소에 코드가 업로드되어 있어야 함
- DigitalOcean 계정 필요

## 📋 배포 단계

### 1단계: GitHub에 코드 푸시 (현재 필요한 단계)

터미널에서 다음 명령어를 실행하세요:

```bash
# 현재 디렉토리로 이동
cd /c/Users/JANGDONGMIN/django_project/service_textbook_manager

# Git 저장소 초기화 (이미 있다면 생략)
git init

# 원격 저장소 연결
git remote add origin https://github.com/jjangdm/service-textbook-manager.git

# 모든 파일 추가
git add .

# 커밋
git commit -m "DigitalOcean App Platform 배포 준비"

# GitHub에 푸시
git push -u origin main
```

### 2단계: DigitalOcean App Platform에서 앱 생성

1. **Apps** 메뉴에서 **Create App** 클릭
2. **GitHub** 선택
3. 저장소: **jjangdm/service-textbook-manager** 선택
4. 브랜치: **main** 선택
5. **Next** 클릭

### 3단계: 서비스 설정

#### 백엔드 서비스:
- **Service Name**: `backend`
- **Source Directory**: `backend`
- **Build Command**: `npm install` (자동 감지됨)
- **Run Command**: `npm start`
- **HTTP Port**: `8080`
- **Environment Variables**:
  ```
  NODE_ENV=production
  PORT=8080
  FRONTEND_URL=https://your-app-name.ondigitalocean.app
  ```

#### 프론트엔드 서비스:
- **Service Name**: `frontend`
- **Source Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables**:
  ```
  REACT_APP_API_URL=https://backend-your-app-name.ondigitalocean.app
  ```

### 4단계: 배포 실행

1. **Create Resources** 클릭
2. 배포 완료까지 5-10분 대기
3. 도메인 확인 및 테스트

## 💡 빠른 배포 방법

### 옵션 1: 수동 설정
위의 단계를 따라서 DigitalOcean 웹 인터페이스에서 설정

### 옵션 2: App Spec 사용
1. 저장소에 `.do/app.yaml` 파일이 있음 (이미 생성됨)
2. "App Spec" 탭에서 해당 파일 업로드
3. 자동으로 서비스 구성됨

## 🔧 환경 변수 설정

배포 후 다음 환경 변수들을 실제 도메인으로 업데이트:

### 백엔드:
- `FRONTEND_URL`: 실제 프론트엔드 도메인
- `NODE_ENV`: `production`
- `PORT`: `8080`

### 프론트엔드:
- `REACT_APP_API_URL`: 실제 백엔드 도메인

## 🚨 주의사항

1. **포트 설정**: DigitalOcean은 8080 포트 사용
2. **도메인**: 배포 완료 후 실제 도메인으로 환경변수 업데이트 필요
3. **데이터베이스**: SQLite 파일이 포함되어야 함 (현재 .gitignore에서 제외 필요)

## 💰 비용

- **Basic Plan**: $5/월 (512MB RAM, 1 vCPU)
- 첫 달 무료 크레딧 제공
