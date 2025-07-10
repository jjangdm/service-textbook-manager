@echo off
echo ========================================
echo   교재 미납/납부 조회 시스템
echo ========================================
echo.
echo 기능:
echo - 학생별 미납/납부 교재 조회
echo - 관리자 모드: 납부 상태 변경, 교재 추가/삭제
echo.
echo Starting backend server...
cd backend
start cmd /k "node server.js"

echo Starting frontend...
cd ..\frontend
start cmd /k "npm start"

echo.
echo 서버가 시작되었습니다!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo 사용법:
echo 1. 학생 코드와 이름으로 조회
echo 2. "관리자 모드" 버튼으로 데이터 편집
echo.
pause
