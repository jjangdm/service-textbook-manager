@echo off
rem 배포용 빌드 스크립트 (Windows)

echo 🚀 교재 조회 시스템 배포 빌드 시작...

rem 프론트엔드 빌드
echo 📦 프론트엔드 빌드 중...
cd frontend
call npm install
call npm run build

echo ✅ 프론트엔드 빌드 완료!

rem 백엔드 의존성 설치
echo 📦 백엔드 의존성 설치 중...
cd ..\backend
call npm install

echo ✅ 백엔드 설정 완료!

cd ..
echo 🎉 배포 준비 완료!
echo.
echo 📋 다음 단계:
echo 1. frontend\build 폴더를 정적 호스팅 서비스에 업로드
echo 2. backend 폴더를 Node.js 호스팅 서비스에 배포
echo 3. 환경변수 설정 (.env 파일 생성)
echo.
echo 📖 자세한 내용은 DEPLOYMENT.md 파일을 참조하세요.

pause
