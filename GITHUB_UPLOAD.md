# GitHub에 업로드하는 방법

## 1. GitHub에서 새 저장소 생성
1. https://github.com 에 로그인
2. "New repository" 클릭
3. Repository name: `service-textbook-manager`
4. Description: `교재 미납/납부 조회 시스템 - Student Textbook Payment Management System`
5. Public 또는 Private 선택
6. "Create repository" 클릭 (README, .gitignore, license는 추가하지 마세요 - 이미 있음)

## 2. 로컬에서 GitHub에 연결 및 푸시
GitHub에서 저장소 생성 후 표시되는 URL을 사용하여 다음 명령어를 실행하세요:

```bash
# GitHub 저장소를 원격으로 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/service-textbook-manager.git

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

## 3. 추후 업데이트 방법
변경사항이 있을 때:
```bash
git add .
git commit -m "업데이트 내용 설명"
git push
```

## 주의사항
- `.gitignore`에 의해 다음 파일들은 GitHub에 업로드되지 않습니다:
  - node_modules/ (의존성 패키지)
  - *.db, *.sqlite (데이터베이스 파일)
  - debug_data.js, check_consistency.js (디버그 파일)
  
이는 보안과 저장소 크기 최적화를 위한 것입니다.
